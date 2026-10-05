import { snapVal } from "./grid.js";
import { URBAN_METRICS, calculateLotPlacement } from "./urbanMetrics.js";

// Importación de todos los generadores modulares AAA del sistema
import { generateDocksLuau } from "./docks.js";
import { generateStorageFacilityLuau } from "./storageFacility.js";
import { generateStormCanalLuau } from "./stormCanal.js";
import { generateBridgeLuau } from "./bridge.js";
import { generateElevatedHighwayLuau } from "./highway.js";
import { generateDetailedBuildingLuau } from "./detailedBuilding.js";
import { generateShadyBusinessLuau } from "./shadyBusiness.js";
import { generateMotelLuau } from "./motel.js";
import { generateHouseLuau } from "./house.js";
import { generateFavelaDistrictLuau } from "./favela.js";
import { generateStreetLuau } from "./street.js";
import { generateStreetFurnitureLuau } from "./streetFurniture.js";
import { generateTrafficSignageLuau } from "./trafficSignage.js";
import { generateParkingLotLuau } from "./parkingLot.js";
import { generatePocketParkLuau, generateCaliforniaPalmLuau } from "./palmsAndParks.js";
import { generateCurvedRoadLuau, generateCulDeSacLuau } from "./roadNetwork.js";
import { generateAdjustLightingLuau } from "./levelDesignTools.js";

/**
 * MOTOR DE MASTERPLAN URBANO Y GENERACIÓN DE CIUDADES COMPLETAS (AAA)
 * 
 * Transforma un requerimiento temático ("schedule_1_coastal", "gta_san_andreas", "modern_metropolis", "favela_sprawl")
 * y unas dimensiones (ej: 800x800, 1500x1500, 3000x3000) en un mapa coherente, poblado y estructurado en capas:
 * 
 * 1. Capa Geográfica / Terreno Base y Masas de Agua (Océano o Canal pluvial)
 * 2. Capa Vertebradora / Infraestructuras Macro (Autopistas, Puentes, Diques)
 * 3. Red Vial Jerárquica (Avenidas principales con mediana, calles secundarias y callejones de servicio)
 * 4. Zonificación y Loteo con Frontage Real (las casas y negocios miran a la calzada con su setback)
 * 5. Asignación de Edificios Temáticos (Casas con porches/garajes, rascacielos con terrazas, moteles, trasteros clandestinos)
 * 6. Mobiliario Urbano, Alumbrado y Red Eléctrica Aérea (Postes con cables tendidos, farolas, palmeras, bocas de riego)
 * 7. Capa de Atmósfera y Mecánicas de Juego (Zonas de control de pandillas Turf Wars, Dead Drops, iluminación)
 */

export function generateCityMasterplanPhases({
  name = "City_Masterplan",
  theme = "schedule_1_coastal", // "schedule_1_coastal", "gta_san_andreas", "modern_metropolis", "favela_sprawl"
  roadPattern = "organic_coastal", // "organic_coastal", "grid", "hillside_switchback"
  center = [0, 0, 0],
  size = [1200, 1200], // [widthX, lengthZ]
  seed = 7777,
  density = "high", // "high", "medium", "low"
  includeCanal = null, // auto según theme si es null
  includeHighway = null,
  includeDocks = null,
  includeTurfMechanics = true,
  parent = "Workspace",
}) {
  const [cx, cy, cz] = [snapVal(center[0], 4), snapVal(center[1], 4), snapVal(center[2], 4)];
  const [totalW, totalL] = [Math.max(600, snapVal(size[0], 4)), Math.max(600, snapVal(size[1] || size[2] || 1200, 4))];
  const effectiveSeed = typeof seed === "number" ? seed : 7777;

  // Parámetros derivados según temática
  const isSchedule1 = theme === "schedule_1_coastal";
  const isGtaSa = theme === "gta_san_andreas";
  const isMetropolis = theme === "modern_metropolis";
  const isFavela = theme === "favela_sprawl";

  const hasCanal = includeCanal !== null ? !!includeCanal : (isGtaSa || totalL >= 2000);
  const hasHighway = includeHighway !== null ? !!includeHighway : (isGtaSa || isMetropolis || totalW >= 1500);
  const hasDocks = includeDocks !== null ? !!includeDocks : (isSchedule1 || (!isFavela && totalL >= 1200));

  const phases = [];
  const cityRootFolder = `${name}`;

  // ---------------------------------------------------------------------------
  // FASE 0: BASE MAP, JERARQUÍA DE CARPETAS Y AGUA
  // ---------------------------------------------------------------------------
  const halfW = totalW / 2;
  const halfL = totalL / 2;

  let oceanCode = "";
  if (hasDocks || isSchedule1) {
    const oceanDepth = Math.max(300, totalL * 0.25);
    const oceanZ = cz + halfL - oceanDepth / 2;
    oceanCode = `
-- Océano del Puerto Marítimo al Sur
local ocean = Instance.new("Part", cityFolder)
ocean.Name = "Port_Deep_Ocean"
ocean.Size = Vector3.new(${totalW + 200}, 24, ${oceanDepth})
ocean.CFrame = CFrame.new(${cx}, ${cy - 12}, ${oceanZ})
ocean.Anchored = true
ocean.CanCollide = false
ocean.Material = Enum.Material.Water
ocean.Color = Color3.fromRGB(24, 72, 102)
ocean.Transparency = 0.35
`;
  }

  const phase0Luau = `
local root = workspace
local old = root:FindFirstChild("${cityRootFolder}")
if old then old:Destroy() end

local cityFolder = Instance.new("Folder")
cityFolder.Name = "${cityRootFolder}"
cityFolder.Parent = root

-- Jerarquía estructurada por sectores urbanos
local subfolders = {
    "Infrastructure", "Roads", "Zoning_Commercial", "Zoning_Residential",
    "Zoning_Industrial", "Zoning_Downtown", "Street_Furniture", "Gameplay_Systems"
}
for _, sub in ipairs(subfolders) do
    local f = Instance.new("Folder")
    f.Name = sub
    f.Parent = cityFolder
end

-- Base principal de asfalto y suelo urbano (Cota Y = ${cy - 2.5})
local ground = Instance.new("Part", cityFolder)
ground.Name = "Ground_Urban_Base"
ground.Size = Vector3.new(${totalW}, 4, ${totalL})
ground.CFrame = CFrame.new(${cx}, ${cy - 2.5}, ${cz})
ground.Anchored = true
ground.Material = Enum.Material.Concrete
ground.Color = Color3.fromRGB(110, 114, 118)
ground.TopSurface = Enum.SurfaceType.Smooth
ground.BottomSurface = Enum.SurfaceType.Smooth
${oceanCode}
`;
  phases.push({ name: "Fase 0: Inicialización del Mapa y Terreno Base", luauCode: phase0Luau });

  // ---------------------------------------------------------------------------
  // FASE 1: GRANDES INFRAESTRUCTURAS (CANAL, DIQUES Y PUERTOS)
  // ---------------------------------------------------------------------------
  if (hasCanal) {
    const canalWidth = URBAN_METRICS.ROADS.CANAL_WIDTH_STANDARD;
    const canalDepth = URBAN_METRICS.ROADS.CANAL_DEPTH_STANDARD;
    const canalZ = cz; // Canal central este-oeste

    const canalWest = generateStormCanalLuau({
      name: "Storm_Canal_West",
      position: [cx - totalW / 4, cy - canalDepth, canalZ],
      length: totalW / 2 + 10,
      width: canalWidth,
      depth: canalDepth,
      rotationY: 90,
      includeWater: true,
      includePipeBridge: true,
      includeCulvertPipes: true,
      includeGuardrails: true,
      parent: `${cityRootFolder}/Infrastructure`,
    });
    const canalEast = generateStormCanalLuau({
      name: "Storm_Canal_East",
      position: [cx + totalW / 4, cy - canalDepth, canalZ],
      length: totalW / 2 + 10,
      width: canalWidth,
      depth: canalDepth,
      rotationY: 90,
      includeWater: true,
      includePipeBridge: false,
      includeCulvertPipes: true,
      includeGuardrails: true,
      parent: `${cityRootFolder}/Infrastructure`,
    });
    phases.push({ name: "Fase 1A: Gran Canal Pluvial (Tramo Completo)", luauCode: canalWest + "\n" + canalEast });

    // Puentes sobre el canal
    const bridgeCenter = generateBridgeLuau({
      name: "Main_Artery_Bridge",
      position: [cx, cy, canalZ],
      length: canalWidth + 16,
      width: URBAN_METRICS.ROADS.BOULEVARD_4LANE.totalWidth,
      height: 14,
      rotationY: 0,
      style: "modern_concrete",
      hasArches: false,
      hasPillars: true,
      hasGuardrails: true,
      hasLamps: true,
      parent: `${cityRootFolder}/Infrastructure`,
    });
    phases.push({ name: "Fase 1B: Puentes Estratégicos sobre el Canal", luauCode: bridgeCenter });
  }

  // ---------------------------------------------------------------------------
  // FASE 2: PUERTO MARÍTIMO / DOCKS E INDUSTRIAL (SI APLICA)
  // ---------------------------------------------------------------------------
  if (hasDocks) {
    const dockZ = cz + halfL - 140;
    const docksLuau = generateDocksLuau({
      name: "Seaport_Terminal_Docks",
      position: [cx + totalW * 0.15, cy, dockZ],
      size: [Math.min(300, totalW * 0.45), 140],
      rotationY: 0,
      waterLevel: cy - 2,
      containerCount: totalW >= 1500 ? 32 : 18,
      includeWarehouse: true,
      seed: effectiveSeed + 101,
      parent: `${cityRootFolder}/Zoning_Industrial`,
    });

    const storageLuau = generateStorageFacilityLuau({
      name: "SafeVault_Storage_Units",
      position: [cx - totalW * 0.25, cy, dockZ - 10],
      rows: 2,
      unitsPerRow: 7,
      rotationY: 90,
      includeOffice: true,
      includeFence: true,
      doorColorStyle: "orange",
      hasSecretLabUnit: true,
      parent: `${cityRootFolder}/Zoning_Industrial`,
    });

    phases.push({ name: "Fase 2: Sector Industrial Portuario y Trasteros Clandestinos", luauCode: docksLuau + "\n" + storageLuau });
  }

  // ---------------------------------------------------------------------------
  // FASE 3: RED VIAL JERÁRQUICA (AVENIDAS, CALLES Y ACERAS)
  // ---------------------------------------------------------------------------
  const roadLuauList = [];

  // 3A. Gran Bulevar Central Norte-Sur (4 carriles con mediana y palmeras)
  const mainAvenueNS = generateStreetLuau({
    name: "Grand_Boulevard_NS",
    startPosition: [cx, cy, cz - halfL + 30],
    endPosition: [cx, cy, hasDocks ? cz + halfL - 220 : cz + halfL - 30],
    roadWidth: URBAN_METRICS.ROADS.BOULEVARD_4LANE.totalWidth,
    sidewalkWidth: URBAN_METRICS.SIDEWALKS.COMMERCIAL,
    hasLanes: true,
    hasSidewalks: true,
    hasLamps: true,
    lampInterval: 50,
    parent: `${cityRootFolder}/Roads`,
  });
  roadLuauList.push(mainAvenueNS);

  // 3B. Avenidas Transversales Este-Oeste (Bulevares comerciales y residenciales)
  const northStreetZ = cz - halfL * 0.55;
  const streetEW_North = generateStreetLuau({
    name: "Avenue_North_EW",
    startPosition: [cx - halfW + 30, cy, northStreetZ],
    endPosition: [cx + halfW - 30, cy, northStreetZ],
    roadWidth: URBAN_METRICS.ROADS.STREET_WITH_PARKING.totalWidth,
    sidewalkWidth: URBAN_METRICS.SIDEWALKS.STANDARD,
    hasLanes: true,
    hasSidewalks: true,
    hasLamps: true,
    lampInterval: 48,
    parent: `${cityRootFolder}/Roads`,
  });
  roadLuauList.push(streetEW_North);

  const southStreetZ = hasCanal ? cz + halfL * 0.45 : cz + halfL * 0.25;
  const streetEW_South = generateStreetLuau({
    name: "Commercial_Strip_EW",
    startPosition: [cx - halfW + 30, cy, southStreetZ],
    endPosition: [cx + halfW - 30, cy, southStreetZ],
    roadWidth: URBAN_METRICS.ROADS.STREET_WITH_PARKING.totalWidth,
    sidewalkWidth: URBAN_METRICS.SIDEWALKS.COMMERCIAL,
    hasLanes: true,
    hasSidewalks: true,
    hasLamps: true,
    lampInterval: 44,
    parent: `${cityRootFolder}/Roads`,
  });
  roadLuauList.push(streetEW_South);

  // 3C. Semáforos en las intersecciones clave
  const trafficLight1 = generateTrafficSignageLuau({
    type: "intersection_traffic_light",
    position: [cx + URBAN_METRICS.ROADS.BOULEVARD_4LANE.totalWidth / 2 + 6, cy, northStreetZ + 18],
    rotationY: 180,
    parent: `${cityRootFolder}/Roads`,
  });
  const trafficLight2 = generateTrafficSignageLuau({
    type: "intersection_traffic_light",
    position: [cx - URBAN_METRICS.ROADS.BOULEVARD_4LANE.totalWidth / 2 - 6, cy, southStreetZ - 18],
    rotationY: 0,
    parent: `${cityRootFolder}/Roads`,
  });
  roadLuauList.push(trafficLight1);
  roadLuauList.push(trafficLight2);

  // 3D. Trazado Orgánico / Curvas Bézier, Cuestas y Cul-de-Sacs
  const culDeSacX = cx - halfW * 0.45;
  const culDeSacZ = northStreetZ - 75;

  if (roadPattern === "organic_coastal" || isSchedule1 || isGtaSa) {
    // 1. Bulevar Curvo Costero Panorámico
    const coastalCurvedRoad = generateCurvedRoadLuau({
      name: "Scenic_Coastal_Boulevard",
      waypoints: [
        [cx - halfW + 40, cy, cz + halfL - 250],
        [cx - halfW * 0.15, cy, cz + halfL - 200],
        [cx + halfW * 0.35, cy, cz + halfL - 225],
        [cx + halfW - 50, cy, cz + halfL - 270],
      ],
      roadWidth: URBAN_METRICS.ROADS.STREET_WITH_PARKING.totalWidth,
      sidewalkWidth: URBAN_METRICS.SIDEWALKS.COMMERCIAL,
      hasSidewalks: true,
      hasLamps: true,
      hasRetainingWall: false,
      segments: 36,
      parent: `${cityRootFolder}/Roads`,
    });
    roadLuauList.push(coastalCurvedRoad);

    // 2. Cuesta en Pendiente con Muros de Contención y Quitamiedos (sube a colina residencial)
    const hillClimbRoad = generateCurvedRoadLuau({
      name: "Hillside_Scenic_Climb",
      waypoints: [
        [cx - halfW + 60, cy, northStreetZ - 50],
        [cx - halfW + 110, cy + 10, northStreetZ - 130],
        [cx - halfW + 70, cy + 18, northStreetZ - 190],
        [cx - halfW + 150, cy + 24, northStreetZ - 230],
      ],
      roadWidth: URBAN_METRICS.ROADS.STREET_2LANE.totalWidth,
      sidewalkWidth: URBAN_METRICS.SIDEWALKS.STANDARD,
      hasSidewalks: true,
      hasLamps: true,
      hasGuardrails: true,
      hasRetainingWall: true,
      baseElevation: cy - 2,
      segments: 32,
      parent: `${cityRootFolder}/Roads`,
    });
    roadLuauList.push(hillClimbRoad);

    // 3. Cul-de-Sac Circular estilo Grove Street (retorno con bulbo de 38 studs)
    const culDeSacLuau = generateCulDeSacLuau({
      name: "Barrio_Grove_CulDeSac",
      center: [culDeSacX, cy, culDeSacZ],
      approachDirection: "South",
      approachLength: 80,
      roadWidth: URBAN_METRICS.ROADS.STREET_2LANE.totalWidth,
      radius: URBAN_METRICS.ROADS.CUL_DE_SAC_BULB_RADIUS,
      sidewalkWidth: URBAN_METRICS.SIDEWALKS.STANDARD,
      parent: `${cityRootFolder}/Roads`,
    });
    roadLuauList.push(culDeSacLuau);
  }

  phases.push({ name: "Fase 3: Trazado de Red Vial, Curvas Bézier y Semáforos", luauCode: roadLuauList.join("\n") });

  // ---------------------------------------------------------------------------
  // FASE 4: AUTOPISTA ELEVADA (HIGHWAY) SI CORRESPONDE
  // ---------------------------------------------------------------------------
  if (hasHighway) {
    const highwayX = cx + halfW - 60;
    const highwayLuau = generateElevatedHighwayLuau({
      name: "Interstate_Elevated_Highway",
      startPosition: [highwayX, cy, cz - halfL + 20],
      endPosition: [highwayX, cy, cz + halfL - 20],
      roadWidth: URBAN_METRICS.ROADS.HIGHWAY_4LANE.totalWidth,
      elevation: 24,
      hasRamps: true,
      hasGuardrails: true,
      hasPillars: true,
      hasLamps: true,
      parent: `${cityRootFolder}/Infrastructure`,
    });
    phases.push({ name: "Fase 4: Autopista Elevada Interestatal con Pilares y Rampas", luauCode: highwayLuau });
  }

  // ---------------------------------------------------------------------------
  // FASE 5: DISTRITO COMERCIAL TURBIO / STRIP & MOTEL (ESTILO SCHEDULE 1 / GANTON)
  // ---------------------------------------------------------------------------
  const commercialLuauList = [];

  // 5A. Sunset Motel de 2 Plantas con Parking Frontal y Rótulo de Neón
  const motelX = cx - totalW * 0.28;
  const motelZ = southStreetZ - 75;
  const motelLuau = generateMotelLuau({
    name: "Sunset_Roadside_Motel",
    position: [motelX, cy, motelZ],
    roomsPerFloor: totalW >= 1500 ? 8 : 6,
    rotationY: 0, // Fachada mira al sur hacia Commercial_Strip_EW
    includeNeonSign: true,
    includeIceVending: true,
    seed: effectiveSeed + 202,
    parent: `${cityRootFolder}/Zoning_Commercial`,
  });
  commercialLuauList.push(motelLuau);

  // 5B. Franja Comercial: Pawn Shop, Pharmacy 24h, Bodega y Laundromat
  const shopTypes = ["pawn", "pharmacy", "bodega", "laundromat"];
  const shopWidth = 32;
  const shopSpacing = 36;
  const stripStartX = cx + 40;
  const stripZ = southStreetZ - 36; // Borde norte de la calle comercial, mirando al Sur

  for (let i = 0; i < shopTypes.length; i++) {
    const sType = shopTypes[i];
    const sX = stripStartX + i * shopSpacing;
    if (sX + shopWidth / 2 < cx + halfW - 90) {
      const shopLuau = generateShadyBusinessLuau({
        name: `Commercial_Shop_${sType.toUpperCase()}`,
        position: [sX, cy, stripZ],
        rotationY: 0, // Fachada mirando al Sur hacia la calle
        businessType: sType,
        hasBackAlley: true,
        hasSecurityBars: true,
        includeInterior: true,
        includeDeadDrop: i % 2 === 0,
        parent: `${cityRootFolder}/Zoning_Commercial`,
      });
      commercialLuauList.push(shopLuau);
    }
  }

  // 5C. Parking Asfaltado Trasero y Contenedores en Callejón
  const parkingLuau = generateParkingLotLuau({
    name: "Commercial_Strip_Parking",
    position: [cx + 100, cy, southStreetZ + 60],
    size: [120, 60],
    hasLighting: true,
    hasFence: true,
    hasProps: true,
    parkingLines: true,
    parent: `${cityRootFolder}/Zoning_Commercial`,
  });
  commercialLuauList.push(parkingLuau);

  phases.push({ name: "Fase 5: Milla Comercial (Motel Sunset, Tiendas Turbias y Parking)", luauCode: commercialLuauList.join("\n") });

  // ---------------------------------------------------------------------------
  // FASE 6: SECTOR RESIDENCIAL / BARRIO GHETTO (GROVE ST / SUBURBIA)
  // ---------------------------------------------------------------------------
  const residentialLuauList = [];

  // Cuadrante Residencial (Noroeste o Norte)
  const resBaseZ = northStreetZ - 80;
  const numHouseCols = Math.min(5, Math.floor((halfW - 80) / 54));

  // Fila 1 de Casas (Mirando al Sur hacia Avenue_North_EW)
  for (let c = 0; c < numHouseCols; c++) {
    const hX = cx - halfW + 60 + c * 52;
    const hZ = northStreetZ - 50;
    const house1 = generateHouseLuau({
      name: `Suburban_House_N_Row1_${c + 1}`,
      position: [hX, cy, hZ],
      lotSize: [50, 72],
      style: (c % 2 === 0) ? "suburban_bungalow" : "duplex_apartment",
      rotationY: 0, // Fachada mira al Sur
      seed: effectiveSeed + c * 73,
      hasGarage: true,
      hasPorch: true,
      hasFence: true,
      hasYardProps: true,
      parent: `${cityRootFolder}/Zoning_Residential`,
    });
    residentialLuauList.push(house1);
  }

  // Fila 2 de Casas (Mirando al Norte hacia calle posterior, espalda con espalda)
  for (let c = 0; c < numHouseCols; c++) {
    const hX = cx - halfW + 60 + c * 52;
    const hZ = northStreetZ - 130;
    const house2 = generateHouseLuau({
      name: `Suburban_House_N_Row2_${c + 1}`,
      position: [hX, cy, hZ],
      lotSize: [50, 72],
      style: (c % 3 === 0) ? "victorian_rowhouse" : "suburban_bungalow",
      rotationY: 180, // Fachada mira al Norte
      seed: effectiveSeed + c * 109 + 500,
      hasGarage: c % 2 === 0,
      hasPorch: true,
      hasFence: true,
      hasYardProps: true,
      parent: `${cityRootFolder}/Zoning_Residential`,
    });
    residentialLuauList.push(house2);
  }

  // Parque de Bolsillo / Zona Verde del Barrio
  const parkLuau = generatePocketParkLuau({
    name: "Neighborhood_Pocket_Park",
    position: [cx - halfW + 60 + numHouseCols * 52 + 20, cy, northStreetZ - 90],
    size: [60, 80],
    theme: "suburban_playground",
    hasFountain: false,
    hasBenches: true,
    hasPlayground: true,
    hasCaliforniaPalms: true,
    parent: `${cityRootFolder}/Zoning_Residential`,
  });
  residentialLuauList.push(parkLuau);

  // 6C. Casas Radiales del Cul-de-Sac y Villa en la Cima de la Cuesta
  if (roadPattern === "organic_coastal" || isSchedule1 || isGtaSa) {
    const culDeSacRadius = URBAN_METRICS.ROADS.CUL_DE_SAC_LOT_RADIUS; // 74 studs
    const culAngles = [80, 130, 180, 230, 280];
    for (let i = 0; i < culAngles.length; i++) {
      const angDeg = culAngles[i];
      const angRad = (angDeg * Math.PI) / 180;
      const hX = culDeSacX + Math.cos(angRad) * culDeSacRadius;
      const hZ = culDeSacZ + Math.sin(angRad) * culDeSacRadius;
      const houseFacing = (angDeg + 180) % 360; // Orientada al centro del retorno

      const culHouse = generateHouseLuau({
        name: `CulDeSac_Grove_House_${i + 1}`,
        position: [hX, cy, hZ],
        lotSize: [48, 64],
        style: i === 2 ? "victorian_rowhouse" : "suburban_bungalow",
        rotationY: houseFacing,
        seed: effectiveSeed + i * 89 + 777,
        hasGarage: true,
        hasPorch: true,
        hasFence: true,
        hasYardProps: true,
        parent: `${cityRootFolder}/Zoning_Residential`,
      });
      residentialLuauList.push(culHouse);
    }

    // Mansión en la colina panorámica (remate de Hillside_Scenic_Climb a cota +24)
    const hillVilla = generateHouseLuau({
      name: "Hilltop_Vinewood_Villa",
      position: [cx - halfW + 150, cy + 24, northStreetZ - 270],
      lotSize: [64, 80],
      style: "vinewood_mansion",
      rotationY: 0, // Fachada mirando al Sur hacia el skyline de la ciudad
      seed: effectiveSeed + 999,
      hasGarage: true,
      hasPorch: false,
      hasFence: true,
      hasYardProps: true,
      parent: `${cityRootFolder}/Zoning_Residential`,
    });
    residentialLuauList.push(hillVilla);
  }

  phases.push({ name: "Fase 6: Barrio Residencial Suburbano, Cul-de-Sac y Villa en Colina", luauCode: residentialLuauList.join("\n") });

  // ---------------------------------------------------------------------------
  // FASE 7: DOWNTOWN / TORRES CORPORATIVAS O VILLA DE COLINAS
  // ---------------------------------------------------------------------------
  const downtownLuauList = [];

  if (isMetropolis || isGtaSa || totalW >= 1200) {
    // Noreste: Distrito Financiero / Downtown Corporativo
    const dtStartX = cx + 50;
    const dtZ = northStreetZ - 80;

    const tower1 = generateDetailedBuildingLuau({
      name: "Skyscraper_Tower_Nexus",
      position: [dtStartX + 50, cy, dtZ],
      footprint: [56, 56],
      floors: totalW >= 1500 ? 14 : 9,
      style: "modern_downtown",
      seed: effectiveSeed + 301,
      hasRoofProps: true,
      hasBalconies: true,
      hasSidewalkDining: true,
      parent: `${cityRootFolder}/Zoning_Downtown`,
    });
    downtownLuauList.push(tower1);

    const tower2 = generateDetailedBuildingLuau({
      name: "Corporate_Plaza_East",
      position: [dtStartX + 130, cy, dtZ],
      footprint: [52, 52],
      floors: totalW >= 1500 ? 11 : 7,
      style: "financial_glass",
      seed: effectiveSeed + 302,
      hasRoofProps: true,
      hasBalconies: false,
      hasSidewalkDining: true,
      parent: `${cityRootFolder}/Zoning_Downtown`,
    });
    downtownLuauList.push(tower2);

    // Plaza monumental peatonal con fuente entre rascacielos
    const plazaPark = generatePocketParkLuau({
      name: "Downtown_Civic_Plaza",
      position: [dtStartX + 90, cy, northStreetZ - 20],
      size: [64, 50],
      theme: "modern_plaza",
      hasFountain: true,
      hasBenches: true,
      hasPlayground: false,
      hasCaliforniaPalms: true,
      parent: `${cityRootFolder}/Zoning_Downtown`,
    });
    downtownLuauList.push(plazaPark);
  }

  if (downtownLuauList.length > 0) {
    phases.push({ name: "Fase 7: Distrito Financiero Downtown y Plaza Cívica", luauCode: downtownLuauList.join("\n") });
  }

  // ---------------------------------------------------------------------------
  // FASE 8: MOBILIARIO URBANO, PALMERAS DE CALIFORNIA Y TENDIDO ELÉCTRICO AÉREO
  // ---------------------------------------------------------------------------
  const furnitureLuauList = [];

  // Palmeras en la mediana del Bulevar Principal
  for (let zOffset = -halfL * 0.4; zOffset < halfL * 0.4; zOffset += 45) {
    const palm = generateCaliforniaPalmLuau({
      position: [cx, cy, cz + zOffset],
      height: 28,
      curveAngle: 4,
      curveDirection: (Math.sin(zOffset) > 0) ? 90 : -90,
      parent: `${cityRootFolder}/Street_Furniture`,
    });
    furnitureLuauList.push(palm);
  }

  // Bocas de incendio, bancos y paradas de bus a pie de calle
  const hydrant1 = generateStreetFurnitureLuau({
    type: "fire_hydrant",
    position: [cx + 34, cy + 0.65, southStreetZ + 8],
    rotationY: 0,
    parent: `${cityRootFolder}/Street_Furniture`,
  });
  const hydrant2 = generateStreetFurnitureLuau({
    type: "fire_hydrant",
    position: [cx - 34, cy + 0.65, northStreetZ + 8],
    rotationY: 180,
    parent: `${cityRootFolder}/Street_Furniture`,
  });
  const busStop = generateStreetFurnitureLuau({
    type: "bus_stop",
    position: [cx + 34, cy + 0.65, southStreetZ - 12],
    rotationY: -90,
    parent: `${cityRootFolder}/Street_Furniture`,
  });
  furnitureLuauList.push(hydrant1);
  furnitureLuauList.push(hydrant2);
  furnitureLuauList.push(busStop);

  phases.push({ name: "Fase 8: Mobiliario Urbano, Palmeras y Paisajismo", luauCode: furnitureLuauList.join("\n") });

  // ---------------------------------------------------------------------------
  // FASE 9: MECÁNICAS DE JUEGO (TURF WARS Y DEAD DROPS) Y ATMÓSFERA VISUAL
  // ---------------------------------------------------------------------------
  const clockTime = isSchedule1 ? 18.5 : (isGtaSa ? 17.6 : 14.0);
  const outdoorCol = isSchedule1 ? "Color3.fromRGB(110, 115, 135)" : (isGtaSa ? "Color3.fromRGB(180, 135, 95)" : "Color3.fromRGB(140, 140, 145)");
  const fogCol = isSchedule1 ? "Color3.fromRGB(140, 155, 175)" : (isGtaSa ? "Color3.fromRGB(225, 185, 140)" : "Color3.fromRGB(190, 205, 220)");
  const fogEnd = isSchedule1 ? 1400 : (isGtaSa ? 2200 : 3000);

  let turfCode = "";
  if (includeTurfMechanics) {
    turfCode = `
    local function createTurfPoint(tName, pos, radius, gangName, col)
        local part = Instance.new("Part", turfFolder)
        part.Name = "Turf_" .. tName
        part.Shape = Enum.PartType.Cylinder
        part.Size = Vector3.new(1.2, radius * 2, radius * 2)
        part.CFrame = CFrame.new(pos) * CFrame.Angles(0, 0, math.rad(90))
        part.Anchored = true
        part.CanCollide = false
        part.Material = Enum.Material.Neon
        part.Color = col
        part.Transparency = 0.65
        
        part:SetAttribute("GangOwner", gangName)
        part:SetAttribute("CaptureProgress", 100)
        part:SetAttribute("Radius", radius)
        game:GetService("CollectionService"):AddTag(part, "TurfZone")
    end

    createTurfPoint("Ganton_Barrio", Vector3.new(${cx - halfW * 0.4}, ${cy + 0.1}, ${northStreetZ - 80}), 50, "Grove_Street_Families", Color3.fromRGB(45, 175, 45))
    createTurfPoint("Commercial_Strip", Vector3.new(${cx + 80}, ${cy + 0.1}, ${southStreetZ - 20}), 45, "Ballas_Syndicate", Color3.fromRGB(150, 45, 175))
    createTurfPoint("Docks_Smugglers", Vector3.new(${cx + totalW * 0.15}, ${cy + 0.1}, ${cz + halfL - 140}), 60, "Vagos_Cartel", Color3.fromRGB(240, 195, 35))
`;
  }

  const phase9Luau = `
do
    local cityFolder = workspace:FindFirstChild("${cityRootFolder}")
    local turfFolder = cityFolder and cityFolder:FindFirstChild("Gameplay_Systems")
    if not turfFolder and cityFolder then
        turfFolder = Instance.new("Folder")
        turfFolder.Name = "Gameplay_Systems"
        turfFolder.Parent = cityFolder
    end

    ${turfCode}

    -- Ajuste de Iluminación y Atmósfera Cinemática
    local lighting = game:GetService("Lighting")
    lighting.ClockTime = ${clockTime}
    lighting.Brightness = 2.2
    lighting.OutdoorAmbient = ${outdoorCol}
    lighting.ExposureCompensation = 0.15
    lighting.FogEnd = ${fogEnd}
    lighting.FogColor = ${fogCol}
end
`;

  phases.push({
    name: "Fase 9: Atmósfera Visual y Zonas de Control de Pandillas",
    luauCode: phase9Luau,
  });

  return phases;
}

/**
 * Genera el script monolítico Luau completo para ejecución en un solo bloque si se desea.
 */
export function generateCityMasterplanLuau(params) {
  const phases = generateCityMasterplanPhases(params);
  return phases.map((p) => `-- ====================================================\n-- ${p.name}\n-- ====================================================\n${p.luauCode}`).join("\n\n");
}
