import { PALETTE, METRICS } from "./palette.js";

/**
 * Genera el script Luau para construir una escalera transitable por el avatar.
 */
export function generateStairsLuau({
  name = "Stairs",
  startX = 0,
  startY = 0,
  startZ = 0,
  width = 6,
  totalHeight = 10,
  stepDepth = 2.0,
  direction = "+Z",
  includeTopPlatform = true,
  topPlatformLength = 6,
}) {
  // Asegurar que la altura de cada escalón sea transitable (máximo 1.1 studs)
  let steps = Math.ceil(totalHeight / METRICS.recommendedStepHeight);
  let stepHeight = totalHeight / steps;

  if (stepHeight > METRICS.maxStepHeight) {
    steps = Math.ceil(totalHeight / METRICS.maxStepHeight);
    stepHeight = totalHeight / steps;
  }

  // Vectores unitarios de dirección
  let dirX = 0, dirZ = 0;
  if (direction === "+Z") dirZ = 1;
  else if (direction === "-Z") dirZ = -1;
  else if (direction === "+X") dirX = 1;
  else if (direction === "-X") dirX = -1;
  else dirZ = 1;

  const isXAxis = dirX !== 0;

  return `
local function createStairs()
    local graybox = workspace:FindFirstChild("Graybox") or Instance.new("Folder", workspace)
    graybox.Name = "Graybox"

    local model = Instance.new("Model", graybox)
    model.Name = "${name}"

    local stairColor = ${PALETTE.stairs}
    local platformColor = ${PALETTE.platform}

    local stepCount = ${steps}
    local stepH = ${stepHeight}
    local stepD = ${stepDepth}
    local width = ${width}

    for i = 1, stepCount do
        local p = Instance.new("Part", model)
        p.Name = "Step_" .. i
        p.Anchored = true
        p.CanCollide = true
        p.TopSurface = Enum.SurfaceType.Smooth
        p.BottomSurface = Enum.SurfaceType.Smooth
        p.Material = Enum.Material.SmoothPlastic
        p.Color = stairColor

        local currentH = stepH * i
        local offsetD = (i - 1) * stepD

        local posX = ${startX} + (${dirX} * offsetD)
        local posY = ${startY} + (currentH / 2)
        local posZ = ${startZ} + (${dirZ} * offsetD)

        if ${isXAxis} then
            p.Size = Vector3.new(stepD, currentH, width)
        else
            p.Size = Vector3.new(width, currentH, stepD)
        end
        p.CFrame = CFrame.new(posX, posY, posZ)
    end

    ${
      includeTopPlatform
        ? `
    -- Plataforma de descanso superior
    local plat = Instance.new("Part", model)
    plat.Name = "TopPlatform"
    plat.Anchored = true
    plat.CanCollide = true
    plat.Material = Enum.Material.SmoothPlastic
    plat.Color = platformColor

    local platOffset = ((stepCount - 1) * stepD) + (stepD / 2) + (${topPlatformLength} / 2)
    local platX = ${startX} + (${dirX} * platOffset)
    local platY = ${startY} + ${totalHeight} - 0.5
    local platZ = ${startZ} + (${dirZ} * platOffset)

    if ${isXAxis} then
        plat.Size = Vector3.new(${topPlatformLength}, 1, width)
    else
        plat.Size = Vector3.new(width, 1, ${topPlatformLength})
    end
    plat.CFrame = CFrame.new(platX, platY, platZ)
    `
        : ""
    }
end

createStairs()
`;
}
