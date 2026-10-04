import { snapPosition } from "./grid.js";

/**
 * Generador de Calles y Avenidas Completas AAA para Roblox.
 * Calzada de asfalto texturizado, bordillos de granito salientes,
 * aceras peatonales elevadas, líneas viales dobles continuas/discontinuas,
 * tapas de registro/alcantarillas, rejillas de imbornal en cuneta
 * y farolas realistas con sombras proyectadas en tiempo real.
 */
export function generateStreetLuau({
  name = "Avenue",
  startPosition = [0, 0, -100],
  endPosition = [0, 0, 100],
  roadWidth = 24, // 2 carriles estándar de 12 studs cada uno
  sidewalkWidth = 8, // aceras amplias de 8 studs
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

    local function makePart(pName, size, relCF, color, mat, canCol, isDecor)
        local p = Instance.new("Part", model)
        p.Name = pName
        p.Anchored = true
        p.CanCollide = canCol ~= nil and canCol or true
        p.CanTouch = false
        if isDecor then p.CanQuery = false end
        p.TopSurface = Enum.SurfaceType.Smooth
        p.BottomSurface = Enum.SurfaceType.Smooth
        p.Size = size
        p.CFrame = roadCF * relCF
        p.Color = color
        p.Material = mat or Enum.Material.Concrete
        return p
    end

    local function makeCylinder(pName, size, relCF, color, mat)
        local p = Instance.new("Part", model)
        p.Name = pName
        p.Shape = Enum.PartType.Cylinder
        p.Anchored = true
        p.CanCollide = false
        p.CanTouch = false
        p.CanQuery = false
        p.Size = size
        p.CFrame = roadCF * relCF
        p.Color = color
        p.Material = mat or Enum.Material.DiamondPlate
        return p
    end

    local rW = ${roadWidth}
    local sW = ${sidewalkWidth}
    local curbW = 0.8
    local curbH = 0.8

    -- 1. Calzada de Asfalto (Elevada a +0.3 studs sobre la cota 0 del terreno para anular el z-fighting con la base)
    local roadSurfaceY = 0.3
    makePart("Asphalt_Road", Vector3.new(rW, 1.6, length), CFrame.new(0, roadSurfaceY - 0.8, 0), Color3.fromRGB(38, 40, 44), Enum.Material.Concrete)

    -- 2. Aceras y Bordillos de Granito (Elevados sobre la calzada)
    ${
      hasSidewalks
        ? `
    local swColor = Color3.fromRGB(195, 198, 204)
    local curbColor = Color3.fromRGB(150, 155, 162)
    local leftOffset = - (rW / 2) - (sW / 2)
    local rightOffset = (rW / 2) + (sW / 2)
    local swCenterY = roadSurfaceY + curbH / 2

    -- Aceras peatonales
    makePart("Sidewalk_Left", Vector3.new(sW, curbH, length), CFrame.new(leftOffset, swCenterY, 0), swColor, Enum.Material.Concrete)
    makePart("Sidewalk_Right", Vector3.new(sW, curbH, length), CFrame.new(rightOffset, swCenterY, 0), swColor, Enum.Material.Concrete)

    -- Bordillos de granito exteriores con resalte
    local curbLeftX = - (rW / 2) - (curbW / 2)
    local curbRightX = (rW / 2) + (curbW / 2)
    makePart("Curb_Left", Vector3.new(curbW, curbH + 0.1, length), CFrame.new(curbLeftX, swCenterY, 0), curbColor, Enum.Material.Granite)
    makePart("Curb_Right", Vector3.new(curbW, curbH + 0.1, length), CFrame.new(curbRightX, swCenterY, 0), curbColor, Enum.Material.Granite)

    -- Rejillas de imbornal pluvial en la cuneta del bordillo
    local drainStep = 50
    local drainCount = math.max(1, math.floor(length / drainStep))
    for d = 1, drainCount do
        local drainZ = (-length / 2) + (d - 0.5) * (length / drainCount)
        makePart("Storm_Drain_L_" .. d, Vector3.new(1.8, 0.08, 3.2), CFrame.new(-rW / 2 + 1.0, roadSurfaceY + 0.04, drainZ), Color3.fromRGB(45, 48, 54), Enum.Material.DiamondPlate, false, true)
        makePart("Storm_Drain_R_" .. d, Vector3.new(1.8, 0.08, 3.2), CFrame.new(rW / 2 - 1.0, roadSurfaceY + 0.04, drainZ), Color3.fromRGB(45, 48, 54), Enum.Material.DiamondPlate, false, true)
    end
    `
        : ""
    }

    -- 3. Líneas Viales (Pintura con relieve real de +0.06 studs sobre el asfalto para anular parpadeo)
    ${
      hasLanes
        ? `
    local stripeLength = 7
    local stripeGap = 6
    local totalStripeCycle = stripeLength + stripeGap
    local stripeCount = math.floor(length / totalStripeCycle)
    local stripeY = roadSurfaceY + 0.04

    for i = 1, stripeCount do
        local offsetZ = (-length / 2) + ((i - 0.5) * totalStripeCycle)
        makePart("Center_Stripe_" .. i, Vector3.new(0.7, 0.08, stripeLength), CFrame.new(0, stripeY, offsetZ), Color3.fromRGB(240, 200, 45), Enum.Material.SmoothPlastic, false, true)
    end

    -- Líneas blancas continuas laterales (delimitadoras de calzada)
    local edgeX = rW / 2 - 1.2
    makePart("Edge_Stripe_Left", Vector3.new(0.6, 0.08, length), CFrame.new(-edgeX, stripeY, 0), Color3.fromRGB(245, 248, 252), Enum.Material.SmoothPlastic, false, true)
    makePart("Edge_Stripe_Right", Vector3.new(0.6, 0.08, length), CFrame.new(edgeX, stripeY, 0), Color3.fromRGB(245, 248, 252), Enum.Material.SmoothPlastic, false, true)

    -- Tapas de registro de alcantarillado circulares
    if length >= 40 then
        local mhCF1 = CFrame.new(-4, roadSurfaceY + 0.04, -length / 4) * CFrame.Angles(0, 0, math.rad(90))
        local mhCF2 = CFrame.new(4, roadSurfaceY + 0.04, length / 4) * CFrame.Angles(0, 0, math.rad(90))
        makeCylinder("Manhole_A", Vector3.new(3.0, 0.08, 3.0), mhCF1, Color3.fromRGB(50, 54, 60), Enum.Material.DiamondPlate)
        makeCylinder("Manhole_B", Vector3.new(3.0, 0.08, 3.0), mhCF2, Color3.fromRGB(50, 54, 60), Enum.Material.DiamondPlate)
    end
    `
        : ""
    }

    -- 4. Farolas de Calle AAA con brazo curvo y sombras proyectadas
    ${
      hasLamps && hasSidewalks
        ? `
    local lampDist = ${lampInterval}
    local lampCount = math.max(1, math.floor(length / lampDist))
    local lampOffset = (rW / 2) + 2.0

    for i = 1, lampCount do
        local zOff = (-length / 2) + ((i - 0.5) * (length / lampCount))
        local isLeft = (i % 2 == 1)
        local posX = isLeft and -lampOffset or lampOffset
        local armDir = isLeft and 1 or -1

        -- Poste metálico con zócalo
        local base = makePart("Lamp_Base_" .. i, Vector3.new(1.4, 1.2, 1.4), CFrame.new(posX, curbH + 0.6, zOff), Color3.fromRGB(35, 38, 44), Enum.Material.Metal, true)
        local pole = makePart("Lamp_Pole_" .. i, Vector3.new(0.8, 16, 0.8), CFrame.new(posX, curbH + 8.5, zOff), Color3.fromRGB(42, 45, 52), Enum.Material.Metal, true)
        -- Brazo curvado sobre la calzada
        local arm = makePart("Lamp_Arm_" .. i, Vector3.new(2.8, 0.5, 0.6), CFrame.new(posX + armDir * 1.4, curbH + 16.2, zOff), Color3.fromRGB(42, 45, 52), Enum.Material.Metal, false, true)
        local head = makePart("Lamp_Head_" .. i, Vector3.new(1.6, 0.6, 1.4), CFrame.new(posX + armDir * 2.8, curbH + 15.8, zOff), Color3.fromRGB(35, 38, 44), Enum.Material.Metal, false, true)
        local bulb = makePart("Lamp_Bulb_" .. i, Vector3.new(1.2, 0.2, 1.0), CFrame.new(posX + armDir * 2.8, curbH + 15.4, zOff), Color3.fromRGB(255, 240, 205), Enum.Material.Neon, false, true)

        local light = Instance.new("PointLight", bulb)
        light.Color = Color3.fromRGB(255, 232, 185)
        light.Brightness = 2.0
        light.Range = 36
        light.Shadows = true
    end
    `
        : ""
    }

    print(string.format("[StreetEngine AAA] ✅ Calle '%s' (longitud %.1f studs, ancho %d studs) generada con éxito en '%s'.", "${name}", length, rW, "${parent}"))
end

buildStreet()
`;
}
