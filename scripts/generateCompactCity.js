import { generateStreetLuau } from "../src/generators/street.js";
import { generateHouseLuau } from "../src/generators/house.js";
import { generateLandmarkLuau } from "../src/generators/landmarks.js";
import { generateTrafficSignageLuau } from "../src/generators/trafficSignage.js";
import { generateElevatedHighwayLuau } from "../src/generators/highway.js";
import { generateParkingLotLuau } from "../src/generators/parkingLot.js";
import { generatePocketParkLuau, generateCaliforniaPalmLuau } from "../src/generators/palmsAndParks.js";
import { generateAdjustLightingLuau, generateFocusCameraLuau } from "../src/generators/levelDesignTools.js";

const BRIDGE_URL = "http://127.0.0.1:30250/execute";

async function executePhase(name, luauCode) {
  console.log(`\n⏳ Ejecutando: ${name} (${luauCode.length} chars Luau)...`);
  const resp = await fetch(BRIDGE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: luauCode,
      actionName: name,
      timeoutMs: 30000,
    }),
  });

  const res = await resp.json();
  if (!resp.ok || !res.success) {
    throw new Error(`Fallo en fase "${name}": ${res.error || resp.statusText}`);
  }
  console.log(`✅ Completado: ${name}`);
  return res;
}

export async function buildCitySequentially() {
  console.log("==================================================");
  console.log("🏙️ GENERACIÓN COMPLETA DE CIUDAD GTA SAN ANDREAS");
  console.log("   Escala: 600 x 400 studs (Nivel de detalle AAA)");
  console.log("   Ubicación: Workspace.City_SanAndreas_Compact");
  console.log("==================================================");

  // FASE 1: Trazado Vial y Cruce Principal
  const phase1Luau = [
    `
local cityFolder = workspace:FindFirstChild("City_SanAndreas_Compact")
if cityFolder then cityFolder:Destroy() end

cityFolder = Instance.new("Folder")
cityFolder.Name = "City_SanAndreas_Compact"
cityFolder.Parent = workspace

local ground = Instance.new("Part", cityFolder)
ground.Name = "City_Ground_Base"
ground.Size = Vector3.new(600, 4, 400)
ground.CFrame = CFrame.new(0, -2, 0)
ground.Anchored = true
ground.Material = Enum.Material.Concrete
ground.Color = Color3.fromRGB(115, 118, 122)
ground.TopSurface = Enum.SurfaceType.Smooth
ground.BottomSurface = Enum.SurfaceType.Smooth
    `,
    generateStreetLuau({
      name: "Main_Avenue_EW",
      startPosition: [-290, 0, 0],
      endPosition: [290, 0, 0],
      roadWidth: 28,
      sidewalkWidth: 8,
      hasLanes: true,
      hasSidewalks: true,
      hasLamps: true,
      lampInterval: 48,
      parent: "City_SanAndreas_Compact/Streets"
    }),
    generateStreetLuau({
      name: "Boulevard_NS",
      startPosition: [0, 0, -190],
      endPosition: [0, 0, 190],
      roadWidth: 24,
      sidewalkWidth: 8,
      hasLanes: true,
      hasSidewalks: true,
      hasLamps: true,
      lampInterval: 48,
      parent: "City_SanAndreas_Compact/Streets"
    }),
    generateTrafficSignageLuau({
      type: "intersection_traffic_light",
      position: [16, 0, 18],
      rotationY: 180,
      parent: "City_SanAndreas_Compact/Signage"
    }),
    generateTrafficSignageLuau({
      type: "intersection_traffic_light",
      position: [-16, 0, -18],
      rotationY: 0,
      parent: "City_SanAndreas_Compact/Signage"
    }),
    generateTrafficSignageLuau({
      type: "street_name_sign",
      position: [-16, 0, 18],
      rotationY: 45,
      streetA: "GROVE ST",
      streetB: "COMMERCE AVE",
      parent: "City_SanAndreas_Compact/Signage"
    })
  ].join("\n\n");
  await executePhase("Fase 1: Infraestructura y Calles", phase1Luau);

  // FASE 2: Distrito Residencial (Grove St)
  const phase2Luau = [
    generateHouseLuau({
      name: "House_Grove_01",
      position: [-120, 0, 60],
      lotSize: [56, 72],
      style: "suburban_bungalow",
      rotationY: 180, // Mira hacia el norte (hacia la avenida)
      seed: 101,
      hasGarage: true,
      hasPorch: true,
      hasFence: true,
      hasYardProps: true,
      parent: "City_SanAndreas_Compact/Residential"
    }),
    generateHouseLuau({
      name: "House_Grove_02",
      position: [-180, 0, 60],
      lotSize: [56, 72],
      style: "suburban_bungalow",
      rotationY: 180, // Mira hacia el norte (hacia la avenida)
      seed: 102,
      hasGarage: true,
      hasPorch: true,
      hasFence: true,
      hasYardProps: true,
      parent: "City_SanAndreas_Compact/Residential"
    }),
    generateHouseLuau({
      name: "House_Grove_03",
      position: [-120, 0, -60],
      lotSize: [56, 72],
      style: "victorian_rowhouse",
      rotationY: 0, // Mira hacia el sur (hacia la avenida)
      seed: 201,
      hasGarage: false,
      hasPorch: true,
      hasFence: true,
      hasYardProps: true,
      parent: "City_SanAndreas_Compact/Residential"
    }),
    generateHouseLuau({
      name: "House_Grove_04",
      position: [-180, 0, -60],
      lotSize: [56, 72],
      style: "suburban_bungalow",
      rotationY: 0, // Mira hacia el sur (hacia la avenida)
      seed: 202,
      hasGarage: true,
      hasPorch: true,
      hasFence: true,
      hasYardProps: true,
      parent: "City_SanAndreas_Compact/Residential"
    }),
    // Palmeras californianas en la franja ajardinada de la acera (Z = 18 y Z = -18)
    generateCaliforniaPalmLuau({ position: [-70, 0, 18], height: 32, seed: 301, parent: "City_SanAndreas_Compact/Nature" }),
    generateCaliforniaPalmLuau({ position: [-150, 0, 18], height: 36, seed: 302, parent: "City_SanAndreas_Compact/Nature" }),
    generateCaliforniaPalmLuau({ position: [-215, 0, 18], height: 30, seed: 303, parent: "City_SanAndreas_Compact/Nature" }),
    generateCaliforniaPalmLuau({ position: [-70, 0, -18], height: 34, seed: 304, parent: "City_SanAndreas_Compact/Nature" }),
    generateCaliforniaPalmLuau({ position: [-150, 0, -18], height: 32, seed: 305, parent: "City_SanAndreas_Compact/Nature" }),
    generateCaliforniaPalmLuau({ position: [-215, 0, -18], height: 38, seed: 306, parent: "City_SanAndreas_Compact/Nature" })
  ].join("\n\n");
  await executePhase("Fase 2: Casas Residenciales y Palmeras", phase2Luau);

  // FASE 3: Parque Central Ajardinado
  const phase3Luau = generatePocketParkLuau({
    name: "Downtown_Pocket_Park",
    center: [-50, 0, 80],
    size: [64, 64],
    hasGazebo: true,
    hasFountain: true,
    parent: "City_SanAndreas_Compact/Parks"
  });
  await executePhase("Fase 3: Parque Central Ajardinado", phase3Luau);

  // FASE 4: Comercios, Servicios y Parking
  const phase4Luau = [
    generateLandmarkLuau({
      type: "gas_station",
      name: "Octane_Gas_24_7",
      position: [110, 0, -64],
      rotationY: 0,
      seed: 701,
      parent: "City_SanAndreas_Compact/Commercial"
    }),
    generateLandmarkLuau({
      type: "fast_food_diner",
      name: "Burger_Shot_Express",
      position: [110, 0, 64],
      rotationY: 0,
      seed: 801,
      parent: "City_SanAndreas_Compact/Commercial"
    }),
    generateLandmarkLuau({
      type: "police_station",
      name: "Precinct_09_Station",
      position: [210, 0, -64],
      rotationY: 0,
      seed: 901,
      parent: "City_SanAndreas_Compact/Civic"
    }),
    generateParkingLotLuau({
      name: "Commercial_Parking_Lot",
      center: [210, 0, 64],
      size: [84, 72],
      rows: 2,
      includeLandscaping: true,
      includeLightPoles: true,
      includePayStation: true,
      includeBarrierGate: true,
      parent: "City_SanAndreas_Compact/Parking"
    })
  ].join("\n\n");
  await executePhase("Fase 4: Comercios, Servicios y Parking", phase4Luau);

  // FASE 5: Autopista Elevada Norte
  const phase5Luau = generateElevatedHighwayLuau({
    name: "Interstate_Overpass_North",
    startPoint: [-280, 22, -140],
    endPoint: [280, 22, -140],
    roadWidth: 36,
    elevation: 22,
    includePiers: true,
    includeGantrySign: true,
    includeRamp: true,
    rampSide: "Right",
    parent: "City_SanAndreas_Compact/Highways"
  });
  await executePhase("Fase 5: Autopista Elevada Norte", phase5Luau);

  // FASE 6: Iluminación Cálida GTA San Andreas
  const phase6Luau = generateAdjustLightingLuau({
    clockTime: 17.5,
    exposure: 0.1,
    brightness: 2.2,
    outdoorAmbient: [140, 110, 85],
    fogEnd: 1200,
    fogColor: [220, 170, 120]
  });
  await executePhase("Fase 6: Iluminación Golden Hour GTA SA", phase6Luau);

  // FASE 7: Encuadre Cinemático de Cámara
  const phase7Luau = generateFocusCameraLuau({
    position: [180, 110, 210],
    lookAt: [0, 10, 0]
  });
  await executePhase("Fase 7: Encuadre Cinemático de Cámara", phase7Luau);

  console.log("\n🎉 CONSTRUCCIÓN COMPLETA EXITOSA!");
  console.log("   La ciudad compacta ya está activa e interactiva en Roblox Studio.");
}

// Ejecutar si se invoca directamente
if (process.argv[1] && process.argv[1].endsWith("generateCompactCity.js")) {
  buildCitySequentially().catch((err) => {
    console.error("❌ Error:", err.message);
    process.exit(1);
  });
}
