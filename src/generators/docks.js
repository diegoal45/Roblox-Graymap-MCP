import { snapVal } from "./grid.js";

/**
 * Generador Industrial de Muelles y Contenedores Portuarios (The Docks - Estilo Schedule 1 / Hyland Point).
 * Incluye:
 * - Plataforma de muelle de carga de hormigón sobre pilotes de madera/hormigón sumergidos
 * - Línea de atraque con defensas de goma (bumpers) y norays/bolardos de amarre de fundición
 * - Laberinto de Contenedores Marítimos (Shipping Containers 20ft y 40ft) apilados a varias alturas
 *   con cantoneras de esquina, puertas de doble cerrojo con barras y colores industriales variados (Maersk, Evergreen, etc.)
 * - Almacén logístico portuario con portones seccionales y franjas de peligro amarillo/negro
 * - Torres de iluminación perimetral de celosía de acero con proyectores LED potentes
 */

export const CONTAINER_COLORS = [
  [185, 45, 40],   // Rojo óxido / K-Line
  [35, 75, 140],   // Azul marino Maersk
  [40, 115, 65],   // Verde Evergreen
  [215, 145, 35],  // Amarillo / Ocre MSC
  [205, 80, 30],   // Naranja Hapag-Lloyd
  [65, 70, 78],    // Gris grafito industrial
  [165, 170, 178], // Plata desgastado
];

export function generateDocksLuau({
  name = "Hyland_Docks",
  position = [0, 0, 0],
  size = [160, 110], // [widthX, depthZ]
  rotationY = 0,
  waterLevel = -3,
  containerCount = 20,
  includeWarehouse = true,
  seed = 4040,
  parent = "City/Docks",
}) {
  const [posX, posY, posZ] = [snapVal(position[0], 4), snapVal(position[1], 4), snapVal(position[2], 4)];
  const [dockW, dockD] = [Math.max(80, snapVal(size[0], 4)), Math.max(60, snapVal(size[1] || size[2] || 110, 4))];
  const rotY = typeof rotationY === "number" ? rotationY : 0;
  const effectiveSeed = typeof seed === "number" ? seed : 4040;
  const cCount = Math.max(6, Math.min(60, containerCount));

  return `
local CollectionService = game:GetService("CollectionService")

local function buildDocks()
    local segments = string.split("${parent}", "/")
    local current = workspace
    for _, seg in ipairs(segments) do
        if seg ~= "" then
            local nextF = current:FindFirstChild(seg)
            if not nextF then
                nextF = Instance.new("Folder")
                nextF.Name = seg
                nextF.Parent = current
            end
            current = nextF
        end
    end

    local model = Instance.new("Model", current)
    model.Name = "${name}"
    pcall(function() model.LevelOfDetail = Enum.ModelLevelOfDetail.StreamingMesh end)

    local originCF = CFrame.new(${posX}, ${posY}, ${posZ}) * CFrame.Angles(0, math.rad(${rotY}), 0)
    local dockW = ${dockW}
    local dockD = ${dockD}
    local waterY = ${waterLevel}
    local seedVal = ${effectiveSeed}

    local function makePart(pName, sz, relCF, col, mat, canCol, isDecor)
        local p = Instance.new("Part", model)
        p.Name = pName
        p.Anchored = true
        p.CanCollide = canCol ~= nil and canCol or true
        p.CanTouch = false
        if isDecor then p.CanQuery = false end
        p.TopSurface = Enum.SurfaceType.Smooth
        p.BottomSurface = Enum.SurfaceType.Smooth
        p.Size = sz
        p.CFrame = originCF * relCF
        p.Color = col
        p.Material = mat or Enum.Material.Concrete
        return p
    end

    local function makeCyl(pName, sz, relCF, col, mat)
        local p = Instance.new("Part", model)
        p.Name = pName
        p.Shape = Enum.PartType.Cylinder
        p.Anchored = true
        p.CanCollide = true
        p.CanTouch = false
        p.Size = sz
        p.CFrame = originCF * relCF
        p.Color = col
        p.Material = mat or Enum.Material.Metal
        return p
    end

    -- 1. MUELLE DE HORMIGÓN INDUSTRIAL Y PILOTES SOBRE EL AGUA
    local pierThick = 4.0
    local pierTopY = 1.0
    makePart("Pier_Concrete_Deck", Vector3.new(dockW, pierThick, dockD), CFrame.new(0, pierTopY - pierThick / 2, 0), Color3.fromRGB(130, 134, 140), Enum.Material.Concrete, true)

    -- Pilotes sumergidos en la dársena de agua (borde sur +Z)
    local pileH = math.abs(waterY) + 12
    local pileSpacing = 16
    for px = -dockW / 2 + 4, dockW / 2 - 4, pileSpacing do
        local pileCF = CFrame.new(px, waterY - 2, dockD / 2 - 1.5) * CFrame.Angles(0, 0, math.rad(90))
        makeCyl("Pile_Fender", Vector3.new(2.4, pileH, 2.4), pileCF, Color3.fromRGB(65, 52, 40), Enum.Material.WoodPlanks)
        -- Defensas de goma negras (Rubber bumpers)
        makePart("Rubber_Bumper", Vector3.new(3.2, 2.4, 1.2), CFrame.new(px, pierTopY - 1.2, dockD / 2 + 0.6), Color3.fromRGB(30, 32, 35), Enum.Material.SmoothPlastic, true)
    end

    -- Norays / Bolardos de amarre de fundición a lo largo del muelle
    for bx = -dockW / 2 + 8, dockW / 2 - 8, 24 do
        local bollardCF = CFrame.new(bx, pierTopY + 1.2, dockD / 2 - 3) * CFrame.Angles(0, 0, math.rad(90))
        makeCyl("Mooring_Bollard_Base", Vector3.new(1.6, 2.4, 1.6), bollardCF, Color3.fromRGB(42, 45, 50), Enum.Material.Metal)
        makePart("Mooring_Bollard_Cap", Vector3.new(2.4, 0.5, 2.4), CFrame.new(bx, pierTopY + 2.4, dockD / 2 - 3), Color3.fromRGB(215, 175, 45), Enum.Material.Metal, false, true)
    end

    -- 2. CONTENEDORES MARÍTIMOS 3D DE CARGA (20ft y 40ft)
    local colors = {
      ${CONTAINER_COLORS.map((c) => `Color3.fromRGB(${c[0]}, ${c[1]}, ${c[2]})`).join(",\n      ")}
    }

    local function spawnContainer(id, lengthStuds, relPos, rotDeg, colIdx)
        local cW, cH, cL = 8.5, 9.0, lengthStuds
        local cCol = colors[(colIdx % #colors) + 1]
        local cf = CFrame.new(relPos.X, relPos.Y + cH / 2, relPos.Z) * CFrame.Angles(0, math.rad(rotDeg), 0)

        -- Cuerpo del contenedor con textura metálica corrugada
        local body = makePart("Container_" .. id, Vector3.new(cW, cH, cL), cf, cCol, Enum.Material.DiamondPlate, true)
        body:SetAttribute("IsContainer", true)

        -- Cantoneras estructurales de esquina (Corner castings)
        local cornerCol = Color3.fromRGB(40, 44, 50)
        local frameThick = 0.5
        makePart("C_Frame_F", Vector3.new(cW + 0.1, cH + 0.1, frameThick), cf * CFrame.new(0, 0, cL / 2 - frameThick / 2), cornerCol, Enum.Material.Metal, true)
        makePart("C_Frame_B", Vector3.new(cW + 0.1, cH + 0.1, frameThick), cf * CFrame.new(0, 0, -cL / 2 + frameThick / 2), cornerCol, Enum.Material.Metal, true)

        -- Puertas de doble batiente en extremo frontal con barras verticales de cerrojo
        local doorZ = cL / 2 + 0.05
        makePart("C_Lock_Rod_1", Vector3.new(0.2, cH - 1.2, 0.2), cf * CFrame.new(-1.8, 0, doorZ), Color3.fromRGB(220, 222, 228), Enum.Material.Metal, false, true)
        makePart("C_Lock_Rod_2", Vector3.new(0.2, cH - 1.2, 0.2), cf * CFrame.new(1.8, 0, doorZ), Color3.fromRGB(220, 222, 228), Enum.Material.Metal, false, true)

        -- Rótulo o código identificador en el lateral
        local tagPl = makePart("C_Code_Plate", Vector3.new(cW + 0.1, 1.4, 4.0), cf * CFrame.new(0, cH / 2 - 1.5, 0), Color3.fromRGB(240, 242, 245), Enum.Material.SmoothPlastic, false, true)
    end

    -- Generar laberinto de pilas de contenedores en la explanada
    local containerCount = ${cCount}
    local startX = -dockW / 2 + 18
    local startZ = dockD / 2 - 28
    local slot = 0

    for i = 1, containerCount do
        slot = slot + 1
        local is40ft = (i % 3 ~= 0)
        local cLen = is40ft and 36 or 20
        local colX = startX + ((slot * 11) % (dockW - 36))
        local rowZ = startZ - math.floor((slot * 14) % (dockD - 48))
        local stackHeight = ((i * 7) % 3) -- 0 = suelo, 1 = piso 2, 2 = piso 3

        for s = 0, stackHeight do
            local cY = pierTopY + (s * 9.0)
            local rot = (i % 2 == 0) and 0 or 90
            spawnContainer(i .. "_L" .. s, cLen, Vector3.new(colX, cY, rowZ), rot, i + s * 3)
        end
    end

    ${
      includeWarehouse
        ? `
    -- 3. ALMACÉN LOGÍSTICO PORTUARIO ("DOCKS WAREHOUSE")
    local whW = math.min(70, dockW * 0.45)
    local whD = math.min(50, dockD * 0.5)
    local whH = 22
    local whX = -dockW / 2 + whW / 2 + 6
    local whZ = -dockD / 2 + whD / 2 + 8

    -- Estructura principal de chapa corrugada
    makePart("Warehouse_Main", Vector3.new(whW, whH, whD), CFrame.new(whX, pierTopY + whH / 2, whZ), Color3.fromRGB(150, 155, 162), Enum.Material.DiamondPlate, true)

    -- Tejado a dos aguas del almacén
    local whRoofH = 6.5
    local halfWhW = (whW + 1.6) / 2
    local whRoofCF_L = CFrame.new(whX - halfWhW / 2, pierTopY + whH + whRoofH / 2, whZ) * CFrame.Angles(0, math.rad(-90), 0)
    local whRoofCF_R = CFrame.new(whX + halfWhW / 2, pierTopY + whH + whRoofH / 2, whZ) * CFrame.Angles(0, math.rad(90), 0)
    
    local wWedgeL = Instance.new("WedgePart", model)
    wWedgeL.Name = "Warehouse_Roof_L"
    wWedgeL.Anchored = true
    wWedgeL.Size = Vector3.new(whD + 2, whRoofH, halfWhW)
    wWedgeL.CFrame = originCF * whRoofCF_L
    wWedgeL.Color = Color3.fromRGB(75, 80, 88)
    wWedgeL.Material = Enum.Material.Metal

    local wWedgeR = Instance.new("WedgePart", model)
    wWedgeR.Name = "Warehouse_Roof_R"
    wWedgeR.Anchored = true
    wWedgeR.Size = Vector3.new(whD + 2, whRoofH, halfWhW)
    wWedgeR.CFrame = originCF * whRoofCF_R
    wWedgeR.Color = Color3.fromRGB(75, 80, 88)
    wWedgeR.Material = Enum.Material.Metal

    -- Portones industriales enrollables de carga (Roller Cargo Bays)
    local bayW, bayH = 14, 13
    local bayZ = whZ + whD / 2 + 0.1
    for b = 1, 2 do
        local bayX = whX - whW / 4 + (b - 1) * (whW / 2)
        -- Marco de hormigón
        makePart("Bay_Frame_" .. b, Vector3.new(bayW + 1.2, bayH + 0.8, 0.6), CFrame.new(bayX, pierTopY + bayH / 2 + 0.4, bayZ), Color3.fromRGB(60, 65, 72), Enum.Material.Concrete, true)
        -- Portón enrollable
        makePart("Cargo_Roller_Door_" .. b, Vector3.new(bayW, bayH, 0.4), CFrame.new(bayX, pierTopY + bayH / 2, bayZ + 0.1), Color3.fromRGB(85, 90, 100), Enum.Material.DiamondPlate, true)
        -- Franja de seguridad diagonal amarilla y negra superior
        makePart("Hazard_Stripes_" .. b, Vector3.new(bayW, 1.2, 0.5), CFrame.new(bayX, pierTopY + bayH + 0.6, bayZ + 0.15), Color3.fromRGB(235, 185, 30), Enum.Material.SmoothPlastic, false, true)
        -- Foco de seguridad sobre el muelle de carga
        local spot = makePart("Bay_Floodlight_" .. b, Vector3.new(1.4, 0.8, 0.8), CFrame.new(bayX, pierTopY + bayH + 2.2, bayZ + 0.6), Color3.fromRGB(255, 245, 220), Enum.Material.Neon, false, true)
        local spLight = Instance.new("PointLight", spot)
        spLight.Color = Color3.fromRGB(255, 235, 190)
        spLight.Range = 26
        spLight.Brightness = 1.8
    end
    `
        : ""
    }

    -- 4. TORRES DE ILUMINACIÓN DE CELOSÍA DE GRAN POTENCIA (STADIUM FLOODLIGHT TOWERS)
    local towerH = 34
    local towerPositions = {
        {dockW / 2 - 8, -dockD / 2 + 8},
        {dockW / 2 - 8, dockD / 2 - 12},
    }
    for ti, tp in ipairs(towerPositions) do
        -- Mástil de acero
        makePart("Light_Tower_Mast_" .. ti, Vector3.new(1.8, towerH, 1.8), CFrame.new(tp[1], pierTopY + towerH / 2, tp[2]), Color3.fromRGB(65, 70, 78), Enum.Material.DiamondPlate, true)
        -- Plataforma de proyectores
        local platCF = CFrame.new(tp[1], pierTopY + towerH, tp[2])
        makePart("Light_Tower_Plat_" .. ti, Vector3.new(8.0, 0.6, 3.2), platCF, Color3.fromRGB(45, 50, 58), Enum.Material.Metal, true)
        -- Batería de 4 focos LED
        for f = -3, 3, 2 do
            local head = makePart("Floodlight_" .. ti .. "_" .. f, Vector3.new(1.4, 1.2, 1.0), platCF * CFrame.new(f, 1.2, 0.8), Color3.fromRGB(255, 250, 235), Enum.Material.Neon, false, true)
            local fl = Instance.new("PointLight", head)
            fl.Color = Color3.fromRGB(240, 245, 255)
            fl.Range = 45
            fl.Brightness = 2.4
            fl.Shadows = true
        end
    end

    print(string.format("[DocksEngine] ✅ Muelles industriales '%s' (%dx%d studs, %d contenedores) construidos en '%s'.", "${name}", dockW, dockD, containerCount, "${parent}"))
end

buildDocks()
`;
}
