import fs from "fs";
import readline from "readline";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_PATH = path.resolve(__dirname, "../../logs/mcp-activity.jsonl");

async function analyze() {
  if (!fs.existsSync(LOG_PATH)) {
    console.log("\n========================================================");
    console.log("ℹ️  No hay archivo de logs en logs/mcp-activity.jsonl.");
    console.log("   Ejecuta herramientas desde OpenCode para generar actividad.");
    console.log("========================================================\n");
    return;
  }

  const fileStream = fs.createReadStream(LOG_PATH);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let totalEvents = 0;
  let successCount = 0;
  let errorCount = 0;
  let totalDurationMs = 0;
  let minDurationMs = Infinity;
  let maxDurationMs = 0;
  let totalPartsBuilt = 0;

  const toolStats = {};
  const recentErrors = [];
  const sessions = new Set();
  let firstTimestamp = null;
  let lastTimestamp = null;

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
      const entry = JSON.parse(line);
      totalEvents++;

      if (!firstTimestamp) firstTimestamp = entry.timestamp;
      lastTimestamp = entry.timestamp;

      if (entry.sessionId) sessions.add(entry.sessionId);

      if (entry.success) {
        successCount++;
      } else {
        errorCount++;
        recentErrors.push({
          timestamp: entry.timestamp,
          tool: entry.tool || "desconocido",
          error: entry.error || "Error sin mensaje",
        });
      }

      const dur = entry.durationMs || 0;
      totalDurationMs += dur;
      if (dur < minDurationMs) minDurationMs = dur;
      if (dur > maxDurationMs) maxDurationMs = dur;

      // Acumular partes construidas si existen estadísticas
      if (entry.stats) {
        if (typeof entry.stats.partsCreated === "number") {
          totalPartsBuilt += entry.stats.partsCreated;
        } else if (typeof entry.stats.count === "number") {
          totalPartsBuilt += entry.stats.count;
        }
      }

      // Desglose por herramienta
      const toolName = entry.tool || "otro";
      if (!toolStats[toolName]) {
        toolStats[toolName] = { calls: 0, successes: 0, errors: 0, totalMs: 0 };
      }
      toolStats[toolName].calls++;
      if (entry.success) {
        toolStats[toolName].successes++;
      } else {
        toolStats[toolName].errors++;
      }
      toolStats[toolName].totalMs += dur;
    } catch (e) {
      // Ignorar líneas corruptas
    }
  }

  if (totalEvents === 0) {
    console.log("\n⚠️  El archivo de logs está vacío.\n");
    return;
  }

  const avgDuration = Math.round(totalDurationMs / totalEvents);
  const successRate = ((successCount / totalEvents) * 100).toFixed(1);

  console.log("\n╔════════════════════════════════════════════════════════════════╗");
  console.log("║         📊 RESUMEN DE ACTIVIDAD Y TELEMETRÍA ROBLOX MCP        ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");
  console.log(` 🕒 Período:        ${firstTimestamp ? firstTimestamp.slice(0, 19).replace("T", " ") : "N/A"} -> ${lastTimestamp ? lastTimestamp.slice(0, 19).replace("T", " ") : "N/A"}`);
  console.log(` 🔄 Sesiones:       ${sessions.size} sesión(es) registradas`);
  console.log(` ⚡ Total Comandos: ${totalEvents}`);
  console.log(` ✅ Exitosos:       ${successCount} (${successRate}%)`);
  console.log(` ❌ Errores:        ${errorCount}`);
  console.log(` 🏗️  Partes Creadas: ${totalPartsBuilt.toLocaleString()} partes en Roblox Studio`);
  console.log(` ⏱️  Latencia:       Promedio: ${avgDuration}ms | Mín: ${minDurationMs === Infinity ? 0 : minDurationMs}ms | Máx: ${maxDurationMs}ms`);
  console.log("──────────────────────────────────────────────────────────────────");
  console.log(" 🛠️  DESGLOSE POR HERRAMIENTA:");
  console.log("──────────────────────────────────────────────────────────────────");
  console.log(
    " Herramienta".padEnd(28) +
    "Llamadas".padStart(10) +
    "Éxito".padStart(10) +
    "Promedio".padStart(12)
  );
  console.log(" --------------------------------------------------------------");

  const sortedTools = Object.entries(toolStats).sort((a, b) => b[1].calls - a[1].calls);
  for (const [name, s] of sortedTools) {
    const avg = Math.round(s.totalMs / s.calls);
    const rate = Math.round((s.successes / s.calls) * 100) + "%";
    console.log(
      ` ${name.padEnd(26)}` +
      `${String(s.calls).padStart(9)} ` +
      `${rate.padStart(9)} ` +
      `${(avg + "ms").padStart(11)}`
    );
  }

  if (recentErrors.length > 0) {
    console.log("──────────────────────────────────────────────────────────────────");
    console.log(" ⚠️  ÚLTIMOS ERRORES REGISTRADOS (máx. 5):");
    console.log("──────────────────────────────────────────────────────────────────");
    const lastErrors = recentErrors.slice(-5);
    for (const err of lastErrors) {
      const time = err.timestamp ? err.timestamp.slice(11, 19) : "";
      console.log(` [${time}] ${err.tool}: ${err.error.slice(0, 75)}`);
    }
  }
  console.log("══════════════════════════════════════════════════════════════════\n");
}

analyze().catch((err) => {
  console.error("Error analizando logs:", err);
});
