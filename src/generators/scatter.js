import { snapVal } from "./grid.js";

/**
 * Motor de Scatter y Dispersión Orgánica de Vegetación y Clutter.
 * Distribuye miles de árboles, rocas, matorrales y atrezzo sobre el terreno o ciudad
 * con detección automática de pendientes, variación de escala y Performance Shield.
 */
export function generateFoliageScatterLuau({
  name = "Nature_Scatter",
  center = [0, 0, 0],
  radius = 150,
  biome = "forest", // "forest", "mountain_rocks", "desert", "urban_clutter"
  count = 60,
  seed = 8831,
  minSlopeAngle = 45, // No colocar árboles en acantilados mayores a 45 grados
  parent = "City/Nature",
}) {
  const [cx, cy, cz] = [snapVal(center[0], 4), snapVal(center[1], 4), snapVal(center[2], 4)];
  const rad = Math.max(20, radius);
  const totalCount = Math.max(5, Math.min(500, count));
  const effectiveSeed = typeof seed === "number" ? seed : 8831;

  return `
local CollectionService = game:GetService("CollectionService")

local function buildScatter()
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

    local cx = ${cx}
    local cy = ${cy}
    local cz = ${cz}
    local radius = ${rad}
    local total = ${totalCount}
    local seed = ${effectiveSeed}
    local biome = "${biome.toLowerCase()}"

    local function makePart(pName, sz, cf, col, mat, canCol)
        local p = Instance.new("Part", model)
        p.Name = pName
        p.Anchored = true
        p.CanCollide = canCol ~= nil and canCol or false
        p.CanTouch = false
        p.CanQuery = false
        p.TopSurface = Enum.TopSurfaceType.Smooth
        p.BottomSurface = Enum.BottomSurfaceType.Smooth
        p.Size = sz
        p.CFrame = cf
        p.Color = col
        p.Material = mat or Enum.Material.SmoothPlastic
        return p
    end

    local function spawnPineTree(cf, scale)
        local s = scale or 1
        local trunk = makePart("Pine_Trunk", Vector3.new(1.2 * s, 10 * s, 1.2 * s), cf * CFrame.new(0, 5 * s, 0), Color3.fromRGB(75, 45, 30), Enum.Material.WoodPlanks, true)
        -- Conos superpuestos de hojas de pino
        local c1 = makePart("Pine_Needles_1", Vector3.new(8 * s, 5 * s, 8 * s), cf * CFrame.new(0, 8 * s, 0), Color3.fromRGB(35, 85, 45), Enum.Material.Grass, false)
        local c2 = makePart("Pine_Needles_2", Vector3.new(6 * s, 4.5 * s, 6 * s), cf * CFrame.new(0, 11 * s, 0), Color3.fromRGB(40, 95, 50), Enum.Material.Grass, false)
        local c3 = makePart("Pine_Needles_3", Vector3.new(3.5 * s, 4 * s, 3.5 * s), cf * CFrame.new(0, 14 * s, 0), Color3.fromRGB(50, 110, 60), Enum.Material.Grass, false)
    end

    local function spawnOakTree(cf, scale)
        local s = scale or 1
        local trunk = makePart("Oak_Trunk", Vector3.new(1.6 * s, 8 * s, 1.6 * s), cf * CFrame.new(0, 4 * s, 0), Color3.fromRGB(90, 60, 40), Enum.Material.WoodPlanks, true)
        local crown = makePart("Oak_Crown", Vector3.new(8 * s, 7 * s, 8 * s), cf * CFrame.new(0, 9 * s, 0), Color3.fromRGB(60, 130, 55), Enum.Material.Grass, false)
    end

    local function spawnRockCluster(cf, scale)
        local s = scale or 1
        local rock1 = makePart("Rock_Main", Vector3.new(5 * s, 3.5 * s, 4.5 * s), cf * CFrame.new(0, 1.5 * s, 0) * CFrame.Angles(math.rad(15), math.rad(30), 0), Color3.fromRGB(115, 118, 122), Enum.Material.Rock, true)
        local rock2 = makePart("Rock_Small", Vector3.new(3 * s, 2 * s, 2.5 * s), cf * CFrame.new(2.5 * s, 0.8 * s, 1 * s), Color3.fromRGB(100, 105, 110), Enum.Material.Rock, true)
    end

    local function spawnBush(cf, scale)
        local s = scale or 1
        makePart("Bush", Vector3.new(3.5 * s, 2.8 * s, 3.5 * s), cf * CFrame.new(0, 1.4 * s, 0), Color3.fromRGB(55, 120, 50), Enum.Material.Grass, false)
    end

    local function spawnUrbanClutter(cf)
        local itemType = (math.random(1, 4))
        if itemType == 1 then
            -- Contenedor de basura verde oscuro
            makePart("Dumpster", Vector3.new(7, 4.5, 4), cf * CFrame.new(0, 2.25, 0), Color3.fromRGB(45, 75, 55), Enum.Material.Metal, true)
        elseif itemType == 2 then
            -- Palet de madera con cajas
            makePart("Pallet", Vector3.new(4.5, 0.5, 4.5), cf * CFrame.new(0, 0.25, 0), Color3.fromRGB(130, 95, 60), Enum.Material.WoodPlanks, true)
            makePart("Crate", Vector3.new(3, 3, 3), cf * CFrame.new(0, 2, 0), Color3.fromRGB(150, 110, 70), Enum.Material.WoodPlanks, true)
        elseif itemType == 3 then
            -- Barril metálico industrial
            local drum = makePart("Oil_Drum", Vector3.new(2.5, 3.8, 2.5), cf * CFrame.new(0, 1.9, 0), Color3.fromRGB(180, 45, 40), Enum.Material.Metal, true)
            drum.Shape = Enum.PartType.Cylinder
            drum.CFrame = cf * CFrame.new(0, 1.9, 0) * CFrame.Angles(0, 0, math.rad(90))
        else
            -- Barrera New Jersey de hormigón
            makePart("Jersey_Barrier", Vector3.new(8, 3.2, 2.2), cf * CFrame.new(0, 1.6, 0), Color3.fromRGB(160, 165, 170), Enum.Material.Concrete, true)
        end
    end

    -- Dispersión de Poisson / Pseudoaleatoria mediante Raycast
    local rayParams = RaycastParams.new()
    rayParams.FilterType = Enum.RaycastFilterType.Exclude
    rayParams.FilterDescendantsInstances = { model }

    local spawned = 0
    for i = 1, total do
        local angle = ((seed * 17 + i * 31.41) % 360)
        local dist = math.sqrt(((seed * 23 + i * 47.13) % 1000) / 1000) * radius
        local radAngle = math.rad(angle)
        local posX = cx + math.cos(radAngle) * dist
        local posZ = cz + math.sin(radAngle) * dist

        -- Raycast para detectar suelo exacto (terreno o pieza)
        local rayOrigin = Vector3.new(posX, cy + 120, posZ)
        local rayDir = Vector3.new(0, -250, 0)
        local hit = workspace:Raycast(rayOrigin, rayDir, rayParams)

        if hit and hit.Normal.Y > 0.55 then -- Evita acantilados empinados
            local groundY = hit.Position.Y
            local groundCF = CFrame.new(posX, groundY, posZ) * CFrame.Angles(0, math.rad((i * 53) % 360), 0)
            local scale = 0.8 + (((i * 7) % 10) / 20) -- Escala entre 0.8 y 1.25

            if biome == "urban_clutter" then
                spawnUrbanClutter(groundCF)
            elseif biome == "mountain_rocks" then
                if i % 3 == 0 then
                    spawnPineTree(groundCF, scale)
                else
                    spawnRockCluster(groundCF, scale)
                end
            else -- "forest" (defecto)
                if i % 5 == 0 then
                    spawnRockCluster(groundCF, scale)
                elseif i % 5 == 1 then
                    spawnBush(groundCF, scale)
                elseif i % 5 == 2 or i % 5 == 3 then
                    spawnPineTree(groundCF, scale)
                else
                    spawnOakTree(groundCF, scale)
                end
            end

            spawned = spawned + 1
        end
    end

    print(string.format("[ScatterEngine] ✅ %d elementos orgánicos de bioma '%s' distribuidos en radio %d studs.", spawned, biome, radius))
end

buildScatter()
`;
}
