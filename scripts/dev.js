const { spawn } = require("child_process");

let shuttingDown = false;

function startTask(label, args) {
  const env = { ...process.env };
  delete env.ELECTRON_RUN_AS_NODE;

  const child =
    process.platform === "win32"
      ? spawn(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", `npm ${args.join(" ")}`], {
          stdio: "inherit",
          shell: false,
          env,
        })
      : spawn("npm", args, {
          stdio: "inherit",
          shell: false,
          env,
        });

  child.on("error", (error) => {
    console.error(`[${label}] failed to start:`, error.message);
    shutdown(1);
  });

  child.on("exit", (code, signal) => {
    if (shuttingDown) return;
    if (code === 0 || signal === "SIGTERM") return;

    const status = signal ? `signal ${signal}` : `exit code ${code}`;
    console.error(`[${label}] exited with ${status}`);
    shutdown(code || 1);
  });

  return child;
}

const nextProcess = startTask("next", ["run", "dev:next"]);
const electronProcess = startTask("electron", ["run", "dev:electron"]);
const processes = [nextProcess, electronProcess];

function shutdown(exitCode) {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of processes) {
    if (child && !child.killed) {
      child.kill("SIGTERM");
    }
  }

  process.exit(exitCode);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
