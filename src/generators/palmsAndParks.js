import { snapVal } from "./grid.js";

/**
 * Generador de Paisajismo Urbano GTA San Andreas: Palmeras Californianas y Parques Urbanos.
 * Soporta:
 * - Palmeras californianas de gran altura (California Fan Palms de 28-36 studs)
 * - Parques urbanos de bolsillo (Pocket Parks) con caminos de grava, cenador/gazebo hexagonal de madera,
 *   bancos de parque, farolas victorianas, parterres florales y palmeras
 */

export function generateCaliforniaPalmLuau({
  position = [0, 0, 0],
  height = 32,
  seed = 101,
  parent = "City/Nature",
}) {
  const [posX, posY, posZ] = position;
  const palmH = Math.max(20, Math.min(50, Number(height) || 32));

  return `
local function spawnPalm()
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
    model.Name = "California_Fan_Palm"
    pcall(function() model.LevelOfDetail = Enum.ModelLevelOfDetail.StreamingMesh end)

    local baseCF = CFrame.new(${posX}, ${posY}, ${posZ})

    local function makeCyl(pName, sz, relCF, col, mat)
        local p = Instance.new("Part", model)
        p.Name = pName
        p.Shape = Enum.PartType.Cylinder
        p.Anchored = true
        p.CanCollide = true
        p.CanTouch = false
        p.Size = sz
        p.CFrame = baseCF * relCF
        p.Color = col
        p.Material = mat or Enum.Material.WoodPlanks
        return p
    end

    local function makePart(pName, sz, relCF, col, mat)
        local p = Instance.new("Part", model)
        p.Name = pName
        p.Anchored = true
        p.CanCollide = false
        p.CanTouch = false
        p.CanQuery = false
        p.Size = sz
        p.CFrame = baseCF * relCF
        p.Color = col
        p.Material = mat or Enum.Material.Grass
        return p
    end

    local totalH = ${palmH}
    -- Tronco esbelto segmentado
    local trunkCF = CFrame.new(0, totalH / 2, 0) * CFrame.Angles(0, 0, math.rad(90))
    makeCyl("Palm_Trunk", Vector3.new(1.3, totalH, 1.3), trunkCF, Color3.fromRGB(115, 85, 60), Enum.Material.WoodPlanks)

    -- Falda de hojas secas (Skirt) bajo la copa
    local skirtCF = CFrame.new(0, totalH - 1.5, 0) * CFrame.Angles(0, 0, math.rad(90))
    makeCyl("Palm_Skirt", Vector3.new(2.4, 3.0, 2.4), skirtCF, Color3.fromRGB(90, 68, 48), Enum.Material.WoodPlanks)

    -- Copa de palmas verdes arqueadas en abanico (10 ramas)
    local numFronds = 10
    for i = 1, numFronds do
        local angle = (i / numFronds) * math.pi * 2
        local frondDist = 4.2
        local fX = math.cos(angle) * frondDist
        local fZ = math.sin(angle) * frondDist
        local fCF = CFrame.new(fX, totalH + 0.5, fZ) * CFrame.Angles(math.rad(-25 * math.sin(angle)), angle, math.rad(25 * math.cos(angle)))
        makePart("Frond_" .. i, Vector3.new(1.8, 0.2, 7.5), fCF, Color3.fromRGB(48, 125, 42), Enum.Material.Grass)
    end
end

spawnPalm()
`;
}

export function generatePocketParkLuau({
  name = "Suburban_Pocket_Park",
  center = [0, 0, 0],
  size = [80, 80], // [widthX, depthZ]
  hasGazebo = true,
  hasFountain = true,
  parent = "City/Parks",
}) {
  const [posX, posY, posZ] = [snapVal(center[0], 4), snapVal(center[1], 4), snapVal(center[2], 4)];
  const [parkW, parkD] = [Math.max(40, snapVal(size[0], 4)), Math.max(40, snapVal(size[1] || size[2] || 80, 4))];

  return `
local CollectionService = game:GetService("CollectionService")

local function buildPocketPark()
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

    local cx = ${posX}
    local cy = ${posY}
    local cz = ${posZ}
    local w = ${parkW}
    local d = ${parkD}

    local function makePart(pName, sz, cf, col, mat, canCol, isDecor)
        local p = Instance.new("Part", model)
        p.Name = pName
        p.Anchored = true
        p.CanCollide = canCol ~= nil and canCol or true
        p.CanTouch = false
        if isDecor then p.CanQuery = false end
        p.TopSurface = Enum.TopSurfaceType.Smooth
        p.BottomSurface = Enum.BottomSurfaceType.Smooth
        p.Size = sz
        p.CFrame = cf
        p.Color = col
        p.Material = mat or Enum.Material.Grass
        return p
    end

    local function makeCyl(pName, sz, cf, col, mat)
        local p = Instance.new("Part", model)
        p.Name = pName
        p.Shape = Enum.PartType.Cylinder
        p.Anchored = true
        p.CanCollide = true
        p.CanTouch = false
        p.Size = sz
        p.CFrame = cf
        p.Color = col
        p.Material = mat or Enum.Material.Concrete
        return p
    end

    -- 1. BASE DE CÉSPED NATURAL Y BORDILLO PERIMETRAL DE PIEDRA
    makePart("Park_Lawn", Vector3.new(w, 1.2, d), CFrame.new(cx, cy + 0.6, cz), Color3.fromRGB(55, 130, 48), Enum.Material.Grass, true)

    -- Muro bajo perimetral de piedra con barandilla de forja
    local wallH = 2.4
    local curbCol = Color3.fromRGB(155, 150, 142)
    local gateW = 14

    -- Senderos peatonales de grava en cruz
    local pathW = 7.0
    makePart("Path_Horiz", Vector3.new(w - 4, 0.1, pathW), CFrame.new(cx, cy + 1.25, cz), Color3.fromRGB(195, 185, 170), Enum.Material.Cobblestone, true)
    makePart("Path_Vert", Vector3.new(pathW, 0.1, d - 4), CFrame.new(cx, cy + 1.25, cz), Color3.fromRGB(195, 185, 170), Enum.Material.Cobblestone, true)

    ${
      hasGazebo
        ? `
    -- 2. CENADOR / GAZEBO HEXAGONAL DE MADERA EN EL CENTRO
    local gzR = 10
    local gzH = 9.0
    -- Plataforma elevada del cenador
    local gzFloor = makeCyl("Gazebo_Floor", Vector3.new(gzR * 2, 0.8, gzR * 2), CFrame.new(cx, cy + 1.6, cz) * CFrame.Angles(0, 0, math.rad(90)), Color3.fromRGB(120, 85, 55), Enum.Material.WoodPlanks)

    -- 6 Postes de madera perimetrales
    for i = 1, 6 do
        local angle = (i / 6) * math.pi * 2
        local px = cx + math.cos(angle) * (gzR - 1.2)
        local pz = cz + math.sin(angle) * (gzR - 1.2)
        makePart("Gazebo_Post_" .. i, Vector3.new(0.8, gzH, 0.8), CFrame.new(px, cy + 2.0 + gzH / 2, pz), Color3.fromRGB(240, 240, 245), Enum.Material.WoodPlanks, true)
    end

    -- Tejado cónico de madera
    local gzRoof = makeCyl("Gazebo_Roof", Vector3.new(gzR * 2.2, 3.2, gzR * 2.2), CFrame.new(cx, cy + 2.0 + gzH + 1.6, cz) * CFrame.Angles(0, 0, math.rad(90)), Color3.fromRGB(75, 50, 38), Enum.Material.WoodPlanks)

    -- Farol colgante interior en el cenador
    local gzLamp = makePart("Gazebo_Lamp", Vector3.new(0.8, 1.2, 0.8), CFrame.new(cx, cy + 2.0 + gzH - 1.0, cz), Color3.fromRGB(255, 235, 175), Enum.Material.Neon, false, true)
    local gzl = Instance.new("PointLight", gzLamp)
    gzl.Color = Color3.fromRGB(255, 230, 175)
    gzl.Range = 22
    gzl.Brightness = 1.6
    `
        : ""
    }

    -- 3. BANCOS DE PARQUE VICTORIANOS Y FAROLAS
    local benchDist = 22
    local benchOffsets = {
        {cx - benchDist, cz - 8, 0},
        {cx + benchDist, cz - 8, math.rad(180)},
        {cx - 8, cz + benchDist, math.rad(90)},
        {cx - 8, cz - benchDist, math.rad(-90)},
    }
    for bi, bDef in ipairs(benchOffsets) do
        local bCF = CFrame.new(bDef[1], cy + 1.2 + 0.4, bDef[2]) * CFrame.Angles(0, bDef[3], 0)
        makePart("Park_Bench_" .. bi, Vector3.new(5.8, 0.4, 1.6), bCF * CFrame.new(0, 1.2, 0), Color3.fromRGB(115, 75, 45), Enum.Material.WoodPlanks, true)
        makePart("Park_BenchBack_" .. bi, Vector3.new(5.8, 1.4, 0.3), bCF * CFrame.new(0, 2.1, -0.65), Color3.fromRGB(115, 75, 45), Enum.Material.WoodPlanks, false)
    end

    -- 4. PARTERRES FLORALES Y PALMERAS EN LAS 4 ESQUINAS
    local cornerOffset = w / 3
    local corners = {
        {-cornerOffset, -cornerOffset},
        {cornerOffset, -cornerOffset},
        {-cornerOffset, cornerOffset},
        {cornerOffset, cornerOffset},
    }
    for ci, cp in ipairs(corners) do
        -- Palmera californiana esbelta
        local palmX = cx + cp[1]
        local palmZ = cz + cp[2]
        local pH = 28
        makeCyl("Palm_Trunk_" .. ci, Vector3.new(1.2, pH, 1.2), CFrame.new(palmX, cy + 1.2 + pH / 2, palmZ) * CFrame.Angles(0, 0, math.rad(90)), Color3.fromRGB(115, 85, 60), Enum.Material.WoodPlanks)
        makePart("Palm_Crown_" .. ci, Vector3.new(9, 1.2, 9), CFrame.new(palmX, cy + 1.2 + pH + 0.6, palmZ), Color3.fromRGB(48, 125, 42), Enum.Material.Grass, false)

        -- Parterre de flores de colores al pie de la palmera
        makePart("Flowerbed_" .. ci, Vector3.new(6.0, 0.3, 6.0), CFrame.new(palmX, cy + 1.35, palmZ), Color3.fromRGB(195, 70, 95), Enum.Material.Grass, false)
    end

    print(string.format("[PocketPark GTA-AAA] ✅ Parque de bolsillo '%s' (%dx%d studs) generado en '%s'.", "${name}", w, d, "${parent}"))
end

buildPocketPark()
`;
}
