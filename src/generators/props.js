import { PALETTE, METRICS } from "./palette.js";
import { snapPosition } from "./grid.js";

/**
 * Generador de Mobiliario y Props Tácticos Lowpoly / Graybox.
 * Tipos soportados:
 * - "counter": Mostrador de atención / recepción / tienda (altura 3 studs = cobertura baja)
 * - "desk": Escritorio de oficina con cajonera
 * - "shelf": Estantería de almacén o tienda (8 studs de alto)
 * - "dumpster": Contenedor de basura industrial de callejón (cobertura media)
 * - "barrier": Barrera de tráfico / Jersey barrier de concreto
 * - "street_lamp": Farola de calle estilizada con PointLight activa
 * - "dummy": Maniquí de referencia de escala humana R15 (5 studs de altura)
 */
export function generatePropLuau({
  type = "counter",
  name,
  position = [0, 0, 0],
  rotationY = 0,
  length = 8,
  parent = "Graybox/Props",
  tags = [],
  attributes = {},
  snapGrid = 4,
}) {
  let [x, y, z] = position;
  if (snapGrid && snapGrid > 0) {
    [x, y, z] = snapPosition([x, y, z], snapGrid, false);
  }

  const propName = name || `Prop_${type.charAt(0).toUpperCase() + type.slice(1)}`;
  const tagsJson = JSON.stringify(tags || []);
  const attrJson = JSON.stringify(attributes || {});

  return `
local CollectionService = game:GetService("CollectionService")

local function buildProp()
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
    model.Name = "${propName}"
    pcall(function() model.LevelOfDetail = Enum.ModelLevelOfDetail.StreamingMesh end)

    for _, t in ipairs(${tagsJson}) do CollectionService:AddTag(model, t) end
    for k, v in pairs(${attrJson}) do model:SetAttribute(k, v) end

    local baseCF = CFrame.new(${x}, ${y}, ${z}) * CFrame.Angles(0, math.rad(${rotationY}), 0)

    local function makePart(pName, size, relCF, color, mat, canCol, castShad)
        local p = Instance.new("Part", model)
        p.Name = pName
        p.Anchored = true
        p.CanCollide = canCol ~= nil and canCol or true
        p.CanTouch = false
        p.CastShadow = castShad ~= nil and castShad or true
        p.TopSurface = Enum.TopSurfaceType.Smooth
        p.BottomSurface = Enum.BottomSurfaceType.Smooth
        p.Size = size
        p.CFrame = baseCF * relCF
        p.Color = color
        p.Material = mat or Enum.Material.SmoothPlastic
        return p
    end

    local propType = "${type}"

    if propType == "counter" then
        -- Mostrador de recepción/banco/tienda (3 studs de alto, cobertura media)
        local cLen = ${length}
        makePart("Counter_Base", Vector3.new(cLen, 2.7, 2), CFrame.new(0, 1.35, 0), Color3.fromRGB(70, 70, 75), Enum.Material.SmoothPlastic)
        makePart("Counter_Top", Vector3.new(cLen + 0.4, 0.3, 2.4), CFrame.new(0, 2.85, 0), Color3.fromRGB(190, 175, 150), Enum.Material.SmoothPlastic)
        CollectionService:AddTag(model, "Cover_Low")

    elseif propType == "desk" then
        -- Escritorio de oficina con cajonera
        local w, d, h = 6, 3.5, 2.8
        makePart("Desk_Top", Vector3.new(w, 0.25, d), CFrame.new(0, h - 0.125, 0), Color3.fromRGB(150, 130, 105), Enum.Material.WoodPlanks)
        makePart("Leg_Left", Vector3.new(0.3, h - 0.25, d), CFrame.new(-w/2 + 0.15, (h - 0.25)/2, 0), Color3.fromRGB(45, 45, 50), Enum.Material.Metal)
        makePart("Leg_Right", Vector3.new(0.3, h - 0.25, d), CFrame.new(w/2 - 0.15, (h - 0.25)/2, 0), Color3.fromRGB(45, 45, 50), Enum.Material.Metal)
        makePart("Drawer_Unit", Vector3.new(1.8, h - 0.3, d - 0.4), CFrame.new(w/2 - 1.2, (h - 0.3)/2, 0), Color3.fromRGB(60, 60, 65), Enum.Material.SmoothPlastic)

    elseif propType == "shelf" then
        -- Estantería de almacén de 8 studs de alto
        local sW, sD, sH = ${length}, 2.5, 8
        makePart("Frame_L", Vector3.new(0.3, sH, sD), CFrame.new(-sW/2 + 0.15, sH/2, 0), Color3.fromRGB(60, 80, 110), Enum.Material.Metal)
        makePart("Frame_R", Vector3.new(0.3, sH, sD), CFrame.new(sW/2 - 0.15, sH/2, 0), Color3.fromRGB(60, 80, 110), Enum.Material.Metal)
        for i = 1, 4 do
            local shelfY = (sH / 4) * i - 0.5
            makePart("Shelf_Plank_" .. i, Vector3.new(sW - 0.6, 0.2, sD - 0.2), CFrame.new(0, shelfY, 0), Color3.fromRGB(140, 140, 145), Enum.Material.Metal)
        end

    elseif propType == "dumpster" then
        -- Contenedor de basura de callejón (cobertura sólida)
        local dW, dH, dL = 6, 3.5, 4
        makePart("Dumpster_Body", Vector3.new(dW, dH - 0.6, dL), CFrame.new(0, (dH - 0.6)/2, 0), Color3.fromRGB(50, 85, 60), Enum.Material.Metal)
        makePart("Dumpster_Lid", Vector3.new(dW + 0.2, 0.4, dL + 0.2), CFrame.new(0, dH - 0.4, 0), Color3.fromRGB(35, 40, 35), Enum.Material.SmoothPlastic)
        CollectionService:AddTag(model, "Cover_Low")

    elseif propType == "barrier" then
        -- Barrera de concreto Jersey de autopista/calle
        local bLen = ${length}
        makePart("Jersey_Barrier", Vector3.new(bLen, 3.2, 1.6), CFrame.new(0, 1.6, 0), Color3.fromRGB(165, 165, 170), Enum.Material.Concrete)
        makePart("Yellow_Reflector", Vector3.new(bLen, 0.4, 1.65), CFrame.new(0, 2.4, 0), Color3.fromRGB(240, 185, 30), Enum.Material.Neon)
        CollectionService:AddTag(model, "Cover_Low")

    elseif propType == "street_lamp" then
        -- Farola de calle con iluminación real
        local poleH = 16
        local pole = makePart("Pole", Vector3.new(0.8, poleH, 0.8), CFrame.new(0, poleH/2, 0), Color3.fromRGB(45, 50, 55), Enum.Material.Metal)
        makePart("Arm", Vector3.new(3.5, 0.6, 0.8), CFrame.new(1.75, poleH - 0.3, 0), Color3.fromRGB(45, 50, 55), Enum.Material.Metal)
        local lampHead = makePart("Lamp_Head", Vector3.new(1.4, 0.4, 1.0), CFrame.new(3.2, poleH - 0.6, 0), Color3.fromRGB(245, 245, 235), Enum.Material.Neon)
        
        local light = Instance.new("PointLight", lampHead)
        light.Color = Color3.fromRGB(255, 240, 210)
        light.Brightness = 2.0
        light.Range = 32
        light.Shadows = true

    elseif propType == "dummy" then
        -- Maniquí de escala humana R15 (5 studs de alto exactos)
        local dummyCol = Color3.fromRGB(220, 140, 50)
        local dMat = Enum.Material.SmoothPlastic
        -- Piernas (2 studs)
        makePart("Legs", Vector3.new(2, 2, 1), CFrame.new(0, 1, 0), dummyCol, dMat, false, false)
        -- Torso (2 studs)
        makePart("Torso", Vector3.new(2, 2, 1), CFrame.new(0, 3, 0), dummyCol, dMat, false, false)
        -- Brazos (ancho total 4 studs)
        makePart("Arm_L", Vector3.new(1, 2, 1), CFrame.new(-1.5, 3, 0), dummyCol, dMat, false, false)
        makePart("Arm_R", Vector3.new(1, 2, 1), CFrame.new(1.5, 3, 0), dummyCol, dMat, false, false)
        -- Cabeza (1 stud)
        makePart("Head", Vector3.new(1.2, 1, 1), CFrame.new(0, 4.5, 0), Color3.fromRGB(240, 240, 245), dMat, false, false)
    end
end

buildProp()
`;
}
