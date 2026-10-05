import { snapVal } from "./grid.js";
import { URBAN_METRICS } from "./urbanMetrics.js";

/**
 * Motor de Redes Viales Avanzadas: Carreteras Curvas Bézier 3D, Rampas/Cuestas,
 * Rotondas, Cruces Semafóricos y Cul-de-Sacs Circulares (Estilo Grove St).
 */

export function generateCurvedRoadLuau({
  name = "Curved_Avenue",
  waypoints = [
    [-150, 0, -150],
    [0, 15, 0],
    [150, 30, 150],
  ],
  roadWidth = 28,
  sidewalkWidth = 8,
  hasSidewalks = true,
  hasLamps = true,
  hasGuardrails = false,
  hasRetainingWall = true,
  baseElevation = -2,
  segments = 32,
  parent = "City/Roads",
}) {
  const pointsJson = JSON.stringify(waypoints);
  const numSegs = Math.max(12, Math.min(96, Math.floor(segments)));

  return `
local CollectionService = game:GetService("CollectionService")

local function buildCurvedRoad()
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

    local rawPoints = game:GetService("HttpService"):JSONDecode([==[${pointsJson}]==])
    local rW = ${roadWidth}
    local sW = ${sidewalkWidth}
    local hasSw = ${hasSidewalks ? "true" : "false"}
    local hasLamps = ${hasLamps ? "true" : "false"}
    local hasGuardrails = ${hasGuardrails ? "true" : "false"}
    local hasRetainingWall = ${hasRetainingWall ? "true" : "false"}
    local baseElev = ${baseElevation}
    local numSegments = ${numSegs}

    local colAsphalt = Color3.fromRGB(36, 38, 42)
    local colSidewalk = Color3.fromRGB(180, 185, 192)
    local colCurb = Color3.fromRGB(135, 140, 145)
    local colStripeYellow = Color3.fromRGB(240, 200, 45)
    local colGuardrail = Color3.fromRGB(175, 180, 188)
    local colRetain = Color3.fromRGB(105, 108, 114)

    local function makePart(pName, sz, cf, col, mat, canCol, isDecor)
        local p = Instance.new("Part", model)
        p.Name = pName
        p.Anchored = true
        p.CanCollide = canCol ~= nil and canCol or true
        p.CanTouch = false
        if isDecor then p.CanQuery = false end
        p.TopSurface = Enum.SurfaceType.Smooth
        p.BottomSurface = Enum.SurfaceType.Smooth
        p.Size = sz
        p.CFrame = cf
        p.Color = col
        p.Material = mat or Enum.Material.Concrete
        return p
    end

    -- Interpolación Bézier suave n-dimensional (puntos X, Y, Z)
    local function evaluateBezier(pts, t)
        if #pts == 3 then
            local p0 = Vector3.new(pts[1][1], pts[1][2], pts[1][3])
            local p1 = Vector3.new(pts[2][1], pts[2][2], pts[2][3])
            local p2 = Vector3.new(pts[3][1], pts[3][2], pts[3][3])
            local q0 = p0:Lerp(p1, t)
            local q1 = p1:Lerp(p2, t)
            return q0:Lerp(q1, t)
        elseif #pts == 4 then
            local p0 = Vector3.new(pts[1][1], pts[1][2], pts[1][3])
            local p1 = Vector3.new(pts[2][1], pts[2][2], pts[2][3])
            local p2 = Vector3.new(pts[3][1], pts[3][2], pts[3][3])
            local p3 = Vector3.new(pts[4][1], pts[4][2], pts[4][3])
            local q0 = p0:Lerp(p1, t)
            local q1 = p1:Lerp(p2, t)
            local q2 = p2:Lerp(p3, t)
            local r0 = q0:Lerp(q1, t)
            local r1 = q1:Lerp(q2, t)
            return r0:Lerp(r1, t)
        end
        local idx = math.clamp(math.floor(t * (#pts - 1)) + 1, 1, #pts - 1)
        local localT = (t * (#pts - 1)) - (idx - 1)
        local pA = Vector3.new(pts[idx][1], pts[idx][2], pts[idx][3])
        local pB = Vector3.new(pts[idx+1][1], pts[idx+1][2], pts[idx+1][3])
        return pA:Lerp(pB, localT)
    end

    for i = 0, numSegments - 1 do
        local t1 = i / numSegments
        local t2 = (i + 1) / numSegments

        local p1 = evaluateBezier(rawPoints, t1)
        local p2 = evaluateBezier(rawPoints, t2)
        local delta = p2 - p1
        local segLen = delta.Magnitude

        if segLen > 0.4 then
            local midP = (p1 + p2) / 2
            local roadCF = CFrame.lookAt(midP, p2)

            -- 1. Calzada de asfalto (con ligero solape longitudinal de 0.6 para cero costuras)
            makePart("RoadSeg_" .. i, Vector3.new(rW, 1.2, segLen + 0.6), roadCF * CFrame.new(0, -0.6, 0), colAsphalt, Enum.Material.Concrete)

            -- 2. Muros de contención bajo la calzada si está en pendiente o elevada
            if hasRetainingWall and midP.Y > (baseElev + 1) then
                local wallDepth = math.max(1, midP.Y - baseElev)
                local fullW = rW + (hasSw and sW * 2 or 0)
                makePart("Retaining_Wall_" .. i, Vector3.new(fullW, wallDepth, segLen + 0.6), roadCF * CFrame.new(0, -wallDepth / 2 - 0.6, 0), colRetain, Enum.Material.Concrete)
            end

            -- 3. Doble línea central amarilla
            local d1 = roadCF * CFrame.new(-0.6, 0.04, 0)
            local d2 = roadCF * CFrame.new(0.6, 0.04, 0)
            makePart("Stripe_L_" .. i, Vector3.new(0.4, 0.08, segLen + 0.5), d1, colStripeYellow, Enum.Material.SmoothPlastic, false, true)
            makePart("Stripe_R_" .. i, Vector3.new(0.4, 0.08, segLen + 0.5), d2, colStripeYellow, Enum.Material.SmoothPlastic, false, true)

            -- 4. Aceras peatonales y bordillos elevados a los lados
            if hasSw then
                local curbH = 0.65
                local curbW = 0.8
                local leftCurbX = -rW / 2 - curbW / 2
                local rightCurbX = rW / 2 + curbW / 2
                makePart("Curb_L_" .. i, Vector3.new(curbW, curbH + 0.1, segLen + 0.6), roadCF * CFrame.new(leftCurbX, curbH / 2, 0), colCurb, Enum.Material.Granite)
                makePart("Curb_R_" .. i, Vector3.new(curbW, curbH + 0.1, segLen + 0.6), roadCF * CFrame.new(rightCurbX, curbH / 2, 0), colCurb, Enum.Material.Granite)

                local leftSwX = -rW / 2 - curbW - sW / 2
                local rightSwX = rW / 2 + curbW + sW / 2
                makePart("Sw_L_" .. i, Vector3.new(sW, curbH, segLen + 0.6), roadCF * CFrame.new(leftSwX, curbH / 2, 0), colSidewalk, Enum.Material.Concrete)
                makePart("Sw_R_" .. i, Vector3.new(sW, curbH, segLen + 0.6), roadCF * CFrame.new(rightSwX, curbH / 2, 0), colSidewalk, Enum.Material.Concrete)

                -- 5. Guardarraíles / Quitamiedos metálicos exteriores si aplica
                if hasGuardrails then
                    local gOffset = rW / 2 + curbW + sW
                    makePart("Guardrail_L_" .. i, Vector3.new(0.6, 2.2, segLen + 0.6), roadCF * CFrame.new(-gOffset, curbH + 1.1, 0), colGuardrail, Enum.Material.Metal)
                    makePart("Guardrail_R_" .. i, Vector3.new(0.6, 2.2, segLen + 0.6), roadCF * CFrame.new(gOffset, curbH + 1.1, 0), colGuardrail, Enum.Material.Metal)
                end
            end

            -- 6. Farolas alternas
            if hasLamps and (i % 6 == 0) then
                local side = (i % 12 == 0) and 1 or -1
                local lampOffset = (rW / 2 + (hasSw and sW or 0) + 1.5) * side
                local poleCF = roadCF * CFrame.new(lampOffset, 0.65, 0)
                local pole = makePart("Lamp_Pole", Vector3.new(0.8, 14, 0.8), poleCF * CFrame.new(0, 7, 0), Color3.fromRGB(45, 48, 55), Enum.Material.Metal)
                local bulb = makePart("Lamp_Bulb", Vector3.new(1.2, 0.4, 1.2), poleCF * CFrame.new(0, 13.8, 0), Color3.fromRGB(255, 235, 180), Enum.Material.Neon, false)
                local pL = Instance.new("PointLight", bulb)
                pL.Color = Color3.fromRGB(255, 230, 180)
                pL.Range = 28
                pL.Brightness = 1.4
            end
        end
    end

    print("[RoadNetwork] ✅ Carretera orgánica 3D '${name}' trazada con éxito (${numSegs} segmentos).")
end

buildCurvedRoad()
`;
}

/**
 * Generador de Cul-De-Sac / Retorno Circular (Icono GTA San Andreas - Grove Street).
 * Crea una calle ciega que remata en un bulbo circular asfaltado con aceras perimetrales
 * y distribución radial de parcelas residenciales.
 */
export function generateCulDeSacLuau({
  name = "Grove_Street_CulDeSac",
  center = [0, 0, 0], // Centro del bulbo circular
  approachDirection = "South", // "North", "South", "East", "West"
  approachLength = 100,
  roadWidth = 28,
  radius = 38, // Radio del bulbo de giro
  sidewalkWidth = 8,
  hasCenterIsland = false,
  hasLamps = true,
  parent = "City/Roads",
}) {
  const [cx, cy, cz] = [snapVal(center[0], 4), snapVal(center[1], 4), snapVal(center[2], 4)];
  const rW = Math.max(20, snapVal(roadWidth, 4));
  const bulbR = Math.max(28, snapVal(radius, 2));
  const sW = Math.max(6, snapVal(sidewalkWidth, 2));
  const appLen = Math.max(40, snapVal(approachLength, 4));

  return `
local CollectionService = game:GetService("CollectionService")

local function buildCulDeSac()
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

    local cx = ${cx}
    local cy = ${cy}
    local cz = ${cz}
    local rW = ${rW}
    local bulbR = ${bulbR}
    local sW = ${sW}
    local appLen = ${appLen}
    local dir = "${approachDirection}"

    local colAsphalt = Color3.fromRGB(36, 38, 42)
    local colSidewalk = Color3.fromRGB(180, 185, 192)
    local colCurb = Color3.fromRGB(135, 140, 145)
    local colStripeYellow = Color3.fromRGB(240, 200, 45)
    local curbH = 0.65
    local curbW = 0.8

    local function makePart(pName, sz, cf, col, mat, canCol)
        local p = Instance.new("Part", model)
        p.Name = pName
        p.Anchored = true
        p.CanCollide = canCol ~= nil and canCol or true
        p.CanTouch = false
        p.TopSurface = Enum.SurfaceType.Smooth
        p.BottomSurface = Enum.SurfaceType.Smooth
        p.Size = sz
        p.CFrame = cf
        p.Color = col
        p.Material = mat or Enum.Material.Concrete
        return p
    end

    -- 1. BULBO CIRCULAR DE RETORNO (Cilindro de asfalto en el centro)
    local bulbCyl = Instance.new("Part", model)
    bulbCyl.Name = "CulDeSac_Bulb_Asphalt"
    bulbCyl.Shape = Enum.PartType.Cylinder
    bulbCyl.Size = Vector3.new(1.2, bulbR * 2, bulbR * 2)
    bulbCyl.CFrame = CFrame.new(cx, cy - 0.6, cz) * CFrame.Angles(0, 0, math.rad(90))
    bulbCyl.Anchored = true
    bulbCyl.Material = Enum.Material.Concrete
    bulbCyl.Color = colAsphalt

    -- 2. ACERA Y BORDILLO PERIMETRAL EN ARCO (Cubre ~280° dejando abierta la boca de entrada)
    local numArcSegs = 20
    local startAngle = 45
    local endAngle = 315

    for a = 0, numArcSegs do
        local theta = math.rad(startAngle + (a / numArcSegs) * (endAngle - startAngle))
        local cosT = math.cos(theta)
        local sinT = math.sin(theta)

        local segLen = (2 * math.pi * bulbR / numArcSegs) * ((endAngle - startAngle) / 360) + 0.4
        local curbDist = bulbR + curbW / 2
        local curbPos = Vector3.new(cx + cosT * curbDist, cy + curbH / 2, cz + sinT * curbDist)
        local curbCF = CFrame.lookAt(curbPos, curbPos + Vector3.new(-sinT, 0, cosT))

        makePart("Bulb_Curb_" .. a, Vector3.new(curbW, curbH + 0.1, segLen), curbCF, colCurb, Enum.Material.Granite)

        local swDist = bulbR + curbW + sW / 2
        local swPos = Vector3.new(cx + cosT * swDist, cy + curbH / 2, cz + sinT * swDist)
        local swCF = CFrame.lookAt(swPos, swPos + Vector3.new(-sinT, 0, cosT))
        makePart("Bulb_Sidewalk_" .. a, Vector3.new(sW, curbH, segLen), swCF, colSidewalk, Enum.Material.Concrete)

        -- Farolas en el arco
        if a == 5 or a == 15 then
            local polePos = Vector3.new(cx + cosT * (swDist + 2), cy + curbH, cz + sinT * (swDist + 2))
            local pole = makePart("CulDeSac_Lamp", Vector3.new(0.8, 14, 0.8), CFrame.new(polePos) * CFrame.new(0, 7, 0), Color3.fromRGB(45, 48, 55), Enum.Material.Metal)
            local bulb = makePart("Lamp_Bulb", Vector3.new(1.2, 0.4, 1.2), CFrame.new(polePos) * CFrame.new(0, 13.8, 0), Color3.fromRGB(255, 235, 180), Enum.Material.Neon, false)
            local pL = Instance.new("PointLight", bulb)
            pL.Color = Color3.fromRGB(255, 230, 180)
            pL.Range = 26
            pL.Brightness = 1.3
        end
    end

    -- 3. CALLE RECTA DE APROXIMACIÓN
    -- Si approachDirection == "South", la calle viene desde +Z hacia el bulbo en cz
    local appPosZ = cz + bulbR + appLen / 2 - 4
    makePart("Approach_Street", Vector3.new(rW, 1.2, appLen), CFrame.new(cx, cy - 0.6, appPosZ), colAsphalt, Enum.Material.Concrete)

    -- Aceras de la calle recta
    local swLX = cx - rW / 2 - curbW - sW / 2
    local swRX = cx + rW / 2 + curbW + sW / 2
    makePart("Approach_Sw_L", Vector3.new(sW, curbH, appLen), CFrame.new(swLX, cy + curbH / 2, appPosZ), colSidewalk, Enum.Material.Concrete)
    makePart("Approach_Sw_R", Vector3.new(sW, curbH, appLen), CFrame.new(swRX, cy + curbH / 2, appPosZ), colSidewalk, Enum.Material.Concrete)

    -- Bordillos
    makePart("Approach_Curb_L", Vector3.new(curbW, curbH + 0.1, appLen), CFrame.new(cx - rW / 2 - curbW / 2, cy + curbH / 2, appPosZ), colCurb, Enum.Material.Granite)
    makePart("Approach_Curb_R", Vector3.new(curbW, curbH + 0.1, appLen), CFrame.new(cx + rW / 2 + curbW / 2, cy + curbH / 2, appPosZ), colCurb, Enum.Material.Granite)

    -- Doble línea central amarilla
    makePart("Approach_Stripe_L", Vector3.new(0.4, 0.08, appLen - 6), CFrame.new(cx - 0.6, cy + 0.04, appPosZ), colStripeYellow, Enum.Material.SmoothPlastic, false)
    makePart("Approach_Stripe_R", Vector3.new(0.4, 0.08, appLen - 6), CFrame.new(cx + 0.6, cy + 0.04, appPosZ), colStripeYellow, Enum.Material.SmoothPlastic, false)

    print("[RoadNetwork] ✅ Cul-de-sac '${name}' (Grove St style) construido en (${cx}, ${cy}, ${cz}).")
end

buildCulDeSac()
`;
}

export function generateIntersectionLuau({
  name = "Intersection_Node",
  center = [0, 0, 0],
  type = "roundabout", // "roundabout", "cross_4way", "t_junction"
  roadWidth = 24,
  radius = 32, // Para rotondas
  armLength = 40,
  hasTrafficLights = true,
  parent = "City/Roads",
}) {
  const [cx, cy, cz] = [snapVal(center[0], 4), snapVal(center[1], 4), snapVal(center[2], 4)];

  return `
local CollectionService = game:GetService("CollectionService")

local function buildIntersection()
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

    local cx = ${cx}
    local cy = ${cy}
    local cz = ${cz}
    local rW = ${roadWidth}
    local armLen = ${armLength}
    local iType = "${type.toLowerCase()}"

    local colAsphalt = Color3.fromRGB(36, 38, 42)
    local colSidewalk = Color3.fromRGB(180, 185, 190)
    local colCurb = Color3.fromRGB(140, 145, 150)
    local colWhite = Color3.fromRGB(240, 242, 245)

    local function makePart(pName, sz, cf, col, mat, canCol, isDecor)
        local p = Instance.new("Part", model)
        p.Name = pName
        p.Anchored = true
        p.CanCollide = canCol ~= nil and canCol or true
        p.CanTouch = false
        if isDecor then p.CanQuery = false end
        p.TopSurface = Enum.SurfaceType.Smooth
        p.BottomSurface = Enum.SurfaceType.Smooth
        p.Size = sz
        p.CFrame = cf
        p.Color = col
        p.Material = mat or Enum.Material.Concrete
        return p
    end

    local function spawnTrafficLight(cf)
        local pole = makePart("TL_Pole", Vector3.new(0.8, 14, 0.8), cf * CFrame.new(0, 7, 0), Color3.fromRGB(45, 48, 52), Enum.Material.Metal, true)
        local arm = makePart("TL_Arm", Vector3.new(0.6, 0.6, 6), cf * CFrame.new(0, 13.5, 3), Color3.fromRGB(45, 48, 52), Enum.Material.Metal, false)
        local box = makePart("TL_Box", Vector3.new(1.2, 3.6, 1.2), cf * CFrame.new(0, 13.5, 5.5), Color3.fromRGB(30, 32, 35), Enum.Material.Metal, false)

        -- 3 luces: Roja, Ámbar, Verde
        local redL = makePart("TL_Red", Vector3.new(0.8, 0.8, 0.2), cf * CFrame.new(0, 14.6, 6.15), Color3.fromRGB(255, 30, 30), Enum.Material.Neon, false)
        local yelL = makePart("TL_Yellow", Vector3.new(0.8, 0.8, 0.2), cf * CFrame.new(0, 13.5, 6.15), Color3.fromRGB(240, 180, 20), Enum.Material.Neon, false)
        local grnL = makePart("TL_Green", Vector3.new(0.8, 0.8, 0.2), cf * CFrame.new(0, 12.4, 6.15), Color3.fromRGB(30, 220, 60), Enum.Material.Neon, false)
    end

    if iType == "roundabout" then
        -- 1. ROTONDA CIRCULAR CON JARDÍN CENTRAL
        local outerR = ${radius}
        local innerR = outerR - rW

        -- Anillo de asfalto de la rotonda
        local ringCyl = makePart("Roundabout_Ring", Vector3.new(1, outerR * 2, outerR * 2), CFrame.new(cx, cy - 0.5, cz) * CFrame.Angles(0, 0, math.rad(90)), colAsphalt, Enum.Material.Concrete)
        ringCyl.Shape = Enum.PartType.Cylinder

        -- Jardín / Fuente central
        local gardenCyl = makePart("Center_Island", Vector3.new(1.8, innerR * 2, innerR * 2), CFrame.new(cx, cy + 0.4, cz) * CFrame.Angles(0, 0, math.rad(90)), Color3.fromRGB(55, 120, 50), Enum.Material.Grass)
        gardenCyl.Shape = Enum.PartType.Cylinder

        -- Árbol monumental o monumento en el centro
        local trunk = makePart("Monument_Trunk", Vector3.new(2.4, 12, 2.4), CFrame.new(cx, cy + 6.4, cz), Color3.fromRGB(85, 55, 35), Enum.Material.WoodPlanks)
        local crown = makePart("Monument_Crown", Vector3.new(10, 8, 10), CFrame.new(cx, cy + 14.4, cz), Color3.fromRGB(60, 135, 55), Enum.Material.Grass, false)

        -- 4 Salidas a los puntos cardinales (Norte, Sur, Este, Oeste)
        makePart("Arm_North", Vector3.new(rW, 1, armLen), CFrame.new(cx, cy - 0.5, cz - outerR - armLen / 2), colAsphalt, Enum.Material.Concrete)
        makePart("Arm_South", Vector3.new(rW, 1, armLen), CFrame.new(cx, cy - 0.5, cz + outerR + armLen / 2), colAsphalt, Enum.Material.Concrete)
        makePart("Arm_East", Vector3.new(armLen, 1, rW), CFrame.new(cx + outerR + armLen / 2, cy - 0.5, cz), colAsphalt, Enum.Material.Concrete)
        makePart("Arm_West", Vector3.new(armLen, 1, rW), CFrame.new(cx - outerR - armLen / 2, cy - 0.5, cz), colAsphalt, Enum.Material.Concrete)

    else
        -- 2. CRUCE DE 4 VÍAS O CRUCE EN T CON SEMÁFOROS
        local isCross = iType == "cross_4way"
        -- Asfalto de la intersección
        local boxSz = Vector3.new(rW * 2 + 8, 1, rW * 2 + 8)
        makePart("Intersection_Junction", boxSz, CFrame.new(cx, cy - 0.5, cz), colAsphalt, Enum.Material.Concrete)

        -- Brazos de aproximación
        makePart("Approach_North", Vector3.new(rW, 1, armLen), CFrame.new(cx, cy - 0.5, cz - rW - armLen / 2), colAsphalt, Enum.Material.Concrete)
        makePart("Approach_South", Vector3.new(rW, 1, armLen), CFrame.new(cx, cy - 0.5, cz + rW + armLen / 2), colAsphalt, Enum.Material.Concrete)
        makePart("Approach_East", Vector3.new(armLen, 1, rW), CFrame.new(cx + rW + armLen / 2, cy - 0.5, cz), colAsphalt, Enum.Material.Concrete)
        if isCross then
            makePart("Approach_West", Vector3.new(armLen, 1, rW), CFrame.new(cx - rW - armLen / 2, cy - 0.5, cz), colAsphalt, Enum.Material.Concrete)
        end

        ${
          hasTrafficLights
            ? `
        -- Semáforos en las esquinas
        local offsetCorner = rW / 2 + 4
        spawnTrafficLight(CFrame.new(cx - offsetCorner, cy, cz - offsetCorner) * CFrame.Angles(0, math.rad(45), 0))
        spawnTrafficLight(CFrame.new(cx + offsetCorner, cy, cz - offsetCorner) * CFrame.Angles(0, math.rad(-45), 0))
        spawnTrafficLight(CFrame.new(cx + offsetCorner, cy, cz + offsetCorner) * CFrame.Angles(0, math.rad(-135), 0))
        if isCross then
            spawnTrafficLight(CFrame.new(cx - offsetCorner, cy, cz + offsetCorner) * CFrame.Angles(0, math.rad(135), 0))
        end
        `
            : ""
        }
    end

    print(string.format("[RoadNetwork] ✅ Intersección '%s' (%s) construida en (%d, %d, %d).", "${name}", iType, cx, cy, cz))
end

buildIntersection()
`;
}
