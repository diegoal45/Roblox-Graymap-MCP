import { snapPosition } from "./grid.js";

/**
 * Generador de Señalización Vial y Semáforos Profesionales Estilo GTA San Andreas.
 * Soporta:
 * - Señales de STOP octogonales en postes de aluminio
 * - Placas con nombres de calles en cruces (ej: "GROVE ST / GANTON AVE")
 * - Señales de límite de velocidad (SPEED LIMIT 35 / 45)
 * - Semáforos en mástil curvado sobre la calzada con ópticas 3D y señal peatonal
 * - Flechas termoplásticas de dirección pintadas en el asfalto (recto, giro)
 */

export function generateTrafficSignageLuau({
  type = "intersection_traffic_light", // "intersection_traffic_light", "stop_sign", "street_name_sign", "speed_limit", "road_arrows"
  position = [0, 0, 0],
  rotationY = 0,
  streetA = "GROVE ST",
  streetB = "GANTON AVE",
  speedLimit = 35,
  arrowType = "straight_and_turn", // "straight", "turn_left", "turn_right", "straight_and_turn"
  parent = "City/Signage",
}) {
  const [posX, posY, posZ] = position;

  return `
local CollectionService = game:GetService("CollectionService")

local function buildTrafficSignage()
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
    model.Name = "Signage_${type}"
    pcall(function() model.LevelOfDetail = Enum.ModelLevelOfDetail.StreamingMesh end)

    local baseCF = CFrame.new(${posX}, ${posY}, ${posZ}) * CFrame.Angles(0, math.rad(${rotationY}), 0)

    local function makePart(pName, sz, relCF, col, mat, canCol, isDecor)
        local p = Instance.new("Part", model)
        p.Name = pName
        p.Anchored = true
        p.CanCollide = canCol ~= nil and canCol or false
        p.CanTouch = false
        if isDecor then p.CanQuery = false end
        p.TopSurface = Enum.SurfaceType.Smooth
        p.BottomSurface = Enum.SurfaceType.Smooth
        p.Size = sz
        p.CFrame = baseCF * relCF
        p.Color = col
        p.Material = mat or Enum.Material.Metal
        return p
    end

    local function makeCylinder(pName, sz, relCF, col, mat)
        local p = Instance.new("Part", model)
        p.Name = pName
        p.Shape = Enum.PartType.Cylinder
        p.Anchored = true
        p.CanCollide = false
        p.CanTouch = false
        p.CanQuery = false
        p.Size = sz
        p.CFrame = baseCF * relCF
        p.Color = col
        p.Material = mat or Enum.Material.Metal
        return p
    end

    local signType = "${type}"

    if signType == "intersection_traffic_light" then
        -- -------------------------------------------------------------
        -- SEMÁFORO EN MÁSTIL CURVADO CON CABEZAL VEHICULAR Y PEATONAL
        -- -------------------------------------------------------------
        local poleH = 19
        local armReach = 14
        -- Poste vertical principal
        makePart("Pole_Vertical", Vector3.new(0.9, poleH, 0.9), CFrame.new(0, poleH / 2, 0), Color3.fromRGB(48, 52, 58), Enum.Material.Metal, true)
        -- Brazo horizontal curvado sobre el carril de tráfico
        makePart("Pole_Mast_Arm", Vector3.new(armReach, 0.7, 0.7), CFrame.new(armReach / 2, poleH - 0.5, 0), Color3.fromRGB(48, 52, 58), Enum.Material.Metal, true)

        -- Cabezal del semáforo principal suspendido en el extremo del brazo
        local headCF = CFrame.new(armReach - 2, poleH - 3.5, 0)
        -- Caja negra del semáforo con viseras
        makePart("Signal_Housing", Vector3.new(1.8, 5.4, 1.4), headCF, Color3.fromRGB(28, 30, 35), Enum.Material.Metal, false, true)

        -- Óptica Roja (Superior)
        local redLens = makePart("Lens_Red", Vector3.new(1.2, 1.2, 0.2), headCF * CFrame.new(0, 1.6, 0.75), Color3.fromRGB(255, 35, 35), Enum.Material.Neon, false, true)
        redLens.Shape = Enum.PartType.Ball
        local rLight = Instance.new("PointLight", redLens)
        rLight.Color = Color3.fromRGB(255, 30, 30)
        rLight.Range = 14
        rLight.Brightness = 1.6

        -- Óptica Ámbar (Media)
        local yellowLens = makePart("Lens_Yellow", Vector3.new(1.2, 1.2, 0.2), headCF * CFrame.new(0, 0, 0.75), Color3.fromRGB(240, 185, 30), Enum.Material.SmoothPlastic, false, true)
        yellowLens.Shape = Enum.PartType.Ball

        -- Óptica Verde (Inferior)
        local greenLens = makePart("Lens_Green", Vector3.new(1.2, 1.2, 0.2), headCF * CFrame.new(0, -1.6, 0.75), Color3.fromRGB(35, 220, 90), Enum.Material.SmoothPlastic, false, true)
        greenLens.Shape = Enum.PartType.Ball

        -- Cabezal de semáforo peatonal en el poste a la altura de la acera (caminar/parar)
        local pedCF = CFrame.new(0, 7.5, 0.6)
        makePart("Ped_Housing", Vector3.new(1.4, 2.4, 1.0), pedCF, Color3.fromRGB(28, 30, 35), Enum.Material.Metal, false, true)
        local pedHand = makePart("Ped_Don’t_Walk", Vector3.new(0.9, 0.9, 0.1), pedCF * CFrame.new(0, 0.5, 0.55), Color3.fromRGB(255, 60, 40), Enum.Material.Neon, false, true)
        local pedWalk = makePart("Ped_Walk", Vector3.new(0.9, 0.9, 0.1), pedCF * CFrame.new(0, -0.5, 0.55), Color3.fromRGB(220, 240, 255), Enum.Material.SmoothPlastic, false, true)

        -- Placas dobles con nombres de calles en el poste
        makePart("Street_Plate_A", Vector3.new(5.0, 1.0, 0.2), CFrame.new(0, 12, 0.6), Color3.fromRGB(25, 95, 45), Enum.Material.SmoothPlastic, false, true)
        makePart("Street_Plate_B", Vector3.new(0.2, 1.0, 5.0), CFrame.new(0.6, 13.2, 0), Color3.fromRGB(25, 95, 45), Enum.Material.SmoothPlastic, false, true)

    elseif signType == "stop_sign" then
        -- -------------------------------------------------------------
        -- SEÑAL DE STOP OCTOGONAL ROJA CON BORDE BLANCO
        -- -------------------------------------------------------------
        local poleH = 9.5
        makePart("Stop_Pole", Vector3.new(0.3, poleH, 0.3), CFrame.new(0, poleH / 2, 0), Color3.fromRGB(180, 185, 192), Enum.Material.Metal, true)
        -- Chapa octogonal de STOP
        local signCF = CFrame.new(0, poleH + 1.6, 0)
        local stopPlate = makePart("Stop_Plate_1", Vector3.new(3.4, 3.4, 0.1), signCF, Color3.fromRGB(215, 30, 30), Enum.Material.SmoothPlastic, false, true)
        local stopPlateRot = makePart("Stop_Plate_2", Vector3.new(3.4, 3.4, 0.1), signCF * CFrame.Angles(0, 0, math.rad(45)), Color3.fromRGB(215, 30, 30), Enum.Material.SmoothPlastic, false, true)
        -- Texto blanco frontal "STOP"
        makePart("Stop_Text_Box", Vector3.new(2.4, 0.8, 0.12), signCF * CFrame.new(0, 0, 0.05), Color3.fromRGB(250, 250, 255), Enum.Material.SmoothPlastic, false, true)

    elseif signType == "street_name_sign" then
        -- -------------------------------------------------------------
        -- CRUCETA DE NOMBRES DE CALLE ESTILO AMERICANO / GTA
        -- -------------------------------------------------------------
        local poleH = 10.5
        makePart("Street_Pole", Vector3.new(0.3, poleH, 0.3), CFrame.new(0, poleH / 2, 0), Color3.fromRGB(175, 180, 188), Enum.Material.Metal, true)
        -- Placa Calle A (Verde con letras blancas)
        makePart("Sign_Street_A", Vector3.new(5.2, 1.1, 0.15), CFrame.new(0, poleH + 0.5, 0), Color3.fromRGB(30, 105, 50), Enum.Material.SmoothPlastic, false, true)
        -- Placa Calle B (Cruzada a 90°)
        makePart("Sign_Street_B", Vector3.new(0.15, 1.1, 5.2), CFrame.new(0, poleH + 1.8, 0), Color3.fromRGB(30, 105, 50), Enum.Material.SmoothPlastic, false, true)

    elseif signType == "speed_limit" then
        -- -------------------------------------------------------------
        -- SEÑAL DE LÍMITE DE VELOCIDAD ("SPEED LIMIT 35 / 45")
        -- -------------------------------------------------------------
        local poleH = 9.0
        makePart("Speed_Pole", Vector3.new(0.3, poleH, 0.3), CFrame.new(0, poleH / 2, 0), Color3.fromRGB(180, 185, 192), Enum.Material.Metal, true)
        -- Placa rectangular blanca
        local plate = makePart("Speed_Plate", Vector3.new(2.8, 3.6, 0.1), CFrame.new(0, poleH + 1.8, 0), Color3.fromRGB(245, 245, 248), Enum.Material.SmoothPlastic, false, true)
        -- Borde y número negro
        makePart("Speed_Border", Vector3.new(2.6, 3.4, 0.12), CFrame.new(0, poleH + 1.8, 0), Color3.fromRGB(25, 28, 32), Enum.Material.SmoothPlastic, false, true)
        makePart("Speed_Inner", Vector3.new(2.4, 3.2, 0.14), CFrame.new(0, poleH + 1.8, 0), Color3.fromRGB(245, 245, 248), Enum.Material.SmoothPlastic, false, true)

    elseif signType == "road_arrows" then
        -- -------------------------------------------------------------
        -- FLECHAS DE DIRECCIÓN TERMOPLÁSTICAS EN EL ASFALTO
        -- -------------------------------------------------------------
        local arrowColor = Color3.fromRGB(245, 248, 252)
        local arrowMat = Enum.Material.SmoothPlastic
        -- Vástago central de la flecha
        makePart("Arrow_Stem", Vector3.new(1.0, 0.05, 7.0), CFrame.new(0, 0.03, 0), arrowColor, arrowMat, false, true)
        -- Punta de flecha en cuña
        makeWedge("Arrow_Head_L", Vector3.new(2.2, 0.05, 2.2), CFrame.new(-1.1, 0.03, 4.5) * CFrame.Angles(0, math.rad(-90), 0), arrowColor, arrowMat)
        makeWedge("Arrow_Head_R", Vector3.new(2.2, 0.05, 2.2), CFrame.new(1.1, 0.03, 4.5) * CFrame.Angles(0, math.rad(90), 0), arrowColor, arrowMat)
    end

    print(string.format("[TrafficSignage] ✅ Señalización '%s' generada en '%s'.", "${type}", "${parent}"))
end

buildTrafficSignage()
`;
}
