import { snapVal } from "./grid.js";

/**
 * Motor de Redes Viales Avanzadas: Carreteras Curvas Bézier, Rotondas e Intersecciones con Semáforos.
 */

export function generateCurvedRoadLuau({
  name = "Curved_Highway",
  waypoints = [
    [-100, 0, -100],
    [0, 10, 0],
    [100, 0, 100],
  ],
  roadWidth = 24,
  sidewalkWidth = 6,
  hasSidewalks = true,
  hasLamps = true,
  parent = "City/Roads",
}) {
  const pointsJson = JSON.stringify(waypoints);

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
    local hasSw = ${hasSidewalks}
    local hasLamps = ${hasLamps}

    local colAsphalt = Color3.fromRGB(36, 38, 42)
    local colSidewalk = Color3.fromRGB(180, 182, 188)
    local colCurb = Color3.fromRGB(140, 145, 150)
    local colStripe = Color3.fromRGB(240, 200, 45)

    local function makePart(pName, sz, cf, col, mat, canCol)
        local p = Instance.new("Part", model)
        p.Name = pName
        p.Anchored = true
        p.CanCollide = canCol ~= nil and canCol or true
        p.CanTouch = false
        p.TopSurface = Enum.TopSurfaceType.Smooth
        p.BottomSurface = Enum.BottomSurfaceType.Smooth
        p.Size = sz
        p.CFrame = cf
        p.Color = col
        p.Material = mat or Enum.Material.Concrete
        return p
    end

    -- Interpolación Bézier cuadrática o por tramos de waypoints
    local function evaluateBezier(pts, t)
        if #pts == 3 then
            local p0 = Vector3.new(pts[1][1], pts[1][2], pts[1][3])
            local p1 = Vector3.new(pts[2][1], pts[2][2], pts[2][3])
            local p2 = Vector3.new(pts[3][1], pts[3][2], pts[3][3])
            local q0 = p0:Lerp(p1, t)
            local q1 = p1:Lerp(p2, t)
            return q0:Lerp(q1, t)
        end
        local idx = math.clamp(math.floor(t * (#pts - 1)) + 1, 1, #pts - 1)
        local localT = (t * (#pts - 1)) - (idx - 1)
        local pA = Vector3.new(pts[idx][1], pts[idx][2], pts[idx][3])
        local pB = Vector3.new(pts[idx+1][1], pts[idx+1][2], pts[idx+1][3])
        return pA:Lerp(pB, localT)
    end

    local numSegments = 24
    for i = 0, numSegments - 1 do
        local t1 = i / numSegments
        local t2 = (i + 1) / numSegments

        local p1 = evaluateBezier(rawPoints, t1)
        local p2 = evaluateBezier(rawPoints, t2)
        local delta = p2 - p1
        local segLen = delta.Magnitude

        if segLen > 0.5 then
            local midP = (p1 + p2) / 2
            local roadCF = CFrame.lookAt(midP, p2)

            -- 1. Calzada de asfalto
            makePart("RoadSeg_" .. i, Vector3.new(rW, 1, segLen + 0.4), roadCF * CFrame.new(0, -0.5, 0), colAsphalt, Enum.Material.Concrete)

            -- 2. Línea divisoria central
            if i % 2 == 0 then
                makePart("Stripe_" .. i, Vector3.new(0.8, 0.1, segLen * 0.8), roadCF * CFrame.new(0, 0.05, 0), colStripe, Enum.Material.SmoothPlastic, false)
            end

            -- 3. Aceras elevadas a los costados
            if hasSw then
                local leftX = -rW / 2 - sW / 2
                local rightX = rW / 2 + sW / 2
                makePart("SwL_" .. i, Vector3.new(sW, 1.2, segLen + 0.4), roadCF * CFrame.new(leftX, 0.1, 0), colSidewalk, Enum.Material.Concrete)
                makePart("SwR_" .. i, Vector3.new(sW, 1.2, segLen + 0.4), roadCF * CFrame.new(rightX, 0.1, 0), colSidewalk, Enum.Material.Concrete)
            end

            -- 4. Farolas alternas
            if hasLamps and (i % 6 == 0) then
                local side = (i % 12 == 0) and 1 or -1
                local lampOffset = (rW / 2 + sW / 2) * side
                local poleCF = roadCF * CFrame.new(lampOffset, 0.7, 0)
                local pole = makePart("Lamp_Pole", Vector3.new(0.8, 14, 0.8), poleCF * CFrame.new(0, 7, 0), Color3.fromRGB(45, 48, 55), Enum.Material.Metal)
                local bulb = makePart("Lamp_Bulb", Vector3.new(1.2, 0.4, 1.2), poleCF * CFrame.new(0, 13.8, 0), Color3.fromRGB(255, 235, 180), Enum.Material.Neon, false)
                local pL = Instance.new("PointLight", bulb)
                pL.Color = Color3.fromRGB(255, 230, 180)
                pL.Range = 28
                pL.Brightness = 1.4
            end
        end
    end

    print("[RoadNetwork] ✅ Carretera curva '${name}' trazada exitosamente.")
end

buildCurvedRoad()
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
        p.TopSurface = Enum.TopSurfaceType.Smooth
        p.BottomSurface = Enum.BottomSurfaceType.Smooth
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
