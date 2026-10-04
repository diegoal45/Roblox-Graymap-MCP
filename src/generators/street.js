import { PALETTE } from "./palette.js";
import { snapPosition } from "./grid.js";

/**
 * Generador de Calles y Avenidas Completas con Asfalto, Aceras elevadas,
 * Líneas viales divisorias y Farolas de iluminación automáticas.
 */
export function generateStreetLuau({
  name = "Avenue",
  startPosition = [0, 0, -100],
  endPosition = [0, 0, 100],
  roadWidth = 24, // 2 carriles estándar de 12 studs cada uno
  sidewalkWidth = 6, // aceras de 6 studs
  hasLanes = true,
  hasSidewalks = true,
  hasLamps = true,
  lampInterval = 48,
  parent = "City/Streets",
}) {
  const [x1, y1, z1] = startPosition;
  const [x2, y2, z2] = endPosition;

  return `
local CollectionService = game:GetService("CollectionService")

local function buildStreet()
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

    local p1 = Vector3.new(${x1}, ${y1}, ${z1})
    local p2 = Vector3.new(${x2}, ${y2}, ${z2})

    local delta = p2 - p1
    local length = delta.Magnitude
    if length < 1 then return end

    local midPoint = (p1 + p2) / 2
    local roadCF = CFrame.lookAt(midPoint, p2)

    local function makePart(pName, size, relCF, color, mat, canCol)
        local p = Instance.new("Part", model)
        p.Name = pName
        p.Anchored = true
        p.CanCollide = canCol ~= nil and canCol or true
        p.CanTouch = false
        p.TopSurface = Enum.TopSurfaceType.Smooth
        p.BottomSurface = Enum.BottomSurfaceType.Smooth
        p.Size = size
        p.CFrame = roadCF * relCF
        p.Color = color
        p.Material = mat or Enum.Material.Concrete
        return p
    end

    local rW = ${roadWidth}
    local sW = ${sidewalkWidth}

    -- 1. Calzada de Asfalto (rebajada -0.5 studs)
    makePart("Asphalt_Road", Vector3.new(rW, 1, length), CFrame.new(0, -0.5, 0), Color3.fromRGB(42, 42, 46), Enum.Material.Concrete)

    -- 2. Aceras Elevadas a los costados (+0.5 studs sobre el asfalto)
    ${
      hasSidewalks
        ? `
    local swColor = Color3.fromRGB(170, 170, 175)
    local leftOffset = - (rW / 2) - (sW / 2)
    local rightOffset = (rW / 2) + (sW / 2)

    makePart("Sidewalk_Left", Vector3.new(sW, 1, length), CFrame.new(leftOffset, 0, 0), swColor, Enum.Material.Concrete)
    makePart("Sidewalk_Right", Vector3.new(sW, 1, length), CFrame.new(rightOffset, 0, 0), swColor, Enum.Material.Concrete)
    `
        : ""
    }

    -- 3. Líneas divisorias centrales de carril
    ${
      hasLanes
        ? `
    local stripeLength = 6
    local stripeGap = 6
    local totalStripeCycle = stripeLength + stripeGap
    local stripeCount = math.floor(length / totalStripeCycle)

    for i = 1, stripeCount do
        local offsetZ = (-length / 2) + ((i - 0.5) * totalStripeCycle)
        makePart("Center_Stripe_" .. i, Vector3.new(0.6, 0.05, stripeLength), CFrame.new(0, 0.025, offsetZ), Color3.fromRGB(240, 195, 40), Enum.Material.Neon, false)
    end
    `
        : ""
    }

    -- 4. Farolas de Calle (Street Lamps) a intervalos regulares
    ${
      hasLamps && hasSidewalks
        ? `
    local lampDist = ${lampInterval}
    local lampCount = math.max(1, math.floor(length / lampDist))
    local lampOffset = (rW / 2) + 1.2 -- En el borde de la acera

    for i = 1, lampCount do
        local zOff = (-length / 2) + ((i - 0.5) * (length / lampCount))
        -- Farola en acera izquierda
        local poleL = makePart("Lamp_Pole_L_" .. i, Vector3.new(0.8, 16, 0.8), CFrame.new(-lampOffset, 8, zOff), Color3.fromRGB(45, 50, 55), Enum.Material.Metal)
        local headL = makePart("Lamp_Head_L_" .. i, Vector3.new(1.2, 0.4, 1.0), CFrame.new(-lampOffset + 1.5, 15.6, zOff), Color3.fromRGB(245, 240, 230), Enum.Material.Neon)
        local lightL = Instance.new("PointLight", headL)
        lightL.Color = Color3.fromRGB(255, 240, 210)
        lightL.Brightness = 2.0
        lightL.Range = 36
        lightL.Shadows = true
    end
    `
        : ""
    }
end

buildStreet()
`;
}
