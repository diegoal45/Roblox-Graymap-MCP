import { snapVal } from "./grid.js";

/**
 * Generador de Autopistas Elevadas, Pasos a Desnivel y Rampas Estilo GTA San Andreas.
 * Construye:
 * - Autopista elevada de 36 studs de ancho (4 carriles) suspendida a 22 studs de altura
 * - Pilares macizos de hormigón armado en T (hammerhead piers) a intervalos regulares
 * - Quitamiedos laterales (guardrails / barreras New Jersey) de hormigón
 * - Señales de pórtico aéreo verde interestatal ("LOS SANTOS / DOWNTOWN / AIRPORT")
 * - Rampas de incorporación y salida (On/Off Ramps) conectadas a nivel de suelo
 */

export function generateElevatedHighwayLuau({
  name = "Elevated_Freeway",
  startPoint = [0, 22, -150],
  endPoint = [0, 22, 150],
  roadWidth = 36,
  elevation = 22,
  includePiers = true,
  includeGantrySign = true,
  includeRamp = false,
  rampSide = "Right", // "Right" o "Left"
  parent = "City/Highways",
}) {
  const [x1, y1, z1] = startPoint;
  const [x2, y2, z2] = endPoint;

  return `
local CollectionService = game:GetService("CollectionService")

local function buildElevatedFreeway()
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
    if length < 2 then return end

    local midPoint = (p1 + p2) / 2
    local hwayCF = CFrame.lookAt(midPoint, p2)
    local rW = ${roadWidth}
    local elev = ${elevation}

    local function makePart(pName, sz, relCF, col, mat, canCol, isDecor)
        local p = Instance.new("Part", model)
        p.Name = pName
        p.Anchored = true
        p.CanCollide = canCol ~= nil and canCol or true
        p.CanTouch = false
        if isDecor then p.CanQuery = false end
        p.TopSurface = Enum.SurfaceType.Smooth
        p.BottomSurface = Enum.SurfaceType.Smooth
        p.Size = sz
        p.CFrame = hwayCF * relCF
        p.Color = col
        p.Material = mat or Enum.Material.Concrete
        return p
    end

    local function makeWedge(pName, sz, relCF, col, mat)
        local w = Instance.new("WedgePart", model)
        w.Name = pName
        w.Anchored = true
        w.CanCollide = true
        w.CanTouch = false
        w.Size = sz
        w.CFrame = hwayCF * relCF
        w.Color = col
        w.Material = mat or Enum.Material.Concrete
        return w
    end

    -- 1. TABLERO DE LA AUTOPISTA (Deck slab de hormigón pretensado con asfalto)
    local deckThick = 2.4
    makePart("Highway_Asphalt_Deck", Vector3.new(rW, deckThick, length), CFrame.new(0, 0, 0), Color3.fromRGB(36, 38, 42), Enum.Material.Concrete, true)

    -- Viga cajón inferior de hormigón
    makePart("Girder_Underbelly", Vector3.new(rW - 4, 3.2, length), CFrame.new(0, -deckThick / 2 - 1.6, 0), Color3.fromRGB(135, 140, 148), Enum.Material.Concrete, true)

    -- 2. BARRERAS LATERALES QUITAMIEDOS DE HORMIGÓN (Jersey Barriers)
    local bH = 3.4
    local bThick = 1.0
    makePart("Barrier_Left", Vector3.new(bThick, bH, length), CFrame.new(-rW / 2 + bThick / 2, bH / 2, 0), Color3.fromRGB(180, 185, 192), Enum.Material.Concrete, true)
    makePart("Barrier_Right", Vector3.new(bThick, bH, length), CFrame.new(rW / 2 - bThick / 2, bH / 2, 0), Color3.fromRGB(180, 185, 192), Enum.Material.Concrete, true)

    -- Mediana central divisoria de carriles con barrera doble
    makePart("Central_Median_Barrier", Vector3.new(1.2, 2.8, length), CFrame.new(0, 1.4, 0), Color3.fromRGB(170, 175, 182), Enum.Material.Concrete, true)

    -- 3. SEÑALIZACIÓN HORIZONTAL DE AUTOPISTA (Líneas blancas discontinuas de carril)
    local dashLen = 8
    local dashGap = 8
    local totalCycles = math.floor(length / (dashLen + dashGap))

    for lane = 1, 2 do
        local laneOffsetL = -rW / 4
        local laneOffsetR = rW / 4
        for i = 1, totalCycles do
            local zOff = (-length / 2) + (i - 0.5) * (dashLen + dashGap)
            makePart("Lane_Dash_L_" .. i, Vector3.new(0.6, 0.06, dashLen), CFrame.new(laneOffsetL, deckThick / 2 + 0.03, zOff), Color3.fromRGB(245, 245, 250), Enum.Material.SmoothPlastic, false, true)
            makePart("Lane_Dash_R_" .. i, Vector3.new(0.6, 0.06, dashLen), CFrame.new(laneOffsetR, deckThick / 2 + 0.03, zOff), Color3.fromRGB(245, 245, 250), Enum.Material.SmoothPlastic, false, true)
        end
    end

    -- Líneas amarillas continuas junto a la mediana central
    makePart("Median_Line_L", Vector3.new(0.5, 0.05, length), CFrame.new(-1.2, deckThick / 2 + 0.025, 0), Color3.fromRGB(240, 195, 45), Enum.Material.SmoothPlastic, false, true)
    makePart("Median_Line_R", Vector3.new(0.5, 0.05, length), CFrame.new(1.2, deckThick / 2 + 0.025, 0), Color3.fromRGB(240, 195, 45), Enum.Material.SmoothPlastic, false, true)

    ${
      includePiers
        ? `
    -- 4. PILARES MONUMENTALES EN T (Hammerhead Concrete Piers) HASTA EL SUELO
    local pierSpacing = 60
    local numPiers = math.max(1, math.floor(length / pierSpacing))

    for p = 1, numPiers do
        local pZ = (-length / 2) + (p - 0.5) * (length / numPiers)
        -- Columna vertical central
        local colH = elev - deckThick
        makePart("Pier_Col_" .. p, Vector3.new(6.0, colH, 6.0), CFrame.new(0, -deckThick / 2 - colH / 2, pZ), Color3.fromRGB(145, 148, 155), Enum.Material.Concrete, true)
        -- Cabeza de martillo en T ensanchada bajo el tablero
        makePart("Pier_Hammerhead_" .. p, Vector3.new(rW - 2, 4.0, 8.0), CFrame.new(0, -deckThick / 2 - 2.0, pZ), Color3.fromRGB(155, 158, 165), Enum.Material.Concrete, true)
        -- Cimiento sólido en el suelo
        makePart("Pier_Footing_" .. p, Vector3.new(12, 2.5, 12), CFrame.new(0, -elev + 1.25, pZ), Color3.fromRGB(120, 122, 128), Enum.Material.Concrete, true)
    end
    `
        : ""
    }

    ${
      includeGantrySign
        ? `
    -- 5. PÓRTICO AÉREO CON SEÑALES VERDES DE AUTOPISTA TIPO ESTADOUNIDENSE
    local gantryZ = -length * 0.2
    local gantryH = 14
    -- Postes laterales de celosía
    makePart("Gantry_Leg_L", Vector3.new(1.2, gantryH, 1.2), CFrame.new(-rW / 2 + 0.6, gantryH / 2, gantryZ), Color3.fromRGB(60, 65, 72), Enum.Material.Metal, true)
    makePart("Gantry_Leg_R", Vector3.new(1.2, gantryH, 1.2), CFrame.new(rW / 2 - 0.6, gantryH / 2, gantryZ), Color3.fromRGB(60, 65, 72), Enum.Material.Metal, true)
    -- Viga horizontal superior
    makePart("Gantry_Beam", Vector3.new(rW, 1.4, 1.4), CFrame.new(0, gantryH - 0.7, gantryZ), Color3.fromRGB(60, 65, 72), Enum.Material.Metal, true)

    -- Cartel Verde 1: "LOS SANTOS / DOWNTOWN"
    local sign1 = makePart("Sign_Downtown", Vector3.new(14, 6.0, 0.4), CFrame.new(-rW / 4, gantryH - 3.5, gantryZ + 0.8), Color3.fromRGB(25, 95, 45), Enum.Material.SmoothPlastic, false, true)
    local sign1Border = makePart("Sign_Border_1", Vector3.new(14.2, 6.2, 0.2), CFrame.new(-rW / 4, gantryH - 3.5, gantryZ + 0.6), Color3.fromRGB(245, 245, 250), Enum.Material.SmoothPlastic, false, true)
    -- Foco que ilumina el cartel
    local spot1 = makePart("Sign_Spot_1", Vector3.new(0.6, 0.6, 1.0), CFrame.new(-rW / 4, gantryH - 0.2, gantryZ + 1.8), Color3.fromRGB(255, 245, 210), Enum.Material.Neon, false, true)
    local spL1 = Instance.new("PointLight", spot1)
    spL1.Color = Color3.fromRGB(255, 240, 200)
    spL1.Range = 16
    spL1.Brightness = 1.2

    -- Cartel Verde 2: "AIRPORT / SAN ANDREAS"
    local sign2 = makePart("Sign_Airport", Vector3.new(14, 6.0, 0.4), CFrame.new(rW / 4, gantryH - 3.5, gantryZ + 0.8), Color3.fromRGB(25, 95, 45), Enum.Material.SmoothPlastic, false, true)
    local sign2Border = makePart("Sign_Border_2", Vector3.new(14.2, 6.2, 0.2), CFrame.new(rW / 4, gantryH - 3.5, gantryZ + 0.6), Color3.fromRGB(245, 245, 250), Enum.Material.SmoothPlastic, false, true)
    `
        : ""
    }

    ${
      includeRamp
        ? `
    -- 6. RAMPA DE INCORPORACIÓN / SALIDA DE AUTOPISTA (On/Off Ramp)
    local rampLen = 80
    local rampW = 16
    local rampSideDir = "${rampSide}" == "Left" and -1 or 1
    local rampStartX = rampSideDir * (rW / 2 + rampW / 2)

    -- Cuña descendente de calzada
    local rampWedgeCF = CFrame.new(rampStartX, -elev / 2, length / 4) * (rampSideDir == 1 and CFrame.Angles(0, math.rad(180), 0) or CFrame.Angles(0, 0, 0))
    makeWedge("Freeway_Exit_Ramp", Vector3.new(rampW, elev, rampLen), rampWedgeCF, Color3.fromRGB(38, 40, 44), Enum.Material.Concrete)
    `
        : ""
    }

    print(string.format("[HighwayEngine GTA-AAA] ✅ Autopista elevada '%s' (longitud %.1f studs, ancho %d studs) generada con éxito en '%s'.", "${name}", length, rW, "${parent}"))
end

buildElevatedFreeway()
`;
}
