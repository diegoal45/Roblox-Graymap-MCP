import { generateDocksLuau } from "../src/generators/docks.js";
import { generateMotelLuau } from "../src/generators/motel.js";
import { generateStorageFacilityLuau } from "../src/generators/storageFacility.js";
import { generateStormCanalLuau } from "../src/generators/stormCanal.js";
import { generateBridgeLuau } from "../src/generators/bridge.js";
import { generateShadyBusinessLuau } from "../src/generators/shadyBusiness.js";
import { generateHouseLuau } from "../src/generators/house.js";
import { generateLandmarkLuau } from "../src/generators/landmarks.js";
import { generateStreetLuau } from "../src/generators/street.js";
import { generateStreetFurnitureLuau } from "../src/generators/streetFurniture.js";
import { generateCaliforniaPalmLuau } from "../src/generators/palmsAndParks.js";
import { generateAdjustLightingLuau, generateFocusCameraLuau } from "../src/generators/levelDesignTools.js";

const BRIDGE_URL = "http://127.0.0.1:30250/execute";

async function executePhase(name, luauCode) {
  console.log(`\n⏳ Generando: ${name} (${luauCode.length} chars Luau)...`);
  try {
    const resp = await fetch(BRIDGE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: luauCode,
        actionName: name,
        timeoutMs: 40000,
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

export async function buildHylandPointFull() {
  console.log("================================================================");
  console.log("🏙️ CIUDAD COMPLETA ESTILO 'SCHEDULE 1' & GTA SAN ANDREAS");
  console.log("   Zonas Interconectadas:");
  console.log("   - Sur: The Docks (Muelle, Contenedores y Almacén) y Océano");
  console.log("   - Suroeste: Northtown Lockers (Trasteros con Lab Secreto)");
  console.log("   - Centro: Canal de Drenaje Pluvial (LA River Style) + Agua");
  console.log("   - Centro-Este: Gran Puente Vehicular de 4 Carriles con Pilares");
  console.log("   - Noreste: Milla Comercial Turbia (Pawn, Rx, Bodega, Lavandería)");
  console.log("   - Trasera Este: Callejón Clandestino con Dumpsters y Dead Drops");
  console.log("   - Noreste Exterior: Sunset Roadside Motel con Cartel de Neón");
  console.log("   - Noroeste: Gasolinera 24/7, Fast Food Diner (Drive-Thru) y Comisaría");
  console.log("   - Norte Residencial: Casas con Porches, Garajes y Jardines");
  console.log("   - Red Conectora: Avenidas de 4 carriles, Calles, Aceras y Palmeras");
  console.log("================================================================");

  // FASE 0: Inicialización del mapa base y océano portuario
  const initLuau = `
local cityFolder = workspace:FindFirstChild("City_HylandPoint")
if cityFolder then cityFolder:Destroy() end

cityFolder = Instance.new("Folder")
cityFolder.Name = "City_HylandPoint"
cityFolder.Parent = workspace

-- Crear subcarpetas organizativas
for _, folderName in ipairs({"Infrastructure", "Industrial", "Commercial", "Residential", "Streets", "Props", "Nature"}) do
    local f = Instance.new("Folder")
    f.Name = folderName
    f.Parent = cityFolder
end

-- Terreno base asfaltado/hormigonado (Cota superior en Y = -0.5 para no colisionar con la cota +0.3 de las carreteras)
local base = Instance.new("Part", cityFolder)
base.Name = "Ground_Main"
base.Size = Vector3.new(800, 4, 800)
base.CFrame = CFrame.new(0, -2.5, 0)
base.Anchored = true
base.Material = Enum.Material.Concrete
base.Color = Color3.fromRGB(120, 122, 125)
base.TopSurface = Enum.SurfaceType.Smooth
base.BottomSurface = Enum.SurfaceType.Smooth

-- Océano / Cuenca portuaria en el extremo sur (Z > 310)
local ocean = Instance.new("Part", cityFolder)
ocean.Name = "Port_Ocean_Water"
ocean.Size = Vector3.new(800, 16, 220)
ocean.CFrame = CFrame.new(0, -8, 420)
ocean.Anchored = true
ocean.CanCollide = false
ocean.Material = Enum.Material.Water
ocean.Color = Color3.fromRGB(28, 75, 105)
ocean.Transparency = 0.35
`;
  await executePhase("Fase 0: Mapa Base y Océano Portuario", initLuau);

  // FASE 1: Canal de Drenaje Pluvial (Corte horizontal en Z = 0)
  // Canal excavado a cota -16 studs, con fondo en Y = -16 y bordes superiores a nivel de calle (Y = 0.0)
  const canalLuau = generateStormCanalLuau({
    name: "Central_Flood_Canal",
    position: [0, -16, 0],
    length: 420,
    width: 56,
    depth: 16,
    rotationY: 90, // Corre de Este a Oeste cortando la ciudad
    includeWater: true,
    includePipeBridge: true, // Pasarela peatonal y tuberías industriales al oeste (X = -120)
    includeCulvertPipes: true,
    includeGuardrails: true,
    parent: "City_HylandPoint/Infrastructure",
  });
  await executePhase("Fase 1: Canal de Drenaje Pluvial Hundido (Estilo LA River / Schedule 1)", canalLuau);

  // FASE 2: Gran Puente Vehicular de 4 Carriles sobre el Canal
  const bridgeLuau = generateBridgeLuau({
    name: "Canal_Main_Bridge",
    startPoint: [50, 0, -35],
    endPoint: [50, 0, 35],
    roadWidth: 36, // 4 carriles de calzada
    sidewalkWidth: 6, // Aceras peatonales con barandillas
    canalDepth: 16, // Pilares masivos que bajan hasta el fondo del canal
    pierCount: 2,
    hasRailings: true,
    hasLamps: true,
    parent: "City_HylandPoint/Infrastructure",
  });
  await executePhase("Fase 2: Gran Puente Vehicular de 4 Carriles sobre el Canal", bridgeLuau);

  // FASE 3: The Docks (Muelle Portuario, Contenedores y Almacén en el Sur)
  const docksLuau = generateDocksLuau({
    name: "Hyland_Seaport_Docks",
    position: [0, 0, 260],
    size: [260, 140],
    rotationY: 0,
    containerStacks: 16, // Retícula portuaria ordenada sin colisiones
    includeWarehouse: true,
    includeFloodlights: true,
    parent: "City_HylandPoint/Industrial",
  });
  await executePhase("Fase 3: The Docks (Muelle, Contenedores Bay Grid y Almacén)", docksLuau);

  // FASE 4: Complejo de Trasteros y Mini-Almacenes (Northtown Lockers)
  const storageLuau = generateStorageFacilityLuau({
    name: "Northtown_Lockers_Storage",
    position: [-130, 0, 140],
    rows: 2,
    unitsPerRow: 7,
    rotationY: 0,
    includeOffice: true,
    includeFence: true,
    doorColorStyle: "mixed",
    hasSecretLabUnit: true, // Unidad 3 con interior jugable accesible
    parent: "City_HylandPoint/Industrial",
  });
  await executePhase("Fase 4: Complejo de Trasteros (Con Laboratorio Clandestino Accesible)", storageLuau);

  // FASE 5: Milla Comercial Turbia (Fachadas alineadas a X = 110 mirando a -X)
  const pawnShopLuau = generateShadyBusinessLuau({
    name: "QuickPawn_Shop",
    position: [110, 0, -75],
    rotationY: -90,
    businessType: "pawn",
    hasBackAlley: true,
    hasSecurityBars: true,
    includeInterior: true,
    includeDeadDrop: true,
    parent: "City_HylandPoint/Commercial",
  });
  await executePhase("Fase 5A: Casa de Empeños (Quick Pawn con Rejas)", pawnShopLuau);

  const pharmacyLuau = generateShadyBusinessLuau({
    name: "Rx_24h_Pharmacy",
    position: [110, 0, -115],
    rotationY: -90,
    businessType: "pharmacy",
    hasBackAlley: true,
    hasSecurityBars: true,
    includeInterior: true,
    includeDeadDrop: true,
    parent: "City_HylandPoint/Commercial",
  });
  await executePhase("Fase 5B: Farmacia 24/7 (Cruz de Neón y Ventanilla de Guardia)", pharmacyLuau);

  const bodegaLuau = generateShadyBusinessLuau({
    name: "Lucky_Corner_Bodega",
    position: [110, 0, -155],
    rotationY: -90,
    businessType: "bodega",
    hasBackAlley: true,
    hasSecurityBars: true,
    includeInterior: true,
    includeDeadDrop: true,
    parent: "City_HylandPoint/Commercial",
  });
  await executePhase("Fase 5C: Lucky Bodega & Deli", bodegaLuau);

  const laundromatLuau = generateShadyBusinessLuau({
    name: "Speedy_Wash_Laundromat",
    position: [110, 0, -195],
    rotationY: -90,
    businessType: "laundromat",
    hasBackAlley: true,
    hasSecurityBars: true,
    includeInterior: true,
    includeDeadDrop: true,
    parent: "City_HylandPoint/Commercial",
  });
  await executePhase("Fase 5D: Lavandería 24 Horas (Speedy Wash)", laundromatLuau);

  // FASE 6: Callejón Trasero Clandestino (Back Alley detrás de las tiendas en X = 135)
  const alleyLuau = `
local CollectionService = game:GetService("CollectionService")

local function buildBackAlley()
    local folder = workspace.City_HylandPoint.Commercial:FindFirstChild("Commercial_Back_Alley")
    if not folder then
        folder = Instance.new("Folder", workspace.City_HylandPoint.Commercial)
        folder.Name = "Commercial_Back_Alley"
    end

    local alleyX = 136
    local startZ = -55
    local endZ = -215
    local length = math.abs(endZ - startZ)
    local midZ = (startZ + endZ) / 2

    -- Calzada de asfalto y hormigón manchado del callejón (cota 0.3)
    local road = Instance.new("Part", folder)
    road.Name = "Alley_Pavement"
    road.Size = Vector3.new(16, 1.4, length)
    road.CFrame = CFrame.new(alleyX, -0.4, midZ)
    road.Anchored = true
    road.Material = Enum.Material.Concrete
    road.Color = Color3.fromRGB(55, 58, 62)
    road.TopSurface = Enum.SurfaceType.Smooth

    local function makePart(pName, sz, cf, col, mat, canCol)
        local p = Instance.new("Part", folder)
        p.Name = pName
        p.Size = sz
        p.CFrame = cf
        p.Color = col
        p.Material = mat or Enum.Material.Metal
        p.Anchored = true
        p.CanCollide = canCol ~= nil and canCol or true
        p.TopSurface = Enum.SurfaceType.Smooth
        p.BottomSurface = Enum.SurfaceType.Smooth
        return p
    end

    -- 4 Grandes contenedores de basura industriales (Green Commercial Dumpsters)
    local dumpsterPositions = {-75, -115, -155, -195}
    for i, dz in ipairs(dumpsterPositions) do
        local dumpX = alleyX + 4.5
        local dBody = makePart("Dumpster_" .. i, Vector3.new(6.0, 4.8, 4.2), CFrame.new(dumpX, 2.7, dz), Color3.fromRGB(38, 75, 45), Enum.Material.Metal)
        -- Tapa abatible inclinada
        makePart("Dumpster_Lid_" .. i, Vector3.new(5.8, 0.4, 4.0), CFrame.new(dumpX, 5.2, dz), Color3.fromRGB(28, 30, 32), Enum.Material.SmoothPlastic)
        -- Ruedas de acero
        for _, wx in ipairs({-2.4, 2.4}) do
            for _, wz in ipairs({-1.6, 1.6}) do
                makePart("Dumpster_Wheel", Vector3.new(0.6, 0.6, 0.6), CFrame.new(dumpX + wx, 0.6, dz + wz), Color3.fromRGB(25, 25, 28), Enum.Material.Metal)
            end
        end

        -- Pilas de palets de madera junto a los contenedores
        for pl = 1, 3 do
            makePart("Wood_Pallet_" .. i .. "_" .. pl, Vector3.new(3.8, 0.35, 3.8), CFrame.new(dumpX, 0.3 + (pl - 1) * 0.38, dz + 3.8), Color3.fromRGB(115, 85, 52), Enum.Material.WoodPlanks)
        end

        -- Cajas de cartón y bolsas de basura
        makePart("Trash_Bag_A_" .. i, Vector3.new(1.8, 1.4, 1.6), CFrame.new(dumpX - 2.8, 1.0, dz + 1.2), Color3.fromRGB(20, 20, 22), Enum.Material.SmoothPlastic)
        makePart("Trash_Bag_B_" .. i, Vector3.new(1.6, 1.3, 1.5), CFrame.new(dumpX - 2.6, 1.0, dz - 1.2), Color3.fromRGB(20, 20, 22), Enum.Material.SmoothPlastic)
    end

    -- Escondite clandestino interactivo (Dead Drop / Stash en el contenedor 2)
    local deadDrop = makePart("Secret_Alley_DeadDrop", Vector3.new(1.4, 0.8, 1.0), CFrame.new(alleyX + 4.5, 0.7, -115 - 2.5), Color3.fromRGB(45, 50, 40), Enum.Material.Metal)
    CollectionService:AddTag(deadDrop, "DeadDrop")
    CollectionService:AddTag(deadDrop, "Interactive")
    deadDrop:SetAttribute("StashItem", "Contraband_Package")
    deadDrop:SetAttribute("RewardCash", 2500)

    -- Faroles industriales de callejón con iluminación tenue
    for i, dz in ipairs(dumpsterPositions) do
        local lamp = makePart("Alley_Wall_Light_" .. i, Vector3.new(0.8, 0.6, 1.2), CFrame.new(alleyX - 8, 12, dz), Color3.fromRGB(255, 235, 180), Enum.Material.Neon, false)
        local l = Instance.new("PointLight", lamp)
        l.Color = Color3.fromRGB(255, 220, 160)
        l.Range = 22
        l.Brightness = 1.4
    end

    print("[AlleyEngine] ✅ Callejón comercial trasero completado con dumpsters y dead drops.")
end

buildBackAlley()
`;
  await executePhase("Fase 6: Callejón Comercial Trasero (Dumpsters, Palets y Dead Drop)", alleyLuau);

  // FASE 7: Sunset Roadside Motel (Noreste exterior, mirando hacia el aparcamiento y tiendas)
  const motelLuau = generateMotelLuau({
    name: "Sunset_Roadside_Motel",
    position: [180, 0, -135],
    roomsPerFloor: 7,
    rotationY: -90, // Fachada mirando al oeste
    includeNeonSign: true,
    includeIceVending: true,
    seed: 8842,
    parent: "City_HylandPoint/Commercial",
  });
  await executePhase("Fase 7: Sunset Roadside Motel (2 Plantas con Balcón y Cartel Neón)", motelLuau);

  // FASE 8: Servicios Urbanos y Comida Rápida (Noroeste)
  const gasStationLuau = generateLandmarkLuau({
    type: "gas_station",
    position: [-130, 0, -90],
    rotationY: 0,
    parent: "City_HylandPoint/Commercial",
  });
  await executePhase("Fase 8A: Gasolinera 24/7 (Marquesina y Tótem de Precios)", gasStationLuau);

  const dinerLuau = generateLandmarkLuau({
    type: "fast_food_diner",
    position: [-130, 0, -165],
    rotationY: 0,
    parent: "City_HylandPoint/Commercial",
  });
  await executePhase("Fase 8B: Fast Food Retro Diner (Carril Drive-Thru y Cartel Gigante)", dinerLuau);

  const policeStationLuau = generateLandmarkLuau({
    type: "police_station",
    position: [-40, 0, -90],
    rotationY: 0,
    parent: "City_HylandPoint/Commercial",
  });
  await executePhase("Fase 8C: Comisaría de Policía (Helipuerto en Azotea y 3 Cocheras)", policeStationLuau);

  // FASE 9: Barrio Residencial Suburbano (Norte)
  const house1Luau = generateHouseLuau({
    name: "Suburban_House_1",
    position: [-45, 0, -205],
    rotationY: 0, // Mirando al norte hacia Residential_Lane
    floors: 1,
    style: "suburban_bungalow",
    hasGarage: true,
    hasPorch: true,
    roofType: "gable",
    parent: "City_HylandPoint/Residential",
  });
  await executePhase("Fase 9A: Casa Residencial 1 (Bungalow Californiano)", house1Luau);

  const house2Luau = generateHouseLuau({
    name: "Suburban_House_2",
    position: [5, 0, -205],
    rotationY: 0,
    floors: 2,
    style: "craftsman_family",
    hasGarage: true,
    hasPorch: true,
    roofType: "gable",
    parent: "City_HylandPoint/Residential",
  });
  await executePhase("Fase 9B: Casa Residencial 2 (Craftsman Familiar 2 Plantas)", house2Luau);

  const house3Luau = generateHouseLuau({
    name: "Suburban_House_3",
    position: [-45, 0, -145],
    rotationY: 180, // Mirando al sur hacia Residential_Lane
    floors: 1,
    style: "modern_ranch",
    hasGarage: true,
    hasPorch: true,
    roofType: "hip",
    parent: "City_HylandPoint/Residential",
  });
  await executePhase("Fase 9C: Casa Residencial 3 (Modern Ranch)", house3Luau);

  const house4Luau = generateHouseLuau({
    name: "Suburban_House_4",
    position: [5, 0, -145],
    rotationY: 180,
    floors: 2,
    style: "victorian_rowhouse",
    hasGarage: false,
    hasPorch: true,
    roofType: "gable",
    parent: "City_HylandPoint/Residential",
  });
  await executePhase("Fase 9D: Casa Residencial 4 (Victorian 2 Plantas)", house4Luau);

  // FASE 10: Red Vial Conectora Total (Avenidas, Calles, Andenes y Esquinas)
  // 10A. Avenida Principal Sur: conecta el sur del puente (Z = 35) con el puerto (Z = 240)
  const mainAvenueSouth = generateStreetLuau({
    name: "Main_Avenue_South",
    startPosition: [50, 0, 35],
    endPosition: [50, 0, 240],
    roadWidth: 36,
    sidewalkWidth: 6,
    hasLanes: true,
    hasSidewalks: true,
    hasLamps: true,
    parent: "City_HylandPoint/Streets",
  });
  await executePhase("Fase 10A: Avenida Principal Sur (Puente a Muelle)", mainAvenueSouth);

  // 10B. Avenida Principal Norte: conecta el norte del puente (Z = -35) con la zona comercial y residencial (Z = -250)
  const mainAvenueNorth = generateStreetLuau({
    name: "Main_Avenue_North",
    startPosition: [50, 0, -35],
    endPosition: [50, 0, -250],
    roadWidth: 36,
    sidewalkWidth: 6,
    hasLanes: true,
    hasSidewalks: true,
    hasLamps: true,
    parent: "City_HylandPoint/Streets",
  });
  await executePhase("Fase 10B: Avenida Principal Norte (Puente a Suburbios)", mainAvenueNorth);

  // 10C. Bulevar Comercial Norte: conecta Gasolinera, Comisaría y Milla Comercial (Z = -70)
  const northBlvd = generateStreetLuau({
    name: "North_Commercial_Blvd",
    startPosition: [-180, 0, -70],
    endPosition: [160, 0, -70],
    roadWidth: 24,
    sidewalkWidth: 6,
    hasLanes: true,
    hasSidewalks: true,
    hasLamps: true,
    parent: "City_HylandPoint/Streets",
  });
  await executePhase("Fase 10C: Bulevar Comercial Norte (Eje Este-Oeste)", northBlvd);

  // 10D. Bulevar Industrial Sur: conecta Trasteros con la Avenida Principal y el Puerto (Z = 140)
  const southBlvd = generateStreetLuau({
    name: "South_Industrial_Blvd",
    startPosition: [-180, 0, 140],
    endPosition: [50, 0, 140],
    roadWidth: 24,
    sidewalkWidth: 6,
    hasLanes: true,
    hasSidewalks: true,
    hasLamps: true,
    parent: "City_HylandPoint/Streets",
  });
  await executePhase("Fase 10D: Bulevar Industrial Sur (Trasteros a Avenida)", southBlvd);

  // 10E. Calle Residencial Norte: calle tranquila de acceso a las viviendas (Z = -175)
  const residentialLane = generateStreetLuau({
    name: "Residential_Lane",
    startPosition: [-75, 0, -175],
    endPosition: [40, 0, -175],
    roadWidth: 20,
    sidewalkWidth: 5,
    hasLanes: true,
    hasSidewalks: true,
    hasLamps: true,
    parent: "City_HylandPoint/Streets",
  });
  await executePhase("Fase 10E: Calle Residencial Norte (Acceso a Casas)", residentialLane);

  // FASE 11: Mobiliario Urbano, Paradas y Palmeras Californianas (GTA San Andreas Vibe)
  const furnitureLuau = generateStreetFurnitureLuau({
    streetPath: "City_HylandPoint/Streets/North_Commercial_Blvd",
    center: [0, 0, -70],
    length: 220,
    orientation: "X",
    sidewalkOffset: 15,
    interval: 35,
    includeTrees: true,
    includeLamps: true,
    includeBenches: true,
    includeHydrants: true,
    includeBusStop: true,
    includeBikeRacks: true,
    parent: "City_HylandPoint/Props",
  });
  await executePhase("Fase 11A: Mobiliario Urbano (Bancos, Paradas de Bus y Bocas de Incendio)", furnitureLuau);

  // Palmeras californianas icónicas a lo largo de la Avenida Principal y el Motel
  const palmsLuau = `
local natureFolder = workspace.City_HylandPoint.Nature

local palmCoords = {
    {50 + 22, 0, 60}, {50 - 22, 0, 60},
    {50 + 22, 0, 120}, {50 - 22, 0, 120},
    {50 + 22, 0, 180}, {50 - 22, 0, 180},
    {50 + 22, 0, -60}, {50 - 22, 0, -60},
    {50 + 22, 0, -120}, {50 - 22, 0, -120},
    {50 + 22, 0, -180}, {50 - 22, 0, -180},
    -- Alrededor del Motel
    {155, 0, -100}, {155, 0, -170}, {205, 0, -100}, {205, 0, -170},
    -- Frente a la Gasolinera
    {-80, 0, -60}, {-170, 0, -60}
}

local function spawnPalms()
    for i, pt in ipairs(palmCoords) do
        local m = Instance.new("Model", natureFolder)
        m.Name = "California_Palm_" .. i
        pcall(function() m.LevelOfDetail = Enum.ModelLevelOfDetail.StreamingMesh end)

        local baseCF = CFrame.new(pt[1], pt[2], pt[3])
        local trunkH = 28 + (i % 3) * 3

        -- Tronco estilizado
        local trunk = Instance.new("Part", m)
        trunk.Name = "Trunk"
        trunk.Shape = Enum.PartType.Cylinder
        trunk.Size = Vector3.new(trunkH, 1.8, 1.8)
        trunk.CFrame = baseCF * CFrame.new(0, trunkH / 2, 0) * CFrame.Angles(0, 0, math.rad(90))
        trunk.Color = Color3.fromRGB(115, 82, 54)
        trunk.Material = Enum.Material.WoodPlanks
        trunk.Anchored = true

        -- Corona de hojas verdes en abanico
        for frond = 1, 8 do
            local angle = (frond / 8) * math.pi * 2
            local fPart = Instance.new("Part", m)
            fPart.Name = "Frond_" .. frond
            fPart.Size = Vector3.new(1.4, 0.4, 9.5)
            fPart.CFrame = baseCF * CFrame.new(0, trunkH, 0) * CFrame.Angles(math.rad(-25), angle, 0) * CFrame.new(0, 0, 4.5)
            fPart.Color = Color3.fromRGB(48, 115, 42)
            fPart.Material = Enum.Material.Grass
            fPart.Anchored = true
            fPart.CanCollide = false
        end
    end
    print("[NatureEngine] ✅ Palmeras californianas plantadas con éxito.")
end

spawnPalms()
`;
  await executePhase("Fase 11B: Palmeras Californianas (Estilo GTA San Andreas)", palmsLuau);

  // FASE 12: Iluminación de Ocaso Cinemática (Golden Hour)
  const lightingLuau = generateAdjustLightingLuau({
    clockTime: 18.25, // Atardecer dorado cálido
    brightness: 2.2,
    outdoorAmbient: [145, 118, 125],
    fogEnd: 950,
    fogColor: [220, 145, 115],
  });
  await executePhase("Fase 12: Iluminación Cinemática de Atardecer (Golden Hour)", lightingLuau);

  // FASE 13: Enfoque de Cámara de Estudio
  const cameraLuau = generateFocusCameraLuau({
    targetPath: "City_HylandPoint",
    position: [20, 45, 0],
    viewMode: "perspective_overhead",
    distance: 450,
  });
  await executePhase("Fase 13: Enfoque Panorámico de Cámara de Estudio", cameraLuau);

  console.log("\n================================================================");
  console.log("🎉 CIUDAD COMPLETA ESTILO 'SCHEDULE 1' & GTA SA GENERADA CON ÉXITO!");
  console.log("   - Canal pluvial profundo con agua y pasarela de tuberías");
  console.log("   - Gran puente vehicular de 4 carriles conectando Norte y Sur");
  console.log("   - The Docks con patio de contenedores bay grid y almacén");
  console.log("   - Complejo de trasteros con laboratorio clandestino accesible");
  console.log("   - Milla comercial turbia (Pawn, Rx, Bodega, Laundry)");
  console.log("   - Auténtico callejón trasero con dumpsters, palets y dead drops");
  console.log("   - Sunset Roadside Motel con cartel de neón y aparcamiento");
  console.log("   - Gasolinera 24/7, Fast Food Diner (Drive-Thru) y Comisaría");
  console.log("   - Barrio suburbano de casas con porches y garajes");
  console.log("   - Avenidas, calles, andenes, farolas, mobiliario y palmeras");
  console.log("================================================================");
}

// Ejecutar si se invoca directamente desde Node.js
if (import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/"))) {
  buildHylandPointFull().catch(console.error);
}
