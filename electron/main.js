const { app, BrowserWindow, dialog } = require("electron");
const { spawn } = require("child_process");
const path = require("path");

let mainWindow = null;
let backendProcess = null;

const BACKEND_HOST = process.env.LARAVEL_HOST || "127.0.0.1";
const BACKEND_PORT = Number.parseInt(process.env.LARAVEL_PORT || "8000", 10);
const BACKEND_URL = `http://${BACKEND_HOST}:${BACKEND_PORT}`;
const BACKEND_HEALTH_URL = `${BACKEND_URL}/api/health`;
const SHOULD_START_BACKEND = process.env.ELECTRON_SKIP_BACKEND_START !== "1";

function getBackendWorkingDirectory() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "backend");
  }

  return path.join(__dirname, "..", "backend");
}

function startLaravelBackend() {
  const backendDirectory = getBackendWorkingDirectory();
  const phpBinary = process.env.LARAVEL_PHP_BIN || "php";
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
    env: {
      ...process.env,
      APP_URL: BACKEND_URL,
    },
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
    void mainWindow.loadFile(path.join(__dirname, "../renderer/out/index.html"));
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

app.whenReady().then(async () => {
  if (SHOULD_START_BACKEND) {
    startLaravelBackend();
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

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("before-quit", () => {
  stopBackend();
});

app.on("window-all-closed", () => {
  stopBackend();
  if (process.platform !== "darwin") {
    app.quit();
  }
});
