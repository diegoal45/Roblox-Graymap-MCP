import { PALETTE, METRICS } from "./palette.js";

/**
 * Genera el script Luau para colocar coberturas tácticas.
 */
export function generateCoverLuau({
  name = "Cover",
  x = 0,
  y = 0,
  z = 0,
  type = "low", // "low", "high", "pillar", "l_shape"
  length = 8,
  thickness = 1.5,
  rotationY = 0,
}) {
  let height = METRICS.lowCoverHeight;
  let color = PALETTE.lowCover;

  if (type === "high") {
    height = METRICS.highCoverHeight;
    color = PALETTE.highCover;
  } else if (type === "pillar") {
    height = 12;
    color = PALETTE.wallTrim;
  }

  if (type === "l_shape") {
    const halfH = METRICS.lowCoverHeight / 2;
    const l1 = length;
    const l2 = length * 0.7;
    return `
local function createLCover()
    local graybox = workspace:FindFirstChild("Graybox") or Instance.new("Folder", workspace)
    graybox.Name = "Graybox"

    local model = Instance.new("Model", graybox)
    model.Name = "${name}"

    local baseCF = CFrame.new(${x}, ${y}, ${z}) * CFrame.Angles(0, math.rad(${rotationY}), 0)

    local p1 = Instance.new("Part", model)
    p1.Name = "Wing1"
    p1.Anchored = true
    p1.CanCollide = true
    p1.Material = Enum.Material.SmoothPlastic
    p1.Color = ${PALETTE.lowCover}
    p1.Size = Vector3.new(${l1}, ${METRICS.lowCoverHeight}, ${thickness})
    p1.CFrame = baseCF * CFrame.new(0, ${halfH}, 0)

    local p2 = Instance.new("Part", model)
    p2.Name = "Wing2"
    p2.Anchored = true
    p2.CanCollide = true
    p2.Material = Enum.Material.SmoothPlastic
    p2.Color = ${PALETTE.lowCover}
    p2.Size = Vector3.new(${thickness}, ${METRICS.lowCoverHeight}, ${l2})
    p2.CFrame = baseCF * CFrame.new(-(${l1}/2) + (${thickness}/2), ${halfH}, (${l2}/2) + (${thickness}/2))
end

createLCover()
`;
  }

  if (type === "pillar") {
    return `
local function createPillar()
    local graybox = workspace:FindFirstChild("Graybox") or Instance.new("Folder", workspace)
    graybox.Name = "Graybox"

    local p = Instance.new("Part", graybox)
    p.Name = "${name}"
    p.Anchored = true
    p.CanCollide = true
    p.Material = Enum.Material.SmoothPlastic
    p.Color = ${PALETTE.wallTrim}
    p.Size = Vector3.new(4, ${height}, 4)
    p.CFrame = CFrame.new(${x}, ${y} + ${height}/2, ${z}) * CFrame.Angles(0, math.rad(${rotationY}), 0)
end

createPillar()
`;
  }

  // Cobertura estándar recta (low o high)
  return `
local function createCover()
    local graybox = workspace:FindFirstChild("Graybox") or Instance.new("Folder", workspace)
    graybox.Name = "Graybox"

    local p = Instance.new("Part", graybox)
    p.Name = "${name}"
    p.Anchored = true
    p.CanCollide = true
    p.Material = Enum.Material.SmoothPlastic
    p.Color = ${color}
    p.Size = Vector3.new(${length}, ${height}, ${thickness})
    p.CFrame = CFrame.new(${x}, ${y} + ${height}/2, ${z}) * CFrame.Angles(0, math.rad(${rotationY}), 0)
end

createCover()
`;
}
