const { app, BrowserWindow, dialog } = require("electron");
const { spawn, spawnSync } = require("child_process");
const fs = require("fs");
const http = require("http");
const path = require("path");

let mainWindow = null;
let backendProcess = null;
let rendererServer = null;

const BACKEND_HOST = process.env.LARAVEL_HOST || "127.0.0.1";
const BACKEND_PORT = Number.parseInt(process.env.LARAVEL_PORT || "8000", 10);
const BACKEND_URL = `http://${BACKEND_HOST}:${BACKEND_PORT}`;
const BACKEND_HEALTH_URL = `${BACKEND_URL}/api/health`;
const SHOULD_START_BACKEND = process.env.ELECTRON_SKIP_BACKEND_START !== "1";
const RENDERER_HOST = process.env.ELECTRON_RENDERER_HOST || "127.0.0.1";
const RENDERER_PORT = Number.parseInt(process.env.ELECTRON_RENDERER_PORT || "4310", 10);
const RENDERER_URL = `http://${RENDERER_HOST}:${RENDERER_PORT}`;

const CONTENT_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function getBackendWorkingDirectory() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "backend");
  }

  return path.join(__dirname, "..", "backend");
}

function getRendererOutDirectory() {
  const candidates = [];

  if (app.isPackaged) {
    candidates.push(path.join(process.resourcesPath, "renderer", "out"));
    candidates.push(path.join(process.resourcesPath, "app.asar", "renderer", "out"));
    candidates.push(path.join(process.resourcesPath, "app.asar.unpacked", "renderer", "out"));
  }

  candidates.push(path.join(__dirname, "..", "renderer", "out"));
  candidates.push(path.join(process.cwd(), "renderer", "out"));

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return candidates[0];
}

function getPhpBinary() {
  if (process.env.LARAVEL_PHP_BIN) {
    return process.env.LARAVEL_PHP_BIN;
  }

  if (app.isPackaged) {
    const bundledPhp = path.join(process.resourcesPath, "php", process.platform === "win32" ? "php.exe" : "bin/php");
    if (fs.existsSync(bundledPhp)) {
      return bundledPhp;
    }
  }

  return "php";
}

function getRuntimeDirectories() {
  const root = path.join(app.getPath("userData"), "runtime");
  return {
    root,
    databaseDir: path.join(root, "database"),
    storageDir: path.join(root, "storage"),
    sqlitePath: path.join(root, "database", "inventory.sqlite"),
  };
}

function buildLaravelRuntimeEnv() {
  const env = {
    ...process.env,
    APP_URL: BACKEND_URL,
  };

  if (!app.isPackaged) {
    return env;
  }

  const runtimeDirs = getRuntimeDirectories();
  fs.mkdirSync(runtimeDirs.databaseDir, { recursive: true });
  fs.mkdirSync(runtimeDirs.storageDir, { recursive: true });

  if (!fs.existsSync(runtimeDirs.sqlitePath)) {
    fs.writeFileSync(runtimeDirs.sqlitePath, "");
  }

  return {
    ...env,
    APP_ENV: "production",
    APP_DEBUG: "false",
    DB_CONNECTION: "sqlite",
    DB_DATABASE: runtimeDirs.sqlitePath,
    APP_STORAGE_PATH: runtimeDirs.storageDir,
  };
}

function runArtisanCommand(commandArgs, laravelEnv) {
  const backendDirectory = getBackendWorkingDirectory();
  const phpBinary = getPhpBinary();
  const result = spawnSync(phpBinary, ["artisan", ...commandArgs], {
    cwd: backendDirectory,
    windowsHide: true,
    env: laravelEnv,
    encoding: "utf8",
  });

  if (result.stdout) {
    process.stdout.write(`[backend] ${result.stdout}`);
  }

  if (result.stderr) {
    process.stderr.write(`[backend] ${result.stderr}`);
  }

  if (result.error) {
    console.error(`[backend] Failed to run artisan ${commandArgs.join(" ")}:`, result.error.message);
    return false;
  }

  return result.status === 0;
}

function preparePackagedDatabase(laravelEnv) {
  if (!app.isPackaged) {
    return true;
  }

  const migrated = runArtisanCommand(["migrate", "--force"], laravelEnv);
  if (!migrated) {
    return false;
  }

  return runArtisanCommand(
    ["db:seed", "--class=Database\\Seeders\\RegisterProductSeeder", "--force"],
    laravelEnv
  );
}

function startLaravelBackend(laravelEnv) {
  const backendDirectory = getBackendWorkingDirectory();
  const phpBinary = getPhpBinary();
  const args = [
    "artisan",
    "serve",
    `--host=${BACKEND_HOST}`,
    `--port=${BACKEND_PORT}`,
  ];

  backendProcess = spawn(phpBinary, args, {
    cwd: backendDirectory,
    stdio: "pipe",
    shell: false,
    windowsHide: true,
    env: laravelEnv,
  });

  backendProcess.stdout?.on("data", (chunk) => {
    process.stdout.write(`[backend] ${chunk}`);
  });

  backendProcess.stderr?.on("data", (chunk) => {
    process.stderr.write(`[backend] ${chunk}`);
  });

  backendProcess.on("error", (error) => {
    console.error("[backend] Failed to start Laravel:", error.message);
  });

  backendProcess.on("exit", (code) => {
    if (code === 0 || code === null) return;
    console.error(`[backend] Laravel process exited with code ${code}`);
  });
}

async function waitForBackend(timeoutMs = 20000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(BACKEND_HEALTH_URL, { method: "GET" });
      if (response.ok) {
        return true;
      }
    } catch (_) {
      // backend may still be booting
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  return false;
}

function getResponseType(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  return CONTENT_TYPES[extension] || "application/octet-stream";
}

function resolveStaticFile(rootDirectory, pathname) {
  const normalizedPath = pathname === "/" ? "/index.html" : pathname;
  const decodedPath = decodeURIComponent(normalizedPath);
  const relativePath = decodedPath.replace(/^\/+/, "");
  const hasExtension = path.extname(relativePath) !== "";

  const candidates = [];
  if (relativePath.length === 0) {
    candidates.push("index.html");
  } else {
    candidates.push(relativePath);
    if (!hasExtension) {
      candidates.push(`${relativePath}.html`);
      candidates.push(path.join(relativePath, "index.html"));
    }
  }
  if (!hasExtension) {
    candidates.push("404.html");
  }

  for (const candidate of candidates) {
    const absolutePath = path.resolve(rootDirectory, candidate);
    if (!absolutePath.startsWith(path.resolve(rootDirectory))) {
      continue;
    }

    if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isFile()) {
      return absolutePath;
    }
  }

  return null;
}

async function startRendererServer() {
  if (!app.isPackaged) {
    return;
  }

  const rootDirectory = getRendererOutDirectory();
  if (!fs.existsSync(rootDirectory)) {
    throw new Error(`Renderer export folder not found at: ${rootDirectory}`);
  }

  rendererServer = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", RENDERER_URL);
    const filePath = resolveStaticFile(rootDirectory, requestUrl.pathname);

    if (!filePath) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not Found");
      return;
    }

    response.writeHead(200, { "Content-Type": getResponseType(filePath) });
    fs.createReadStream(filePath).pipe(response);
  });

  await new Promise((resolve, reject) => {
    rendererServer.once("error", reject);
    rendererServer.listen(RENDERER_PORT, RENDERER_HOST, () => {
      rendererServer?.removeListener("error", reject);
      resolve();
    });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 1100,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const isDev = !app.isPackaged;
  if (isDev) {
    const rendererUrl = process.env.ELECTRON_RENDERER_URL || "http://127.0.0.1:3000";
    void mainWindow.loadURL(rendererUrl);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    void mainWindow.loadURL(RENDERER_URL);
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function stopBackend() {
  if (!backendProcess) return;
  backendProcess.kill("SIGTERM");
  backendProcess = null;
}

function stopRendererServer() {
  if (!rendererServer) return;
  rendererServer.close();
  rendererServer = null;
}

app.whenReady().then(async () => {
  const laravelEnv = buildLaravelRuntimeEnv();

  if (SHOULD_START_BACKEND) {
    const prepared = preparePackagedDatabase(laravelEnv);
    if (!prepared) {
      await dialog.showMessageBox({
        type: "warning",
        title: "Database Setup Failed",
        message: "Failed to prepare local database.",
        detail: "Please check PHP installation and backend migration logs.",
      });
    }

    startLaravelBackend(laravelEnv);
    const backendReady = await waitForBackend();

    if (!backendReady) {
      await dialog.showMessageBox({
        type: "warning",
        title: "Backend Not Ready",
        message: "Laravel API did not start in time.",
        detail: `Please verify backend setup in: ${getBackendWorkingDirectory()}`,
      });
    }
  }

  if (app.isPackaged) {
    try {
      await startRendererServer();
    } catch (error) {
      await dialog.showMessageBox({
        type: "error",
        title: "Frontend Not Ready",
        message: "Failed to start local frontend server.",
        detail: error instanceof Error ? error.message : String(error),
      });
    }
  }

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("before-quit", () => {
  stopBackend();
  stopRendererServer();
});

app.on("window-all-closed", () => {
  stopBackend();
  stopRendererServer();
  if (process.platform !== "darwin") {
    app.quit();
  }
});
