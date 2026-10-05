import { generateCityMasterplanPhases, generateCityMasterplanLuau } from "../src/generators/cityMasterplan.js";

const BRIDGE_URL = "http://127.0.0.1:30250/execute";

// Parsear argumentos de línea de comandos (ej: node generateCity.js --theme=schedule_1_coastal --size=1500)
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    theme: "schedule_1_coastal",
    size: [1200, 1200],
    name: "City_Procedural_Masterplan",
    seed: 7777,
    density: "high",
  };

  for (const arg of args) {
    if (arg.startsWith("--theme=")) {
      options.theme = arg.split("=")[1];
    } else if (arg.startsWith("--size=")) {
      const sVal = arg.split("=")[1];
      if (sVal.includes("x")) {
        options.size = sVal.split("x").map(Number);
      } else {
        const n = Number(sVal);
        options.size = [n, n];
      }
    } else if (arg.startsWith("--name=")) {
      options.name = arg.split("=")[1];
    } else if (arg.startsWith("--seed=")) {
      options.seed = Number(arg.split("=")[1]);
    } else if (arg.startsWith("--density=")) {
      options.density = arg.split("=")[1];
    }
  }

  return options;
}

async function executePhase(name, luauCode) {
  console.log(`\n⏳ Generando: ${name} (${luauCode.length} chars Luau)...`);
  try {
    const resp = await fetch(BRIDGE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: luauCode,
        actionName: name,
        timeoutMs: 45000,
      }),
    });

    const res = await resp.json();
    if (!resp.ok || !res.success) {
      throw new Error(`Fallo en fase "${name}": ${res.error || resp.statusText}`);
    }
    console.log(`✅ Completado: ${name}`);
    return res;
  } catch (err) {
    if (err.message.includes("fetch failed") || err.message.includes("ECONNREFUSED")) {
      console.warn(`⚠️ Roblox Studio no conectado en ${BRIDGE_URL}. El código Luau fue generado y validado con éxito.`);
      return { success: false, offline: true };
    }
    throw err;
  }
}

async function run() {
  const options = parseArgs();

  console.log("=========================================================================");
  console.log(`🌆 GENERADOR PROCEDURAL DE CIUDADES COMPLETAS (AAA)`);
  console.log(`   Nombre: ${options.name}`);
  console.log(`   Temática: ${options.theme}`);
  console.log(`   Dimensiones: ${options.size[0]} x ${options.size[1]} studs`);
  console.log(`   Densidad: ${options.density} | Semilla: ${options.seed}`);
  console.log("=========================================================================");

  const phases = generateCityMasterplanPhases(options);
  console.log(`📋 Plan maestro descompuesto en ${phases.length} fases secuenciales.`);

  let totalChars = 0;
  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i];
    totalChars += phase.luauCode.length;
    console.log(`   [${i + 1}/${phases.length}] ${phase.name} (${phase.luauCode.length} chars)`);
  }

  console.log(`\n🚀 Ejecutando fases en Roblox Studio vía Bridge HTTP...`);
  let executedCount = 0;
  let isOffline = false;

  for (const phase of phases) {
    const res = await executePhase(phase.name, phase.luauCode);
    if (res.offline) {
      isOffline = true;
      break;
    }
    executedCount++;
  }

  if (isOffline) {
    console.log(`\n💡 NOTA: Abre Roblox Studio con el plugin GrayboxBridge activo para inyectar la ciudad automáticamente.`);
    console.log(`   Total código Luau compilado: ${totalChars} caracteres listos.`);
  } else {
    console.log(`\n🎉 CIUDAD COMPLETA GENERADA CON ÉXITO EN ROBLOX STUDIO (${executedCount}/${phases.length} fases)!`);
  }
}

run().catch((err) => {
  console.error("❌ Error ejecutando generateCity:", err);
  process.exit(1);
});
