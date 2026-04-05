const { spawn } = require("child_process");

const env = { ...process.env };
delete env.ELECTRON_RUN_AS_NODE;

const electronBinary = require("electron");
const child = spawn(electronBinary, ["."], {
  stdio: "inherit",
  env,
});

child.on("error", (error) => {
  console.error("Failed to start Electron:", error.message);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.exit(1);
  }

  process.exit(code ?? 0);
});
