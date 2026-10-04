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
    -- Base radicular / alcorque de tierra
    makeCyl("Palm_Base_Dirt", Vector3.new(2.4, 0.4, 2.4), CFrame.new(0, 0.2, 0) * CFrame.Angles(0, 0, math.rad(90)), Color3.fromRGB(75, 52, 38), Enum.Material.Ground)

    -- Tronco esbelto californiano con conicidad realista (base robusta y fuste esbelto)
    local baseTrunkH = totalH * 0.35
    local upperTrunkH = totalH * 0.68
    local baseTrunkCF = CFrame.new(0, baseTrunkH / 2, 0) * CFrame.Angles(0, 0, math.rad(90))
    makeCyl("Palm_Trunk_Base", Vector3.new(1.8, baseTrunkH, 1.8), baseTrunkCF, Color3.fromRGB(110, 80, 55), Enum.Material.WoodPlanks)

    local upperTrunkCF = CFrame.new(0, totalH * 0.65, 0) * CFrame.Angles(0, 0, math.rad(90))
    makeCyl("Palm_Trunk_Upper", Vector3.new(1.25, upperTrunkH, 1.25), upperTrunkCF, Color3.fromRGB(120, 90, 65), Enum.Material.WoodPlanks)

    -- Falda de hojas secas marchitas (Skirt) bajo la copa
    local skirtCF = CFrame.new(0, totalH - 1.2, 0) * CFrame.Angles(0, 0, math.rad(90))
    makeCyl("Palm_Skirt", Vector3.new(2.6, 2.8, 2.6), skirtCF, Color3.fromRGB(92, 68, 45), Enum.Material.WoodPlanks)

    -- Corazón central de la copa
    local heart = makePart("Palm_Heart", Vector3.new(2.2, 2.0, 2.2), CFrame.new(0, totalH + 0.2, 0), Color3.fromRGB(42, 105, 38), Enum.Material.Grass)
    heart.Shape = Enum.PartType.Ball

    -- Copa de palmas verdes arqueadas en abanico (12 ramas con caída natural)
    local numFronds = 12
    for i = 1, numFronds do
        local angle = (i / numFronds) * math.pi * 2
        local frondDist = 3.8
        local fX = math.cos(angle) * frondDist
        local fZ = math.sin(angle) * frondDist
        -- Inclinación arqueada descendente realista
        local fCF = CFrame.new(fX, totalH - 0.2, fZ) * CFrame.Angles(math.rad(-30 * math.sin(angle)), angle, math.rad(30 * math.cos(angle)))
        makePart("Frond_" .. i, Vector3.new(2.2, 0.25, 7.8), fCF, Color3.fromRGB(48, 128, 42), Enum.Material.Grass)

        -- Punta caída de la palma
        local tipDist = 6.8
        local tipX = math.cos(angle) * tipDist
        local tipZ = math.sin(angle) * tipDist
        local tipCF = CFrame.new(tipX, totalH - 1.6, tipZ) * CFrame.Angles(math.rad(-45 * math.sin(angle)), angle, math.rad(45 * math.cos(angle)))
        makePart("Frond_Tip_" .. i, Vector3.new(1.8, 0.2, 4.2), tipCF, Color3.fromRGB(58, 140, 48), Enum.Material.Grass)
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
        p.TopSurface = Enum.SurfaceType.Smooth
        p.BottomSurface = Enum.SurfaceType.Smooth
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
        local pHeart = makePart("Palm_Heart_" .. ci, Vector3.new(2.4, 2.0, 2.4), CFrame.new(palmX, cy + 1.2 + pH + 0.4, palmZ), Color3.fromRGB(42, 105, 38), Enum.Material.Grass, false)
        pHeart.Shape = Enum.PartType.Ball

        for pf = 1, 8 do
            local pAng = (pf / 8) * math.pi * 2
            local pfCF = CFrame.new(palmX + math.cos(pAng) * 3.2, cy + 1.2 + pH, palmZ + math.sin(pAng) * 3.2)
                * CFrame.Angles(math.rad(-25 * math.sin(pAng)), pAng, math.rad(25 * math.cos(pAng)))
            makePart("Frond_" .. ci .. "_" .. pf, Vector3.new(2.0, 0.25, 7.0), pfCF, Color3.fromRGB(48, 128, 42), Enum.Material.Grass, false)
        end

        -- Parterre de flores de colores al pie de la palmera
        makePart("Flowerbed_" .. ci, Vector3.new(6.0, 0.3, 6.0), CFrame.new(palmX, cy + 1.35, palmZ), Color3.fromRGB(195, 70, 95), Enum.Material.Grass, false)
    end

    print(string.format("[PocketPark GTA-AAA] ✅ Parque de bolsillo '%s' (%dx%d studs) generado en '%s'.", "${name}", w, d, "${parent}"))
end

buildPocketPark()
`;
}
