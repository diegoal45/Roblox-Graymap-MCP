import { snapVal } from "./grid.js";

/**
 * Generador de Puente Vehicular y Peatonal sobre Canal Urbano (Canal Bridge - Estilo Schedule 1 / Hyland Point / LA River).
 * Conecta distritos urbanos sobre el canal de drenaje o masas de agua:
 * - Tablero de calzada de asfalto continuo al mismo nivel de las avenidas (roadSurfaceY = 0.3)
 * - Aceras peatonales laterales elevadas con bordillos de granito (Y = 1.1)
 * - Pilares macizos de hormigón armado (Piers) anclados en el lecho del canal (Y = -canalDepth)
 * - Estribos extremos de hormigón (Abutments) integrados con los taludes del canal
 * - Vigas longitudinales de soporte (Steel/Concrete Girders) bajo el tablero
 * - Quitamiedos y barandillas de seguridad de alta resistencia
 * - Farolas de puente de doble luminaria
 */

export function generateBridgeLuau({
  name = "Canal_Main_Bridge",
  startPoint = [50, 0, -35],
  endPoint = [50, 0, 35],
  roadWidth = 36,
  sidewalkWidth = 6,
  canalDepth = 16,
  pierCount = 2,
  hasRailings = true,
  hasLamps = true,
  parent = "City/Infrastructure",
}) {
  const [x1, y1, z1] = startPoint;
  const [x2, y2, z2] = endPoint;

  return `
local CollectionService = game:GetService("CollectionService")

local function buildCanalBridge()
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
    local spanLength = delta.Magnitude
    if spanLength < 2 then return end

    local midPoint = (p1 + p2) / 2
    local bridgeCF = CFrame.lookAt(midPoint, p2)
    local rW = ${roadWidth}
    local sW = ${sidewalkWidth}
    local totalW = rW + sW * 2
    local cDepth = ${canalDepth}
    local roadSurfaceY = 0.3

    local colAsphalt = Color3.fromRGB(38, 40, 44)
    local colConcreteDeck = Color3.fromRGB(150, 153, 158)
    local colConcretePier = Color3.fromRGB(120, 124, 130)
    local colGirder = Color3.fromRGB(60, 65, 72)
    local colSidewalk = Color3.fromRGB(195, 198, 204)
    local colCurb = Color3.fromRGB(150, 155, 162)
    local colRailing = Color3.fromRGB(180, 184, 190)
    local colYellowStripe = Color3.fromRGB(240, 200, 45)
    local colWhiteStripe = Color3.fromRGB(245, 248, 252)

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
        p.CFrame = bridgeCF * relCF
        p.Color = col
        p.Material = mat or Enum.Material.Concrete
        return p
    end

    local function makeCyl(pName, sz, relCF, col, mat)
        local p = Instance.new("Part", model)
        p.Name = pName
        p.Shape = Enum.PartType.Cylinder
        p.Anchored = true
        p.CanCollide = true
        p.CanTouch = false
        p.Size = sz
        p.CFrame = bridgeCF * relCF
        p.Color = col
        p.Material = mat or Enum.Material.Concrete
        return p
    end

    -- 1. TABLERO ESTRUCTURAL (Deck Slab)
    local deckThick = 2.4
    makePart("Bridge_Deck_Slab", Vector3.new(totalW + 0.8, deckThick, spanLength),
        CFrame.new(0, roadSurfaceY - deckThick / 2, 0), colConcreteDeck, Enum.Material.Concrete, true)

    -- Calzada de asfalto sobre el tablero
    makePart("Bridge_Asphalt_Road", Vector3.new(rW, 0.4, spanLength),
        CFrame.new(0, roadSurfaceY - 0.2, 0), colAsphalt, Enum.Material.Concrete, true)

    -- 2. VIGAS LONGITUDINALES INFERIORES DE ACERO/HORMIGÓN (Girders)
    local numGirders = 4
    local girderStep = (totalW - 4) / (numGirders - 1)
    local girderH = 3.6
    for g = 1, numGirders do
        local gx = -(totalW - 4) / 2 + (g - 1) * girderStep
        makePart("Bridge_Girder_" .. g, Vector3.new(1.4, girderH, spanLength),
            CFrame.new(gx, roadSurfaceY - deckThick - girderH / 2, 0), colGirder, Enum.Material.DiamondPlate, true)
    end

    -- 3. PILARES MONOLÍTICOS EN EL LECHO DEL CANAL (Hammerhead Bridge Piers)
    local numPiers = ${pierCount}
    for p = 1, numPiers do
        local frac = p / (numPiers + 1)
        local pierZ = -spanLength / 2 + frac * spanLength
        local pierH = cDepth + math.abs(roadSurfaceY - deckThick - girderH)
        local pierCenterY = -cDepth + pierH / 2

        -- Columna central del pilar
        makePart("Pier_Shaft_" .. p, Vector3.new(6.0, pierH, 4.0),
            CFrame.new(0, pierCenterY, pierZ), colConcretePier, Enum.Material.Concrete, true)

        -- Cabecero en T (Hammerhead Cap) que sostiene las vigas
        makePart("Pier_Cap_" .. p, Vector3.new(totalW + 1.2, 2.6, 5.0),
            CFrame.new(0, roadSurfaceY - deckThick - girderH - 1.3, pierZ), colConcretePier, Enum.Material.Concrete, true)

        -- Zapatas sumergidas en la base del canal
        makePart("Pier_Footing_" .. p, Vector3.new(10.0, 2.0, 8.0),
            CFrame.new(0, -cDepth + 1.0, pierZ), colConcretePier, Enum.Material.Concrete, true)
    end

    -- 4. ESTRIBOS DE HORMIGÓN EN CADA EXTREMO DEL PUENTE (Abutments)
    local abutW = totalW + 2.0
    local abutH = cDepth + 3.0
    makePart("Bridge_Abutment_South", Vector3.new(abutW, abutH, 4.0),
        CFrame.new(0, roadSurfaceY - abutH / 2 + 1.0, -spanLength / 2 + 2.0), colConcretePier, Enum.Material.Concrete, true)
    makePart("Bridge_Abutment_North", Vector3.new(abutW, abutH, 4.0),
        CFrame.new(0, roadSurfaceY - abutH / 2 + 1.0, spanLength / 2 - 2.0), colConcretePier, Enum.Material.Concrete, true)

    -- 5. ACERAS PEATONALES ELEVADAS Y BORDILLOS
    local curbH = 0.8
    local swCenterY = roadSurfaceY + curbH / 2
    local leftSW_X = - (rW / 2) - (sW / 2)
    local rightSW_X = (rW / 2) + (sW / 2)

    makePart("Sidewalk_Left", Vector3.new(sW, curbH, spanLength),
        CFrame.new(leftSW_X, swCenterY, 0), colSidewalk, Enum.Material.Concrete, true)
    makePart("Sidewalk_Right", Vector3.new(sW, curbH, spanLength),
        CFrame.new(rightSW_X, swCenterY, 0), colSidewalk, Enum.Material.Concrete, true)

    -- Bordillos de granito
    local curbW = 0.8
    makePart("Curb_Left", Vector3.new(curbW, curbH + 0.1, spanLength),
        CFrame.new(-rW / 2 - curbW / 2, swCenterY, 0), colCurb, Enum.Material.Granite, true)
    makePart("Curb_Right", Vector3.new(curbW, curbH + 0.1, spanLength),
        CFrame.new(rW / 2 + curbW / 2, swCenterY, 0), colCurb, Enum.Material.Granite, true)

    -- 6. PINTURA VIAL (+0.04 studs de relieve sin z-fighting)
    local stripeY = roadSurfaceY + 0.04
    local stripeLength = 7
    local stripeGap = 6
    local cycle = stripeLength + stripeGap
    local numStripes = math.floor(spanLength / cycle)

    -- Doble línea central amarilla
    for i = 1, numStripes do
        local sz = -spanLength / 2 + (i - 0.5) * cycle
        makePart("Center_Stripe_L_" .. i, Vector3.new(0.4, 0.08, stripeLength),
            CFrame.new(-0.4, stripeY, sz), colYellowStripe, Enum.Material.SmoothPlastic, false, true)
        makePart("Center_Stripe_R_" .. i, Vector3.new(0.4, 0.08, stripeLength),
            CFrame.new(0.4, stripeY, sz), colYellowStripe, Enum.Material.SmoothPlastic, false, true)
    end

    -- Líneas blancas laterales continuas
    local edgeX = rW / 2 - 1.2
    makePart("Edge_Stripe_Left", Vector3.new(0.6, 0.08, spanLength),
        CFrame.new(-edgeX, stripeY, 0), colWhiteStripe, Enum.Material.SmoothPlastic, false, true)
    makePart("Edge_Stripe_Right", Vector3.new(0.6, 0.08, spanLength),
        CFrame.new(edgeX, stripeY, 0), colWhiteStripe, Enum.Material.SmoothPlastic, false, true)

    -- 7. BARANDILLAS DE SEGURIDAD (Balustrades & Steel Guardrails)
    ${hasRailings ? `
    local railH = 3.6
    local postSpacing = 8.0
    local numPosts = math.floor(spanLength / postSpacing)

    for _, sideX in ipairs({-totalW / 2 + 0.3, totalW / 2 - 0.3}) do
        -- Antepecho inferior de hormigón
        makePart("Bridge_Parapet_Base", Vector3.new(0.8, 1.2, spanLength),
            CFrame.new(sideX, swCenterY + curbH / 2 + 0.6, 0), colConcreteDeck, Enum.Material.Concrete, true)

        -- Pasamanos superior de acero
        makePart("Bridge_Handrail_Top", Vector3.new(0.5, 0.4, spanLength),
            CFrame.new(sideX, swCenterY + curbH / 2 + railH, 0), colRailing, Enum.Material.Metal, true)

        -- Postes verticales de barandilla
        for p = 0, numPosts do
            local pz = -spanLength / 2 + p * postSpacing
            if math.abs(pz) <= spanLength / 2 - 1 then
                makePart("Bridge_Rail_Post", Vector3.new(0.6, railH, 0.6),
                    CFrame.new(sideX, swCenterY + curbH / 2 + railH / 2, pz), colRailing, Enum.Material.Metal, true)
            end
        end
    end
    ` : ""}

    -- 8. FAROLAS URBANAS DEL PUENTE
    ${hasLamps ? `
    local lampZPositions = {-spanLength * 0.35, 0, spanLength * 0.35}
    for li, lz in ipairs(lampZPositions) do
        for _, sideX in ipairs({-totalW / 2 + 1.2, totalW / 2 - 1.2}) do
            local baseLampCF = CFrame.new(sideX, swCenterY + curbH / 2 + 0.8, lz)
            -- Poste
            makePart("Bridge_Lamp_Post_" .. li, Vector3.new(0.8, 18, 0.8),
                baseLampCF * CFrame.new(0, 9, 0), Color3.fromRGB(48, 52, 58), Enum.Material.Metal, true)
            -- Brazo y luminaria hacia la calzada
            local armDir = sideX > 0 and -1 or 1
            makePart("Bridge_Lamp_Arm_" .. li, Vector3.new(4.0, 0.4, 0.4),
                baseLampCF * CFrame.new(armDir * 2.0, 18, 0), Color3.fromRGB(48, 52, 58), Enum.Material.Metal, false, true)
            local head = makePart("Bridge_Lamp_Head_" .. li, Vector3.new(1.6, 0.6, 1.0),
                baseLampCF * CFrame.new(armDir * 3.8, 17.7, 0), Color3.fromRGB(255, 245, 220), Enum.Material.Neon, false, true)
            local light = Instance.new("PointLight", head)
            light.Color = Color3.fromRGB(255, 235, 195)
            light.Range = 36
            light.Brightness = 2.2
            light.Shadows = true
        end
    end
    ` : ""}

    CollectionService:AddTag(model, "Infrastructure")
    CollectionService:AddTag(model, "Bridge")
    print(string.format("[BridgeEngine] ✅ Puente vehicular '%s' (Span: %.1f studs, Ancho: %d studs) construido en '%s'.", "${name}", spanLength, totalW, "${parent}"))
end

buildCanalBridge()
`;
}
