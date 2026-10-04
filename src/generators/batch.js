import { snapPosition, snapSize } from "./grid.js";

/**
 * Genera el script Luau optimizado para instanciar un lote (Batch) de decenas o cientos
 * de objetos de golpe en Roblox Studio, organizados en carpetas jerárquicas y con etiquetas (Tags)
 * y atributos de juego para mecánicas de pandillas/territorios/heists.
 */
export function generateBatchLuau({
  parts_list = [],
  defaultParent = "Graybox/City",
  snapGrid = 4, // 0 = no snap, 4 u 8 = múltiplos estándar de Roblox
}) {
  // Pre-procesar y ajustar a rejilla si está habilitado
  const sanitizedList = parts_list.map((item, idx) => {
    let [x, y, z] = item.position || [0, 0, 0];
    let [sx, sy, sz] = item.size || [4, 4, 4];

    if (snapGrid && snapGrid > 0) {
      [x, y, z] = snapPosition([x, y, z], snapGrid, false);
      // Solo ajustar en ancho y largo (X y Z) para no descalibrar alturas sutiles
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

-- Cache de carpetas jerárquicas para no buscar repetidamente
local folderCache = {}

local function getOrCreateHierarchy(pathStr)
    if folderCache[pathStr] then
        return folderCache[pathStr]
    end

    local segments = string.split(pathStr, "/")
    local current = workspace

    for _, segName in ipairs(segments) do
        if segName ~= "" then
            local nextFolder = current:FindFirstChild(segName)
            if not nextFolder then
                nextFolder = Instance.new("Folder")
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
    instance.TopSurface = Enum.TopSurfaceType.Smooth
    instance.BottomSurface = Enum.BottomSurfaceType.Smooth

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

    -- Organización por jerarquía
    local parentFolder = getOrCreateHierarchy(data.parent or "Graybox/City")
    instance.Parent = parentFolder
    return instance
end

for _, itemData in ipairs(batchData) do
    buildItem(itemData)
end
`;
}
