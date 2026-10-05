import express from "express";

const app = express();
// Límite de 50mb para soportar lotes grandes de geometría JSON
app.use(express.json({ limit: "50mb" }));

const BRIDGE_PORT = 30250;
const BRIDGE_HOST = "127.0.0.1";

let pendingCommands = [];
const commandResolvers = new Map();
let lastStudioHeartbeat = 0;

// Polling endpoint consultado continuamente por el plugin de Roblox Studio
app.get("/poll", (req, res) => {
  lastStudioHeartbeat = Date.now();
  if (pendingCommands.length > 0) {
    const cmd = pendingCommands.shift();
    res.json(cmd);
  } else {
    res.status(204).send();
  }
});

// Endpoint de confirmación y reporte de ejecución o lectura desde el plugin
app.post("/response", (req, res) => {
  lastStudioHeartbeat = Date.now();
  const { id, success, error, stats, data } = req.body;
  if (commandResolvers.has(id)) {
    const { resolve, reject, timer } = commandResolvers.get(id);
    clearTimeout(timer);
    commandResolvers.delete(id);

    if (success) {
      resolve({ success: true, stats: stats || {}, data: data || null });
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

// Endpoint para recibir comandos de ejecución desde cualquier cliente externo (Antigravity, curl, scripts)
app.post("/execute", async (req, res) => {
  const { code, actionName = "API Execute", extraPayload = {}, timeoutMs = 45000 } = req.body;
  if (!code) {
    return res.status(400).json({ error: "Missing 'code' field in request body" });
  }
  try {
    const result = await sendToRoblox(code, actionName, extraPayload, timeoutMs);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

let serverInstance = null;
let isBridgeServer = false;

export function startBridge() {
  if (serverInstance || isBridgeServer) return;
  try {
    serverInstance = app.listen(BRIDGE_PORT, BRIDGE_HOST, () => {
      isBridgeServer = true;
      console.error(`[Bridge] Servidor HTTP local activo en http://${BRIDGE_HOST}:${BRIDGE_PORT}`);
    });
    serverInstance.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(`[Bridge] Puerto ${BRIDGE_PORT} ya ocupado. Operando en modo cliente forwarder.`);
        isBridgeServer = false;
        serverInstance = null;
      } else {
        console.error("[Bridge] Error en servidor HTTP:", err);
      }
    });
  } catch (e) {
    isBridgeServer = false;
  }
}

export async function isStudioConnected() {
  if (!isBridgeServer) {
    try {
      const resp = await fetch(`http://${BRIDGE_HOST}:${BRIDGE_PORT}/status`);
      if (resp.ok) {
        const data = await resp.json();
        return !!data.studioConnected;
      }
    } catch (e) {
      return false;
    }
  }
  return Date.now() - lastStudioHeartbeat < 4000;
}

export async function getStudioStatusInfo() {
  if (!isBridgeServer) {
    try {
      const resp = await fetch(`http://${BRIDGE_HOST}:${BRIDGE_PORT}/status`);
      if (resp.ok) {
        const data = await resp.json();
        return {
          connected: !!data.studioConnected,
          lastHeartbeatSecondsAgo: data.secondsSinceLastPing,
        };
      }
    } catch (e) {}
  }
  const connected = Date.now() - lastStudioHeartbeat < 4000;
  const diffSec = Math.floor((Date.now() - lastStudioHeartbeat) / 1000);
  return {
    connected,
    lastHeartbeatSecondsAgo: lastStudioHeartbeat > 0 ? diffSec : null,
  };
}

/**
 * Envía una carga de trabajo a Roblox Studio y espera su confirmación o respuesta con datos.
 * @param {string} luauCode - Código Luau a ejecutar
 * @param {string} actionName - Nombre de la acción para ChangeHistoryService
 * @param {object} extraPayload - Datos adicionales (ej. queries para get_workspace_layout)
 * @param {number} timeoutMs - Tiempo límite de espera
 */
export async function sendToRoblox(luauCode, actionName = "Graybox Action", extraPayload = {}, timeoutMs = 45000) {
  if (!isBridgeServer) {
    try {
      const resp = await fetch(`http://${BRIDGE_HOST}:${BRIDGE_PORT}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: luauCode, actionName, extraPayload, timeoutMs }),
      });
      if (resp.ok) {
        return await resp.json();
      }
    } catch (e) {
      // Si la conexión falla, continúa con la cola local
    }
  }

  return new Promise((resolve, reject) => {
    const id = "cmd_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);

    const timer = setTimeout(() => {
      commandResolvers.delete(id);
      const isAlive = isStudioConnected();
      if (!isAlive) {
        reject(
          new Error(
            "Timeout: Roblox Studio no está conectado al bridge.\n" +
            "1. Asegúrate de tener Roblox Studio abierto con un mapa cargado.\n" +
            "2. Verifica que el botón 'Graybox MCP' esté activo en la pestaña Plugins.\n" +
            "3. Revisa en 'Game Settings > Security' que 'Allow HTTP Requests' esté activado."
          )
        );
      } else {
        reject(new Error(`Timeout tras ${timeoutMs / 1000}s esperando que Roblox Studio complete: ${actionName}`));
      }
    }, timeoutMs);

    commandResolvers.set(id, { resolve, reject, timer });
    pendingCommands.push({ id, code: luauCode, actionName, ...extraPayload });
  });
}
