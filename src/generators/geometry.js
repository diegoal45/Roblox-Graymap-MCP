import { snapPosition, snapSize } from "./grid.js";

/**
 * Genera una rampa de cuña (WedgePart) indispensable para autopistas y calles empinadas.
 */
export function generateWedgeLuau({
  name = "Highway_Ramp",
  position = [0, 0, 0],
  size = [16, 8, 32], // [width (X), height (Y), length (Z)]
  rotation = [0, 0, 0], // rotación en grados
  color = [100, 100, 105],
  material = "Concrete",
  parent = "Graybox/Highways",
  tags = ["Road_Ramp"],
  attributes = {},
  snapGrid = 4,
}) {
  let [x, y, z] = position;
  let [sx, sy, sz] = size;

  if (snapGrid && snapGrid > 0) {
    [x, y, z] = snapPosition([x, y, z], snapGrid, false);
    sx = snapSize(sx, snapGrid, 2);
    sz = snapSize(sz, snapGrid, 2);
  }

  const tagsJson = JSON.stringify(tags || []);
  const attrJson = JSON.stringify(attributes || {});

  return `
local CollectionService = game:GetService("CollectionService")

local function buildWedge()
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

    local w = Instance.new("WedgePart", current)
    w.Name = "${name}"
    w.Anchored = true
    w.CanCollide = true
    w.TopSurface = Enum.TopSurfaceType.Smooth
    w.BottomSurface = Enum.BottomSurfaceType.Smooth
    w.Size = Vector3.new(${sx}, ${sy}, ${sz})

    local rx, ry, rz = math.rad(${rotation[0] || 0}), math.rad(${rotation[1] || 0}), math.rad(${rotation[2] || 0})
    w.CFrame = CFrame.new(${x}, ${y} + ${sy}/2, ${z}) * CFrame.Angles(rx, ry, rz)
    w.Color = Color3.fromRGB(${color[0]}, ${color[1]}, ${color[2]})
    
    pcall(function()
        w.Material = Enum.Material["${material}"] or Enum.Material.Concrete
    end)

    for _, t in ipairs(${tagsJson}) do
        CollectionService:AddTag(w, t)
    end
    for k, v in pairs(${attrJson}) do
        w:SetAttribute(k, v)
    end
end

buildWedge()
`;
}

/**
 * Genera una escalera técnica escalable por el avatar (TrussPart).
 * Ideal para callejones y andamios de la favela.
 */
export function generateTrussLuau({
  name = "Favela_Ladder",
  position = [0, 0, 0],
  height = 16,
  rotationY = 0,
  parent = "Graybox/Favela/Scaffolds",
  tags = ["Climbable_Truss"],
  attributes = {},
  snapGrid = 4,
}) {
  let [x, y, z] = position;
  if (snapGrid && snapGrid > 0) {
    [x, y, z] = snapPosition([x, y, z], snapGrid, false);
  }

  // TrussPart debe ser múltiplo de 2 en tamaño
  const roundedH = Math.max(2, Math.round(height / 2) * 2);
  const tagsJson = JSON.stringify(tags || []);
  const attrJson = JSON.stringify(attributes || {});

  return `
local CollectionService = game:GetService("CollectionService")

local function buildTruss()
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

    local t = Instance.new("TrussPart", current)
    t.Name = "${name}"
    t.Anchored = true
    t.CanCollide = true
    t.Size = Vector3.new(2, ${roundedH}, 2)
    t.CFrame = CFrame.new(${x}, ${y} + ${roundedH}/2, ${z}) * CFrame.Angles(0, math.rad(${rotationY}), 0)
    t.Color = Color3.fromRGB(160, 160, 165)
    t.Material = Enum.Material.Metal

    for _, tag in ipairs(${tagsJson}) do
        CollectionService:AddTag(t, tag)
    end
    for k, v in pairs(${attrJson}) do
        t:SetAttribute(k, v)
    end
end

buildTruss()
`;
}
