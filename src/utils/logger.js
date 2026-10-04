import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGS_DIR = path.resolve(__dirname, "../../logs");
const JSONL_PATH = path.join(LOGS_DIR, "mcp-activity.jsonl");
const MAX_LOG_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB límite de rotación

const SESSION_ID = "sess_" + crypto.randomUUID().slice(0, 8);

// Asegurar que la carpeta logs exista
try {
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }
} catch (err) {
  console.error("[Logger] Error creando directorio de logs:", err);
}

/**
 * Rota el archivo de log si sobrepasa el tamaño máximo.
 */
async function checkRotation() {
  try {
    if (fs.existsSync(JSONL_PATH)) {
      const stat = await fs.promises.stat(JSONL_PATH);
      if (stat.size >= MAX_LOG_SIZE_BYTES) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const rotatedPath = path.join(LOGS_DIR, `mcp-activity-${timestamp}.jsonl`);
        await fs.promises.rename(JSONL_PATH, rotatedPath);
      }
    }
  } catch (err) {
    console.error("[Logger] Error en rotación de logs:", err);
  }
}

/**
 * Registra un evento estructurado en formato JSON Lines.
 * @param {Object} eventData
 */
export async function logEvent({
  event = "TOOL_CALL",
  tool = null,
  durationMs = 0,
  success = true,
  stats = {},
  params = {},
  error = null,
  extra = {}
}) {
  const entry = {
    timestamp: new Date().toISOString(),
    sessionId: SESSION_ID,
    event,
    tool,
    durationMs: Math.round(durationMs),
    success,
    stats,
    params: sanitizeParams(params),
    error: error ? (error.message || String(error)) : null,
    extra
  };

  try {
    await checkRotation();
    const line = JSON.stringify(entry) + "\n";
    await fs.promises.appendFile(JSONL_PATH, line, "utf8");
  } catch (err) {
    console.error("[Logger] Error escribiendo en log JSONL:", err);
  }
}

/**
 * Limpia y recorta parámetros muy extensos (ej. listas masivas de partes o código luau gigante)
 * para mantener los logs legibles y eficientes.
 */
function sanitizeParams(params) {
  if (!params || typeof params !== "object") return params;
  const sanitized = { ...params };

  if (Array.isArray(sanitized.parts_list)) {
    sanitized.parts_list = `[Array de ${sanitized.parts_list.length} partes]`;
  }
  if (typeof sanitized.code === "string" && sanitized.code.length > 200) {
    sanitized.code = sanitized.code.slice(0, 200) + "... [código recortado]";
  }

  return sanitized;
}

export { JSONL_PATH, LOGS_DIR, SESSION_ID };
