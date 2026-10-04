import { snapVal } from "./grid.js";

/**
 * Generador de Canal de Drenaje Pluvial Urbano (Storm Drainage Canal - Estilo Los Angeles / Schedule 1).
 * Elemento icónico en Schedule 1 para persecuciones de coches a gran velocidad, rutas de huida a pie,
 * escondites clandestinos, conductos de alcantarillado transitables y límites divisorios de distritos.
 * 
 * Incluye:
 * - Lecho trapezoidal de hormigón reforzado con taludes inclinados (Wedges precisos)
 * - Canaleta central rebajada para flujo de agua con lámina de agua turbia/industrial
 * - Tuberías de desagüe de hormigón gigantes (culverts) con barrotes metálicos
 * - Escaleras de gato metálicas amarillas de mantenimiento integradas en los taludes
 * - Barandillas/quitamiedos de seguridad a nivel de calle
 * - Pasarela peatonal / puente de tuberías industriales para cruce de peatones
 * - Opciones modulares: longitud, anchura, profundidad, puentes y agua
 */

export function generateStormCanalLuau({
  name = "Storm_Drain_Canal",
  position = [0, 0, 0],
  length = 160,
  width = 56,
  depth = 16,
  rotationY = 0,
  includeWater = true,
  includePipeBridge = true,
  includeCulvertPipes = true,
  includeGuardrails = true,
  parent = "City/Infrastructure",
}) {
  const [posX, posY, posZ] = [snapVal(position[0], 4), snapVal(position[1], 4), snapVal(position[2], 4)];
  const canalL = Math.max(40, snapVal(length, 8));
  const canalW = Math.max(32, snapVal(width, 4));
  const canalD = Math.max(8, snapVal(depth, 2));
  const rotY = typeof rotationY === "number" ? rotationY : 0;

  // Parámetros geométricos del canal trapezoidal
  const floorW = Math.max(16, canalW * 0.45); // Ancho de la solera inferior plana
  const slopeW = (canalW - floorW) / 2; // Anchura horizontal de cada talud inclinado
  const troughW = 8.0; // Anchura de la regata o canaleta central
  const troughD = 1.6; // Profundidad de la regata central

  return `
local CollectionService = game:GetService("CollectionService")

local function buildStormDrainCanal()
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

    local originCF = CFrame.new(${posX}, ${posY}, ${posZ}) * CFrame.Angles(0, math.rad(${rotY}), 0)
    local canalL = ${canalL}
    local canalW = ${canalW}
    local canalD = ${canalD}
    local floorW = ${floorW}
    local slopeW = ${slopeW}
    local troughW = ${troughW}
    local troughD = ${troughD}

    local colConcreteMain = Color3.fromRGB(160, 163, 168)
    local colConcreteDark = Color3.fromRGB(130, 134, 138)
    local colConcreteStained = Color3.fromRGB(115, 118, 120)
    local colWater = Color3.fromRGB(45, 95, 90)
    local colRustMetal = Color3.fromRGB(75, 68, 62)
    local colSafetyYellow = Color3.fromRGB(220, 175, 30)

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
        p.CFrame = originCF * relCF
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
        w.TopSurface = Enum.SurfaceType.Smooth
        w.BottomSurface = Enum.SurfaceType.Smooth
        w.Size = sz
        w.CFrame = originCF * relCF
        w.Color = col
        w.Material = mat or Enum.Material.Concrete
        return w
    end

    local function makeCylinder(pName, sz, relCF, col, mat)
        local c = Instance.new("Part", model)
        c.Shape = Enum.PartType.Cylinder
        c.Name = pName
        c.Anchored = true
        c.CanCollide = true
        c.CanTouch = false
        c.TopSurface = Enum.SurfaceType.Smooth
        c.BottomSurface = Enum.SurfaceType.Smooth
        c.Size = sz
        c.CFrame = originCF * relCF
        c.Color = col
        c.Material = mat or Enum.Material.Concrete
        return c
    end

    -- 1. SOLERA DE HORMIGÓN INFERIOR (LECHO DEL CANAL)
    -- Lado izquierdo y derecho de la canaleta central
    local sideFloorW = (floorW - troughW) / 2
    local floorThick = 2.0

    -- Solera lado izquierdo (-X)
    makePart("Canal_Floor_Left", Vector3.new(sideFloorW, floorThick, canalL),
        CFrame.new(-(troughW / 2 + sideFloorW / 2), -floorThick / 2, 0),
        colConcreteDark, Enum.Material.Concrete, true)

    -- Solera lado derecho (+X)
    makePart("Canal_Floor_Right", Vector3.new(sideFloorW, floorThick, canalL),
        CFrame.new(troughW / 2 + sideFloorW / 2, -floorThick / 2, 0),
        colConcreteDark, Enum.Material.Concrete, true)

    -- Base inferior de la canaleta central
    makePart("Canal_Trough_Bed", Vector3.new(troughW, floorThick, canalL),
        CFrame.new(0, -troughD - floorThick / 2, 0),
        colConcreteStained, Enum.Material.Slate, true)

    -- Muros laterales de la canaleta central
    makePart("Trough_Wall_Left", Vector3.new(0.6, troughD, canalL),
        CFrame.new(-troughW / 2 + 0.3, -troughD / 2, 0),
        colConcreteStained, Enum.Material.Concrete, true)
    makePart("Trough_Wall_Right", Vector3.new(0.6, troughD, canalL),
        CFrame.new(troughW / 2 - 0.3, -troughD / 2, 0),
        colConcreteStained, Enum.Material.Concrete, true)

    -- 2. LÁMINA DE AGUA REBAJADA EN LA CANALETA
    ${includeWater ? `
    local waterP = makePart("Canal_Water", Vector3.new(troughW - 0.8, 0.4, canalL),
        CFrame.new(0, -troughD * 0.4, 0),
        colWater, Enum.Material.Water, false)
    waterP.Transparency = 0.4
    waterP.CanCollide = false
    CollectionService:AddTag(waterP, "WaterVolume")
    ` : ""}

    -- 3. TALUDES INCLINADOS DE HORMIGÓN (TALUD IZQUIERDO Y DERECHO)
    -- En Roblox, WedgePart por defecto: base X, altura Y, fondo Z (con pendiente hacia +Z)
    -- Talud Izquierdo (-X): debe descender hacia +X (hacia el centro del canal).
    -- Rotar en Y por -90 deg: local +Z se alinea con mundo +X.
    -- Size del wedge: X = canalL (a lo largo del canal), Y = canalD (altura vertical), Z = slopeW (anchura horizontal).
    local leftSlopeCenterX = -(floorW / 2 + slopeW / 2)
    local leftSlopeCenterY = canalD / 2
    local leftWedgeCF = CFrame.new(leftSlopeCenterX, leftSlopeCenterY, 0) * CFrame.Angles(0, math.rad(-90), 0)
    makeWedge("Canal_Bank_Left", Vector3.new(canalL, canalD, slopeW), leftWedgeCF, colConcreteMain, Enum.Material.Concrete)

    -- Talud Derecho (+X): debe descender hacia -X (hacia el centro del canal).
    -- Rotar en Y por +90 deg: local +Z se alinea con mundo -X.
    local rightSlopeCenterX = floorW / 2 + slopeW / 2
    local rightSlopeCenterY = canalD / 2
    local rightWedgeCF = CFrame.new(rightSlopeCenterX, rightSlopeCenterY, 0) * CFrame.Angles(0, math.rad(90), 0)
    makeWedge("Canal_Bank_Right", Vector3.new(canalL, canalD, slopeW), rightWedgeCF, colConcreteMain, Enum.Material.Concrete)

    -- 4. LABIOS Y CALZADAS SUPERIORES A NIVEL DE CALLE (TOP CURBS)
    local curbW = 4.0
    local curbH = 1.0
    makePart("Canal_Lip_Left", Vector3.new(curbW, curbH, canalL),
        CFrame.new(-(canalW / 2 + curbW / 2), canalD + curbH / 2, 0),
        colConcreteDark, Enum.Material.Concrete, true)

    makePart("Canal_Lip_Right", Vector3.new(curbW, curbH, canalL),
        CFrame.new(canalW / 2 + curbW / 2, canalD + curbH / 2, 0),
        colConcreteDark, Enum.Material.Concrete, true)

    -- 5. QUITAMIEDOS / GUARDRAILS A NIVEL SUPERIOR
    ${includeGuardrails ? `
    local guardPostSpacing = 16.0
    local numPosts = math.floor(canalL / guardPostSpacing)
    local startPostZ = -canalL / 2 + guardPostSpacing / 2

    for side = -1, 1, 2 do
        local railX = side * (canalW / 2 + 1.2)
        -- Railing horizontal superior continuo
        makePart("Guardrail_Beam_" .. (side == -1 and "L" or "R"),
            Vector3.new(0.4, 0.8, canalL),
            CFrame.new(railX, canalD + curbH + 1.8, 0),
            Color3.fromRGB(180, 185, 192), Enum.Material.Metal, true)

        -- Postes verticales
        for i = 0, numPosts do
            local pZ = startPostZ + i * guardPostSpacing
            if pZ <= canalL / 2 - 2 then
                makePart("Guardrail_Post_" .. (side == -1 and "L" or "R") .. "_" .. i,
                    Vector3.new(0.6, 2.2, 0.6),
                    CFrame.new(railX, canalD + curbH + 1.1, pZ),
                    Color3.fromRGB(130, 135, 140), Enum.Material.Metal, true)
            end
        end
    end
    ` : ""}

    -- 6. TUBERÍAS DE DESAGÜE / ALCANTARILLADO (CULVERTS)
    ${includeCulvertPipes ? `
    local pipeRadius = 4.0
    local pipeZPositions = {-canalL * 0.35, 0, canalL * 0.35}

    for idx, pz in ipairs(pipeZPositions) do
        -- Tubería en pared izquierda
        local culvertL_CF = CFrame.new(-canalW / 2 + 0.8, canalD * 0.3, pz) * CFrame.Angles(0, 0, math.rad(90))
        local pipeOuterL = makeCylinder("Culvert_Ring_L_" .. idx, Vector3.new(2.4, pipeRadius * 2, pipeRadius * 2), culvertL_CF, colConcreteStained, Enum.Material.Concrete)
        local pipeInnerL = makeCylinder("Culvert_Void_L_" .. idx, Vector3.new(2.6, pipeRadius * 1.6, pipeRadius * 1.6), culvertL_CF, Color3.fromRGB(15, 15, 18), Enum.Material.SmoothPlastic)
        pipeInnerL.CanCollide = false

        -- Barrotes protectores de la tubería izquierda
        for b = -1, 1 do
            makePart("Culvert_Bar_L_" .. idx .. "_" .. b, Vector3.new(0.2, pipeRadius * 1.5, 0.2),
                CFrame.new(-canalW / 2 + 1.8, canalD * 0.3, pz + b * 1.1),
                colRustMetal, Enum.Material.Metal, true)
        end

        -- Tubería en pared derecha
        local culvertR_CF = CFrame.new(canalW / 2 - 0.8, canalD * 0.3, pz) * CFrame.Angles(0, 0, math.rad(90))
        local pipeOuterR = makeCylinder("Culvert_Ring_R_" .. idx, Vector3.new(2.4, pipeRadius * 2, pipeRadius * 2), culvertR_CF, colConcreteStained, Enum.Material.Concrete)
        local pipeInnerR = makeCylinder("Culvert_Void_R_" .. idx, Vector3.new(2.6, pipeRadius * 1.6, pipeRadius * 1.6), culvertR_CF, Color3.fromRGB(15, 15, 18), Enum.Material.SmoothPlastic)
        pipeInnerR.CanCollide = false

        -- Barrotes protectores de la tubería derecha
        for b = -1, 1 do
            makePart("Culvert_Bar_R_" .. idx .. "_" .. b, Vector3.new(0.2, pipeRadius * 1.5, 0.2),
                CFrame.new(canalW / 2 - 1.8, canalD * 0.3, pz + b * 1.1),
                colRustMetal, Enum.Material.Metal, true)
        end
    end
    ` : ""}

    -- 7. ESCALERAS DE MANTENIMIENTO EN LOS TALUDES
    local ladderZPositions = {-canalL * 0.2, canalL * 0.2}
    for lIdx, lz in ipairs(ladderZPositions) do
        local side = (lIdx % 2 == 1) and -1 or 1
        local numRungs = 8
        for r = 1, numRungs do
            local frac = r / (numRungs + 1)
            local rungY = frac * canalD
            local rungDist = frac * slopeW
            local rungX = side * (floorW / 2 + rungDist)
            makePart("Canal_Ladder_Rung_" .. lIdx .. "_" .. r,
                Vector3.new(1.8, 0.2, 0.2),
                CFrame.new(rungX, rungY, lz),
                colSafetyYellow, Enum.Material.Metal, false)
        end
        -- Postes guía de la escalera
        for offsetZ = -0.9, 0.9, 1.8 do
            local beamLen = math.sqrt(slopeW^2 + canalD^2)
            local angleBank = math.atan2(canalD, slopeW) * (side == -1 and 1 or -1)
            -- Barra pasamanos inclinada
            makePart("Canal_Ladder_Rail_" .. lIdx,
                Vector3.new(0.2, 0.2, 0.2),
                CFrame.new(side * (floorW / 2 + slopeW / 2), canalD / 2 + 0.3, lz + offsetZ),
                colSafetyYellow, Enum.Material.Metal, false)
        end
    end

    -- 8. PUENTE DE TUBERÍAS Y PASARELA INDUSTRIAL PEATONAL
    ${includePipeBridge ? `
    local bridgeZ = 0
    local bridgeSpan = canalW + 10.0
    local bridgeH = canalD + 3.0

    -- Grandes tuberías gemelas industriales
    local pipeDiam = 2.4
    local p1 = makeCylinder("Industry_Pipe_1", Vector3.new(bridgeSpan, pipeDiam, pipeDiam),
        CFrame.new(0, bridgeH, bridgeZ - 2.2) * CFrame.Angles(0, 0, math.rad(90)),
        Color3.fromRGB(50, 95, 140), Enum.Material.Metal)

    local p2 = makeCylinder("Industry_Pipe_2", Vector3.new(bridgeSpan, pipeDiam, pipeDiam),
        CFrame.new(0, bridgeH, bridgeZ + 2.2) * CFrame.Angles(0, 0, math.rad(90)),
        Color3.fromRGB(140, 60, 50), Enum.Material.Metal)

    -- Pasarela peatonal metálica transitable por encima
    local catwalkW = 3.6
    local catwalkWalkway = makePart("Catwalk_Deck", Vector3.new(bridgeSpan, 0.4, catwalkW),
        CFrame.new(0, bridgeH + 1.4, bridgeZ),
        Color3.fromRGB(80, 85, 90), Enum.Material.DiamondPlate, true)

    -- Barandillas de la pasarela
    for offsetZ = -catwalkW / 2, catwalkW / 2, catwalkW do
        makePart("Catwalk_Rail", Vector3.new(bridgeSpan, 0.2, 0.2),
            CFrame.new(0, bridgeH + 1.4 + 2.4, bridgeZ + offsetZ),
            Color3.fromRGB(180, 185, 190), Enum.Material.Metal, true)

        -- Postes de barandilla a intervalos
        for px = -bridgeSpan / 2 + 4, bridgeSpan / 2 - 4, 12 do
            makePart("Catwalk_Post", Vector3.new(0.2, 2.4, 0.2),
                CFrame.new(px, bridgeH + 1.4 + 1.2, bridgeZ + offsetZ),
                Color3.fromRGB(130, 135, 140), Enum.Material.Metal, false)
        end
    end

    -- Pilas de apoyo de hormigón a cada orilla
    makePart("Bridge_Pier_L", Vector3.new(3.0, canalD + 4.0, 6.0),
        CFrame.new(-(canalW / 2 + 2.0), (canalD + 4.0) / 2, bridgeZ),
        colConcreteDark, Enum.Material.Concrete, true)

    makePart("Bridge_Pier_R", Vector3.new(3.0, canalD + 4.0, 6.0),
        CFrame.new(canalW / 2 + 2.0, (canalD + 4.0) / 2, bridgeZ),
        colConcreteDark, Enum.Material.Concrete, true)
    ` : ""}

    CollectionService:AddTag(model, "Infrastructure")
    CollectionService:AddTag(model, "StormCanal")
    model:SetAttribute("CanalLength", canalL)
    model:SetAttribute("CanalWidth", canalW)
    model:SetAttribute("CanalDepth", canalD)

    return model
end

buildStormDrainCanal()
`;
}
