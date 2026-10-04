import { snapPosition } from "./grid.js";

/**
 * Mobiliario Urbano y Dressing de Aceras AAA para Roblox.
 * Genera farolas con luz real, árboles con alcorques, bocas de incendio,
 * bancos peatonales, papeleras y paradas de autobús.
 */
export function generateStreetFurnitureLuau({
  streetPath = "City/Streets",
  center = [0, 0, 0],
  length = 120,
  orientation = "Z", // "Z" o "X"
  sidewalkOffset = 16, // distancia desde el centro de la calle al centro de la acera
  interval = 40,
  includeTrees = true,
  includeLamps = true,
  includeBenches = true,
  includeHydrants = true,
  parent = "City/Props",
}) {
  const [cx, cy, cz] = center;

  return `
local CollectionService = game:GetService("CollectionService")

local function buildFurniture()
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
    model.Name = "StreetFurniture_${orientation}"
    pcall(function() model.LevelOfDetail = Enum.ModelLevelOfDetail.StreamingMesh end)

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

    local function spawnLamp(cf)
        local pole = makePart("Lamp_Pole", Vector3.new(0.8, 14, 0.8), cf * CFrame.new(0, 7, 0), Color3.fromRGB(45, 48, 55), Enum.Material.Metal, true)
        local arm = makePart("Lamp_Arm", Vector3.new(0.6, 0.6, 3), cf * CFrame.new(0, 13.8, 1.2), Color3.fromRGB(45, 48, 55), Enum.Material.Metal, false)
        local head = makePart("Lamp_Head", Vector3.new(1.4, 0.6, 2), cf * CFrame.new(0, 13.5, 2.5), Color3.fromRGB(35, 38, 44), Enum.Material.Metal, false)
        local bulb = makePart("Lamp_Bulb", Vector3.new(1.0, 0.2, 1.4), cf * CFrame.new(0, 13.1, 2.5), Color3.fromRGB(255, 240, 200), Enum.Material.Neon, false)

        local light = Instance.new("PointLight", bulb)
        light.Color = Color3.fromRGB(255, 225, 175)
        light.Range = 28
        light.Brightness = 1.4
        light.Shadows = true
    end

    local function spawnTree(cf)
        -- Alcorque de fundición metálica en la acera
        makePart("Tree_Grate", Vector3.new(4, 0.2, 4), cf * CFrame.new(0, 0.1, 0), Color3.fromRGB(35, 38, 42), Enum.Material.DiamondPlate, true)
        -- Tierra interior
        makePart("Tree_Dirt", Vector3.new(3.2, 0.2, 3.2), cf * CFrame.new(0, 0.12, 0), Color3.fromRGB(75, 55, 40), Enum.Material.Ground, false)
        -- Tronco
        local trunk = makePart("Tree_Trunk", Vector3.new(1.2, 8, 1.2), cf * CFrame.new(0, 4.1, 0), Color3.fromRGB(85, 55, 35), Enum.Material.WoodPlanks, true)
        -- Copa frondosa low-poly
        local crown1 = makePart("Tree_Crown_1", Vector3.new(6, 5, 6), cf * CFrame.new(0, 9.5, 0), Color3.fromRGB(60, 125, 55), Enum.Material.Grass, false)
        local crown2 = makePart("Tree_Crown_2", Vector3.new(4.5, 4, 4.5), cf * CFrame.new(0, 12.5, 0), Color3.fromRGB(75, 145, 65), Enum.Material.Grass, false)
    end

    local function spawnBench(cf)
        -- Banco de forja y listones de madera
        local legL = makePart("Bench_LegL", Vector3.new(0.4, 2, 2), cf * CFrame.new(-2.6, 1, 0), Color3.fromRGB(35, 38, 42), Enum.Material.Metal, true)
        local legR = makePart("Bench_LegR", Vector3.new(0.4, 2, 2), cf * CFrame.new(2.6, 1, 0), Color3.fromRGB(35, 38, 42), Enum.Material.Metal, true)
        local seat = makePart("Bench_Seat", Vector3.new(5.6, 0.4, 1.6), cf * CFrame.new(0, 1.6, 0), Color3.fromRGB(120, 80, 50), Enum.Material.WoodPlanks, true)
        local back = makePart("Bench_Back", Vector3.new(5.6, 1.4, 0.4), cf * CFrame.new(0, 2.6, -0.7), Color3.fromRGB(120, 80, 50), Enum.Material.WoodPlanks, false)
    end

    local function spawnHydrant(cf)
        local base = makePart("Hydrant_Base", Vector3.new(1.2, 0.4, 1.2), cf * CFrame.new(0, 0.2, 0), Color3.fromRGB(180, 35, 35), Enum.Material.Metal, true)
        local body = makePart("Hydrant_Body", Vector3.new(1.0, 2.4, 1.0), cf * CFrame.new(0, 1.4, 0), Color3.fromRGB(205, 40, 40), Enum.Material.Metal, true)
        body.Shape = Enum.PartType.Cylinder
        body.CFrame = cf * CFrame.new(0, 1.4, 0) * CFrame.Angles(0, 0, math.rad(90))
        local cap = makePart("Hydrant_Cap", Vector3.new(1.2, 0.6, 1.2), cf * CFrame.new(0, 2.7, 0), Color3.fromRGB(230, 185, 40), Enum.Material.Metal, false)
        cap.Shape = Enum.PartType.Ball
    end

    local function spawnTrashBin(cf)
        local bin = makePart("Trash_Bin", Vector3.new(1.4, 2.4, 1.4), cf * CFrame.new(0, 1.2, 0), Color3.fromRGB(40, 45, 52), Enum.Material.Metal, true)
        local rim = makePart("Trash_Rim", Vector3.new(1.6, 0.3, 1.6), cf * CFrame.new(0, 2.3, 0), Color3.fromRGB(60, 65, 75), Enum.Material.Metal, false)
    end

    local halfLen = ${length} / 2
    local step = ${interval}
    local offset = ${sidewalkOffset}
    local isZ = "${orientation}" == "Z"

    for d = -halfLen + step / 2, halfLen - step / 2, step do
        local side = 1
        for s = 1, 2 do
            local posX, posZ
            if isZ then
                posX = ${cx} + (side * offset)
                posZ = ${cz} + d
            else
                posX = ${cx} + d
                posZ = ${cz} + (side * offset)
            end

            local rotY = side == 1 and 0 or math.rad(180)
            if not isZ then
                rotY = side == 1 and math.rad(90) or math.rad(-90)
            end

            local itemCF = CFrame.new(posX, ${cy}, posZ) * CFrame.Angles(0, rotY, 0)

            -- Alternancia rítmica: Farola ➔ Árbol ➔ Banco/Papelera
            local index = math.floor((d + halfLen) / step) + s
            if index % 3 == 0 and ${includeLamps} then
                spawnLamp(itemCF)
            elseif index % 3 == 1 and ${includeTrees} then
                spawnTree(itemCF)
            elseif index % 3 == 2 then
                if ${includeBenches} and s == 1 then
                    spawnBench(itemCF)
                elseif ${includeHydrants} and s == 2 then
                    spawnHydrant(itemCF)
                else
                    spawnTrashBin(itemCF)
                end
            end

            side = -side
        end
    end

    print("[StreetFurniture] ✅ Mobiliario urbano desplegado a lo largo de ${length} studs.")
end

buildFurniture()
`;
}
