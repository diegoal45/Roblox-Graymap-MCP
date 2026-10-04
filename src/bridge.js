import express from "express";

const app = express();
app.use(express.json({ limit: "10mb" }));

const BRIDGE_PORT = 30250;
const BRIDGE_HOST = "127.0.0.1";

let pendingCommands = [];
const commandResolvers = new Map();
let lastStudioHeartbeat = 0;

// Polling endpoint consultado por el plugin de Roblox Studio
app.get("/poll", (req, res) => {
  lastStudioHeartbeat = Date.now();
  if (pendingCommands.length > 0) {
    const cmd = pendingCommands.shift();
    res.json(cmd);
  } else {
    res.status(204).send();
  }
});

// Endpoint de confirmación y reporte de ejecución desde el plugin
app.post("/response", (req, res) => {
  lastStudioHeartbeat = Date.now();
  const { id, success, error, stats } = req.body;
  if (commandResolvers.has(id)) {
    const { resolve, reject, timer } = commandResolvers.get(id);
    clearTimeout(timer);
    commandResolvers.delete(id);

    if (success) {
      resolve({ success: true, stats: stats || {} });
    } else {
      reject(new Error(error || "Error de ejecución Luau en Roblox Studio."));
    }
  }
  res.json({ acknowledged: true });
});

// Endpoint de estado del bridge
app.get("/status", (req, res) => {
  const isConnected = Date.now() - lastStudioHeartbeat < 4000;
  res.json({
    bridgeRunning: true,
    studioConnected: isConnected,
    secondsSinceLastPing: Math.floor((Date.now() - lastStudioHeartbeat) / 1000),
    pendingInQueue: pendingCommands.length,
  });
});

let serverInstance = null;

export function startBridge() {
  if (serverInstance) return;
  serverInstance = app.listen(BRIDGE_PORT, BRIDGE_HOST, () => {
    // Los logs deben ser a stderr para no interferir con el transporte stdio de MCP
    console.error(`[Bridge] Servidor HTTP local activo en http://${BRIDGE_HOST}:${BRIDGE_PORT}`);
  });
}

export function isStudioConnected() {
  return Date.now() - lastStudioHeartbeat < 4000;
}

export function getStudioStatusInfo() {
  const connected = isStudioConnected();
  const diffSec = Math.floor((Date.now() - lastStudioHeartbeat) / 1000);
  return {
    connected,
    lastHeartbeatSecondsAgo: lastStudioHeartbeat > 0 ? diffSec : null,
  };
}

export function sendToRoblox(luauCode, actionName = "Graybox Action", timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const id = "cmd_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);

    const timer = setTimeout(() => {
      commandResolvers.delete(id);
      const isAlive = isStudioConnected();
      if (!isAlive) {
        reject(
          new Error(
            "Timeout: Roblox Studio no está conectado al bridge.\n" +
            "1. Asegúrate de tener Roblox Studio abierto con un lugar cargado.\n" +
            "2. Verifica que el plugin 'GrayboxBridge' esté activo.\n" +
            "3. Revisa en 'Game Settings > Security' que 'Allow HTTP Requests' esté activado."
          )
        );
      } else {
        reject(new Error(`Timeout tras ${timeoutMs / 1000}s esperando que Roblox Studio complete: ${actionName}`));
      }
    }, timeoutMs);

    commandResolvers.set(id, { resolve, reject, timer });
    pendingCommands.push({ id, code: luauCode, actionName });
  });
}
