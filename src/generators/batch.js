import { snapPosition, snapSize } from "./grid.js";

/**
 * Genera el script Luau optimizado para instanciar un lote (Batch) de decenas o cientos
 * de objetos de golpe en Roblox Studio, con PERFORMANCE SHIELD (CanTouch = false,
 * optimización de sombras CastShadow y LOD StreamingMesh para 50+ jugadores).
 */
export function generateBatchLuau({
  parts_list = [],
  defaultParent = "Graybox/City",
  snapGrid = 4,
  autoOptimize = true, // Performance Shield para mapas masivos
}) {
  const sanitizedList = parts_list.map((item, idx) => {
    let [x, y, z] = item.position || [0, 0, 0];
    let [sx, sy, sz] = item.size || [4, 4, 4];

    if (snapGrid && snapGrid > 0) {
      [x, y, z] = snapPosition([x, y, z], snapGrid, false);
      sx = snapSize(sx, snapGrid, 1);
      sz = snapSize(sz, snapGrid, 1);
    }

    return {
      shape: item.shape || "Block",
      name: item.name || `Part_${idx + 1}`,
      pos: [x, y, z],
      size: [sx, sy, sz],
      rot: item.rotation || [0, 0, 0],
      color: item.color || [180, 180, 185],
      material: item.material || "SmoothPlastic",
      transparency: item.transparency ?? 0,
      canCollide: item.canCollide ?? true,
      anchored: item.anchored ?? true,
      castShadow: item.castShadow ?? (sy < 1.2 ? false : true),
      parent: item.parent || defaultParent,
      tags: Array.isArray(item.tags) ? item.tags : [],
      attributes: typeof item.attributes === "object" && item.attributes !== null ? item.attributes : {},
    };
  });

  const payloadJson = JSON.stringify(sanitizedList);

  return `
local HttpService = game:GetService("HttpService")
local CollectionService = game:GetService("CollectionService")

local batchData = HttpService:JSONDecode([==[${payloadJson}]==])
local autoOpt = ${autoOptimize}

local folderCache = {}

local function getOrCreateHierarchy(pathStr)
    if folderCache[pathStr] then
        return folderCache[pathStr]
    end

    local segments = string.split(pathStr, "/")
    local current = workspace

    for i, segName in ipairs(segments) do
        if segName ~= "" then
            local nextFolder = current:FindFirstChild(segName)
            if not nextFolder then
                -- Si es el último segmento y parece un edificio, usar Model con LOD
                if i == #segments and not segName:lower():find("folder") and not segName:lower():find("district") then
                    nextFolder = Instance.new("Model")
                    pcall(function()
                        nextFolder.LevelOfDetail = Enum.ModelLevelOfDetail.StreamingMesh
                    end)
                else
                    nextFolder = Instance.new("Folder")
                end
                nextFolder.Name = segName
                nextFolder.Parent = current
            end
            current = nextFolder
        end
    end

    folderCache[pathStr] = current
    return current
end

local function buildItem(data)
    local shape = data.shape
    local instance

    if shape == "Wedge" then
        instance = Instance.new("WedgePart")
    elseif shape == "CornerWedge" then
        instance = Instance.new("CornerWedgePart")
    elseif shape == "Truss" then
        instance = Instance.new("TrussPart")
    else
        instance = Instance.new("Part")
        if shape == "Cylinder" then
            instance.Shape = Enum.PartType.Cylinder
        elseif shape == "Sphere" then
            instance.Shape = Enum.PartType.Ball
        end
    end

    instance.Name = data.name
    instance.Size = Vector3.new(data.size[1], data.size[2], data.size[3])
    
    local rx, ry, rz = math.rad(data.rot[1] or 0), math.rad(data.rot[2] or 0), math.rad(data.rot[3] or 0)
    instance.CFrame = CFrame.new(data.pos[1], data.pos[2], data.pos[3]) * CFrame.Angles(rx, ry, rz)

    instance.Color = Color3.fromRGB(data.color[1] or 180, data.color[2] or 180, data.color[3] or 185)
    
    pcall(function()
        instance.Material = Enum.Material[data.material] or Enum.Material.SmoothPlastic
    end)

    instance.Transparency = data.transparency or 0
    instance.CanCollide = data.canCollide
    instance.Anchored = data.anchored
    instance.CastShadow = data.castShadow
    instance.TopSurface = Enum.SurfaceType.Smooth
    instance.BottomSurface = Enum.SurfaceType.Smooth

    -- PERFORMANCE SHIELD: Poda de física para servidores de 50 jugadores
    if autoOpt then
        instance.CanTouch = false -- Ahorra listeners de eventos de contacto innecesarios
        -- Si es un techo elevado (> 16 studs de alto), desactivar colisión para ahorrar broadphase
        if data.pos[2] > 16 and (data.name:lower():find("ceiling") or data.name:lower():find("roof")) then
            instance.CanQuery = false
        end
    end

    -- Asignación de Tags (CollectionService)
    if data.tags then
        for _, tag in ipairs(data.tags) do
            if type(tag) == "string" and tag ~= "" then
                CollectionService:AddTag(instance, tag)
            end
        end
    end

    -- Asignación de Atributos de Juego
    if data.attributes then
        for k, v in pairs(data.attributes) do
            instance:SetAttribute(k, v)
        end
    end

    local parentFolder = getOrCreateHierarchy(data.parent or "Graybox/City")
    instance.Parent = parentFolder
    return instance
end

for _, itemData in ipairs(batchData) do
    buildItem(itemData)
end
`;
}
