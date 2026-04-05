const { contextBridge } = require("electron");

const host = process.env.LARAVEL_HOST || "127.0.0.1";
const port = process.env.LARAVEL_PORT || "8000";

contextBridge.exposeInMainWorld("desktopConfig", {
  apiBaseUrl: `http://${host}:${port}/api`,
});
