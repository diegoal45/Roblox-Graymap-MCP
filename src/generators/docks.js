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
  containerStacks = 20,
  includeWarehouse = true,
  seed = 4040,
  parent = "City/Docks",
}) {
  const [posX, posY, posZ] = [snapVal(position[0], 4), snapVal(position[1], 4), snapVal(position[2], 4)];
  const [dockW, dockD] = [Math.max(80, snapVal(size[0], 4)), Math.max(60, snapVal(size[1] || size[2] || 110, 4))];
  const rotY = typeof rotationY === "number" ? rotationY : 0;
  const effectiveSeed = typeof seed === "number" ? seed : 4040;
  const effectiveContainerCount = typeof containerCount === "number" && containerCount !== 20 ? containerCount : (typeof containerStacks === "number" ? containerStacks : 20);
  const cCount = Math.max(6, Math.min(60, effectiveContainerCount));

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
    local containerLimit = ${cCount}

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

    -- 2. CONTENEDORES MARÍTIMOS 3D DE CARGA (20ft y 40ft) CON ESTRUCTURA MODULAR SIN Z-FIGHTING
    local colors = {
      ${CONTAINER_COLORS.map((c) => `Color3.fromRGB(${c[0]}, ${c[1]}, ${c[2]})`).join(",\n      ")}
    }

    local function spawnContainer(id, lengthStuds, relPos, rotDeg, colIdx)
        local cW, cH, cL = 8.5, 9.0, lengthStuds
        local cCol = colors[(colIdx % #colors) + 1]
        local cf = CFrame.new(relPos.X, relPos.Y + cH / 2, relPos.Z) * CFrame.Angles(0, math.rad(rotDeg), 0)

        -- Cuerpo corrugado principal (dimensionado interiormente para no solapar con los postes de esquina)
        local body = makePart("Container_" .. id, Vector3.new(cW - 0.4, cH - 0.4, cL - 0.6), cf, cCol, Enum.Material.DiamondPlate, true)
        body:SetAttribute("IsContainer", true)

        -- Estructura de esquinas y vigas perimetrales de acero oscuro (Corner Castings & Pillars)
        local frameCol = Color3.fromRGB(38, 42, 48)
        local postW = 0.8
        local halfInnerW = (cW - postW) / 2
        local halfInnerL = (cL - postW) / 2

        -- 4 Postes verticales esquineros
        makePart("C_Post_1", Vector3.new(postW, cH, postW), cf * CFrame.new(-halfInnerW, 0, -halfInnerL), frameCol, Enum.Material.Metal, true)
        makePart("C_Post_2", Vector3.new(postW, cH, postW), cf * CFrame.new(halfInnerW, 0, -halfInnerL), frameCol, Enum.Material.Metal, true)
        makePart("C_Post_3", Vector3.new(postW, cH, postW), cf * CFrame.new(-halfInnerW, 0, halfInnerL), frameCol, Enum.Material.Metal, true)
        makePart("C_Post_4", Vector3.new(postW, cH, postW), cf * CFrame.new(halfInnerW, 0, halfInnerL), frameCol, Enum.Material.Metal, true)

        -- Vigas longitudinales superiores e inferiores
        makePart("C_Rail_Top_L", Vector3.new(postW, 0.5, cL), cf * CFrame.new(-halfInnerW, cH / 2 - 0.25, 0), frameCol, Enum.Material.Metal, false, true)
        makePart("C_Rail_Top_R", Vector3.new(postW, 0.5, cL), cf * CFrame.new(halfInnerW, cH / 2 - 0.25, 0), frameCol, Enum.Material.Metal, false, true)
        makePart("C_Rail_Bot_L", Vector3.new(postW, 0.5, cL), cf * CFrame.new(-halfInnerW, -cH / 2 + 0.25, 0), frameCol, Enum.Material.Metal, false, true)
        makePart("C_Rail_Bot_R", Vector3.new(postW, 0.5, cL), cf * CFrame.new(halfInnerW, -cH / 2 + 0.25, 0), frameCol, Enum.Material.Metal, false, true)

        -- Puertas de doble batiente en extremo frontal (+Z)
        local doorZ = cL / 2 - 0.15
        makePart("C_Door_Face", Vector3.new(cW - 1.2, cH - 1.0, 0.2), cf * CFrame.new(0, 0, doorZ), cCol, Enum.Material.Metal, false, true)

        -- Barras verticales cilíndricas de cerrojo (Lock Rods) con holgura hacia afuera
        local rodZ = cL / 2 + 0.12
        makePart("C_Lock_Rod_1", Vector3.new(0.25, cH - 1.4, 0.25), cf * CFrame.new(-1.6, 0, rodZ), Color3.fromRGB(220, 222, 228), Enum.Material.Metal, false, true)
        makePart("C_Lock_Rod_2", Vector3.new(0.25, cH - 1.4, 0.25), cf * CFrame.new(1.6, 0, rodZ), Color3.fromRGB(220, 222, 228), Enum.Material.Metal, false, true)

        -- Rótulo con código en el lateral exterior
        local plateCF = cf * CFrame.new(cW / 2 + 0.05, cH / 2 - 1.6, 0)
        makePart("C_Code_Plate", Vector3.new(0.1, 1.4, 4.0), plateCF, Color3.fromRGB(240, 242, 245), Enum.Material.SmoothPlastic, false, true)
    end

    -- GENERACIÓN DE PILAS DE CONTENEDORES EN RETÍCULA ORDENADA (Bay Grid - Sin colisiones)
    -- Los muelles reales organizan los contenedores en calles paralelas separadas para carretillas y camiones
    local cW, cL_40, cL_20 = 8.5, 36.0, 20.0
    local bayWidth = 12.0  -- 8.5 studs de contenedor + 3.5 studs de pasillo entre columnas
    local bayLength = 46.0 -- 36 studs de contenedor + 10 studs de calle entre hileras

    local yardStartX = -dockW / 2 + 20
    local yardEndX = dockW / 2 - (includeWarehouse and (whW + 24) or 20)
    local yardStartZ = dockD / 2 - 28
    local yardEndZ = -dockD / 2 + 30

    local numCols = math.max(1, math.floor((yardEndX - yardStartX) / bayWidth))
    local numRows = math.max(1, math.floor((yardStartZ - yardEndZ) / bayLength))

    local stackIdx = 0
    for row = 1, numRows do
        local rowCenterZ = yardStartZ - (row - 0.5) * bayLength
        for col = 1, numCols do
            stackIdx = stackIdx + 1
            if stackIdx <= containerLimit then
                local colCenterX = yardStartX + (col - 0.5) * bayWidth
                local is40ft = (stackIdx % 3 ~= 0)
                local cLen = is40ft and cL_40 or cL_20
                -- Altura de apilado escalonada (1 a 3 alturas)
                local stackH = (stackIdx % 3) + 1

                for s = 1, stackH do
                    local cY = pierTopY + (s - 1) * 9.05 -- 0.05 de holgura vertical para anular z-fighting entre techos y bases
                    spawnContainer(stackIdx .. "_L" .. s, cLen, Vector3.new(colCenterX, cY, rowCenterZ), 0, stackIdx * 3 + s)
                end
            end
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
    local whRoofCF_L = CFrame.new(whX - halfWhW / 2, pierTopY + whH + whRoofH / 2, whZ) * CFrame.Angles(0, math.rad(90), 0)
    local whRoofCF_R = CFrame.new(whX + halfWhW / 2, pierTopY + whH + whRoofH / 2, whZ) * CFrame.Angles(0, math.rad(-90), 0)
    
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

    print(string.format("[DocksEngine] ✅ Muelles industriales '%s' (%dx%d studs, %d contenedores) construidos en '%s'.", "${name}", dockW, dockD, containerLimit, "${parent}"))
end

buildDocks()
`;
}
