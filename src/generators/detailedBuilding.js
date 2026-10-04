import { getStylePreset } from "./stylePresets.js";
import { snapVal } from "./grid.js";

/**
 * Generador Arquitectónico AAA de Edificios Multinivel Detallados.
 * Construye edificios con fachadas en relieve 3D, zócalos antisuspensión,
 * planta baja comercial con escaparates y toldos, ventanas modulares con alféizar
 * e iluminación interior variada, y azoteas habitables con HVAC, tanque y antenas.
 */
export function generateDetailedBuildingLuau({
  name = "Detailed_Building",
  position = [0, 0, 0],
  footprint = [40, 40], // [widthX, depthZ]
  floors = 5,
  style = "modern_downtown",
  seed = 1234,
  hasRoofProps = true,
  parent = "City/Downtown",
}) {
  const [posX, posY, posZ] = [snapVal(position[0], 4), snapVal(position[1], 4), snapVal(position[2], 4)];
  const [width, depth] = [Math.max(20, snapVal(footprint[0], 4)), Math.max(20, snapVal(footprint[1] || footprint[2] || 40, 4))];
  const totalFloors = Math.max(1, Math.min(30, Math.floor(floors)));
  const effectiveSeed = typeof seed === "number" ? seed : 1234;

  const styleConfig = getStylePreset(style);
  const facadeColor = styleConfig.facadeColors[effectiveSeed % styleConfig.facadeColors.length];
  const awningColor = styleConfig.awningColors[effectiveSeed % styleConfig.awningColors.length];

  const groundFloorHeight = 13;
  const upperFloorHeight = 10;
  const buildingHeight = groundFloorHeight + (totalFloors - 1) * upperFloorHeight;

  return `
local CollectionService = game:GetService("CollectionService")

local function buildArchitecturalBuilding()
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

    local cx = ${posX}
    local cy = ${posY}
    local cz = ${posZ}
    local w = ${width}
    local d = ${depth}
    local numFloors = ${totalFloors}
    local groundH = ${groundFloorHeight}
    local upperH = ${upperFloorHeight}
    local totalH = ${buildingHeight}

    local colFacade = Color3.fromRGB(${facadeColor[0]}, ${facadeColor[1]}, ${facadeColor[2]})
    local colPillar = Color3.fromRGB(${styleConfig.pillarColor[0]}, ${styleConfig.pillarColor[1]}, ${styleConfig.pillarColor[2]})
    local colCornice = Color3.fromRGB(${styleConfig.corniceColor[0]}, ${styleConfig.corniceColor[1]}, ${styleConfig.corniceColor[2]})
    local colBase = Color3.fromRGB(${styleConfig.baseboardColor[0]}, ${styleConfig.baseboardColor[1]}, ${styleConfig.baseboardColor[2]})
    local colGlass = Color3.fromRGB(${styleConfig.glassColor[0]}, ${styleConfig.glassColor[1]}, ${styleConfig.glassColor[2]})
    local colAwning = Color3.fromRGB(${awningColor[0]}, ${awningColor[1]}, ${awningColor[2]})
    local colRoof = Color3.fromRGB(${styleConfig.roofFloorColor[0]}, ${styleConfig.roofFloorColor[1]}, ${styleConfig.roofFloorColor[2]})
    local colParapet = Color3.fromRGB(${styleConfig.parapetColor[0]}, ${styleConfig.parapetColor[1]}, ${styleConfig.parapetColor[2]})

    local matFacade = Enum.Material.${styleConfig.facadeMaterials[0]}
    local matPillar = Enum.Material.${styleConfig.pillarMaterial}
    local matCornice = Enum.Material.${styleConfig.corniceMaterial}
    local matBase = Enum.Material.${styleConfig.baseboardMaterial}
    local matGlass = Enum.Material.Glass
    local matAwning = Enum.Material.${styleConfig.awningMaterial}
    local matParapet = Enum.Material.${styleConfig.parapetMaterial}

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
        p.Material = mat or matFacade
        return p
    end

    local function makeWedge(pName, sz, cf, col, mat)
        local wPart = Instance.new("WedgePart", model)
        wPart.Name = pName
        wPart.Anchored = true
        wPart.CanCollide = false
        wPart.CanTouch = false
        wPart.CanQuery = false
        wPart.Size = sz
        wPart.CFrame = cf
        wPart.Color = col
        wPart.Material = mat or matAwning
        return wPart
    end

    -- 1. CIMENTACIÓN Y ZÓCALO EXTERIOR (Plinth para evitar suspensión en desniveles)
    local plinthDepth = 4
    local plinthH = 1.6
    makePart("Foundation_Plinth", Vector3.new(w + 1.2, plinthH + plinthDepth, d + 1.2),
        CFrame.new(cx, cy + (plinthH - plinthDepth) / 2, cz), colBase, matBase, true)

    -- 2. NÚCLEO ESTRUCTURAL PRINCIPAL (Cuerpo base del edificio)
    makePart("Core_Body", Vector3.new(w, totalH, d),
        CFrame.new(cx, cy + totalH / 2, cz), colFacade, matFacade, true)

    -- 3. PILASTAS / COLUMNAS EN LAS 4 ESQUINAS (Estructura en relieve)
    local pillarThick = 1.2
    local halfW = w / 2
    local halfD = d / 2
    local pillarH = totalH
    local pY = cy + totalH / 2

    makePart("CornerPillar_NW", Vector3.new(pillarThick, pillarH, pillarThick), CFrame.new(cx - halfW, pY, cz - halfD), colPillar, matPillar, false, true)
    makePart("CornerPillar_NE", Vector3.new(pillarThick, pillarH, pillarThick), CFrame.new(cx + halfW, pY, cz - halfD), colPillar, matPillar, false, true)
    makePart("CornerPillar_SW", Vector3.new(pillarThick, pillarH, pillarThick), CFrame.new(cx - halfW, pY, cz + halfD), colPillar, matPillar, false, true)
    makePart("CornerPillar_SE", Vector3.new(pillarThick, pillarH, pillarThick), CFrame.new(cx + halfW, pY, cz + halfD), colPillar, matPillar, false, true)

    -- 4. PLANTA BAJA COMERCIAL: ESCAPARATES, PORTAL Y TOLDOS (Fachada Frontal Sur +Z)
    local groundY = cy + groundH / 2
    -- Portal de entrada centrado y remetido
    local doorW = 6
    local doorH = 9
    local doorZ = cz + halfD + 0.1
    local doorFrame = makePart("Entrance_Portal", Vector3.new(doorW, doorH, 0.6), CFrame.new(cx, cy + doorH / 2, doorZ), colPillar, matPillar, true)
    -- Puertas de cristal en el portal
    local glassDoor = makePart("Entrance_Glass", Vector3.new(doorW - 1, doorH - 1, 0.4), CFrame.new(cx, cy + doorH / 2, doorZ - 0.2), colGlass, matGlass, true)
    glassDoor.Transparency = 0.4
    glassDoor.Reflectance = 0.3

    -- Luz cálida de bienvenida sobre el portal
    local porchLight = Instance.new("PointLight", doorFrame)
    porchLight.Color = Color3.fromRGB(255, 230, 180)
    porchLight.Range = 16
    porchLight.Brightness = 1.2
    porchLight.Shadows = true

    -- Escaparates comerciales a los lados del portal
    local shopWidth = (w - doorW - 6) / 2
    if shopWidth > 4 then
        local leftShopX = cx - halfW + 1.5 + shopWidth / 2
        local rightShopX = cx + halfW - 1.5 - shopWidth / 2
        local shopH = 8
        local shopY = cy + shopH / 2 + 1.2

        -- Escaparate Izquierdo
        local leftShowcase = makePart("Showcase_Left", Vector3.new(shopWidth, shopH, 0.5), CFrame.new(leftShopX, shopY, doorZ), colGlass, matGlass, false, true)
        leftShowcase.Transparency = 0.35
        leftShowcase.Reflectance = 0.45
        -- Escaparate Derecho
        local rightShowcase = makePart("Showcase_Right", Vector3.new(shopWidth, shopH, 0.5), CFrame.new(rightShopX, shopY, doorZ), colGlass, matGlass, false, true)
        rightShowcase.Transparency = 0.35
        rightShowcase.Reflectance = 0.45

        -- Toldos a 45° con WedgePart sobre escaparates
        local awningDepth = 3.5
        local awningH = 2.2
        local awningY = cy + shopH + 2.2
        local awningZ = doorZ + awningDepth / 2

        makeWedge("Awning_Left", Vector3.new(shopWidth, awningH, awningDepth),
            CFrame.new(leftShopX, awningY, awningZ) * CFrame.Angles(0, math.rad(180), 0), colAwning, matAwning)
        makeWedge("Awning_Right", Vector3.new(shopWidth, awningH, awningDepth),
            CFrame.new(rightShopX, awningY, awningZ) * CFrame.Angles(0, math.rad(180), 0), colAwning, matAwning)

        -- Rótulos comerciales iluminados (Fascia board)
        local signH = 1.8
        local signY = awningY + 1.6
        local signLeft = makePart("Sign_Left", Vector3.new(shopWidth - 1, signH, 0.5), CFrame.new(leftShopX, signY, doorZ + 0.2), Color3.fromRGB(35, 38, 44), Enum.Material.SmoothPlastic, false, true)
        local signLight = Instance.new("PointLight", signLeft)
        signLight.Color = Color3.fromRGB(255, 245, 220)
        signLight.Range = 10
        signLight.Brightness = 0.8
    end

    -- Cornisa sobre la planta baja (separación de escala comercial)
    makePart("Cornice_Ground", Vector3.new(w + 1.0, 0.8, d + 1.0),
        CFrame.new(cx, cy + groundH, cz), colCornice, matCornice, false, true)

    -- 5. PISOS SUPERIORES Y VENTANAS MODULARES EN RELIEVE 3D
    local seedVal = ${effectiveSeed}
    local winW = 3.6
    local winH = 5.5
    local winFrameThick = 0.4
    local sillProtrude = 0.6

    for fl = 1, numFloors - 1 do
        local floorBaseY = cy + groundH + (fl - 1) * upperH
        local winCenterY = floorBaseY + upperH / 2

        -- Cornisa horizontal divisoria de piso
        if fl < numFloors - 1 then
            makePart("Cornice_Floor_" .. fl, Vector3.new(w + 0.8, 0.6, d + 0.8),
                CFrame.new(cx, floorBaseY + upperH, cz), colCornice, matCornice, false, true)
        end

        -- Distribución de ventanas en fachada frontal (+Z) y trasera (-Z)
        local numWinsX = math.max(1, math.floor((w - 6) / 7))
        local spacingX = (w - 4) / numWinsX

        for wx = 1, numWinsX do
            local winX = cx - halfW + 2 + (wx - 0.5) * spacingX

            -- Ventanas Frontales (+Z)
            local sillCF_Front = CFrame.new(winX, winCenterY - winH / 2 - 0.2, cz + halfD + sillProtrude / 2)
            makePart("Sill_F_" .. fl .. "_" .. wx, Vector3.new(winW + 0.8, 0.4, sillProtrude), sillCF_Front, colCornice, matCornice, false, true)

            local frameCF_Front = CFrame.new(winX, winCenterY, cz + halfD + 0.15)
            makePart("Frame_F_" .. fl .. "_" .. wx, Vector3.new(winW, winH, 0.3), frameCF_Front, colPillar, matPillar, false, true)

            local glassCF_Front = CFrame.new(winX, winCenterY, cz + halfD - 0.2)
            local glass_F = makePart("Glass_F_" .. fl .. "_" .. wx, Vector3.new(winW - 0.6, winH - 0.6, 0.2), glassCF_Front, colGlass, matGlass, false, true)
            glass_F.Transparency = 0.35
            glass_F.Reflectance = 0.4

            -- Iluminación interior aleatoria (~40% encendidas)
            local isLit = ((seedVal * 17 + fl * 31 + wx * 13) % 100) < 42
            if isLit then
                local interiorLight = Instance.new("PointLight", glass_F)
                interiorLight.Color = Color3.fromRGB(255, 235, 190)
                interiorLight.Range = 12
                interiorLight.Brightness = 0.7
                glass_F.Material = Enum.Material.Neon
                glass_F.Color = Color3.fromRGB(255, 240, 200)
                glass_F.Transparency = 0.1
            end

            -- Ventanas Traseras (-Z)
            local sillCF_Back = CFrame.new(winX, winCenterY - winH / 2 - 0.2, cz - halfD - sillProtrude / 2)
            makePart("Sill_B_" .. fl .. "_" .. wx, Vector3.new(winW + 0.8, 0.4, sillProtrude), sillCF_Back, colCornice, matCornice, false, true)

            local frameCF_Back = CFrame.new(winX, winCenterY, cz - halfD - 0.15)
            makePart("Frame_B_" .. fl .. "_" .. wx, Vector3.new(winW, winH, 0.3), frameCF_Back, colPillar, matPillar, false, true)

            local glassCF_Back = CFrame.new(winX, winCenterY, cz - halfD + 0.2)
            local glass_B = makePart("Glass_B_" .. fl .. "_" .. wx, Vector3.new(winW - 0.6, winH - 0.6, 0.2), glassCF_Back, colGlass, matGlass, false, true)
            glass_B.Transparency = 0.35
            glass_B.Reflectance = 0.4
        end
    end

    -- 6. AZOTEA Y EQUIPAMIENTO TÉCNICO (Rooftop)
    local roofY = cy + totalH
    -- Suelo de la azotea
    makePart("Roof_Slab", Vector3.new(w, 1.2, d), CFrame.new(cx, roofY - 0.6, cz), colRoof, Enum.Material.Concrete, true)

    -- Parapeto perimetral (cobertura táctica de 2 studs para tiroteos)
    local paraH = 2.4
    local paraThick = 1.0
    local pCenterY = roofY + paraH / 2
    makePart("Parapet_N", Vector3.new(w, paraH, paraThick), CFrame.new(cx, pCenterY, cz - halfD + paraThick / 2), colParapet, matParapet, true)
    makePart("Parapet_S", Vector3.new(w, paraH, paraThick), CFrame.new(cx, pCenterY, cz + halfD - paraThick / 2), colParapet, matParapet, true)
    makePart("Parapet_W", Vector3.new(paraThick, paraH, d), CFrame.new(cx - halfW + paraThick / 2, pCenterY, cz), colParapet, matParapet, true)
    makePart("Parapet_E", Vector3.new(paraThick, paraH, d), CFrame.new(cx + halfW - paraThick / 2, pCenterY, cz), colParapet, matParapet, true)

    ${
      hasRoofProps
        ? `
    -- Caseta de acceso al ascensor / escaleras
    local pentW = 12
    local pentD = 14
    local pentH = 9
    local pentX = cx - halfW + pentW / 2 + 3
    local pentZ = cz - halfD + pentD / 2 + 3
    local pentY = roofY + pentH / 2
    makePart("Elevator_Penthouse", Vector3.new(pentW, pentH, pentD), CFrame.new(pentX, pentY, pentZ), colCornice, Enum.Material.Concrete, true)
    -- Puerta técnica de la caseta
    makePart("Penthouse_Door", Vector3.new(3.5, 7, 0.4), CFrame.new(pentX, roofY + 3.5, pentZ + pentD / 2 + 0.2), Color3.fromRGB(50, 52, 58), Enum.Material.Metal, false, true)

    -- Unidad HVAC de climatización con rejillas
    local hvacX = cx + halfW - 8
    local hvacZ = cz + halfD - 8
    local hvacY = roofY + 2
    makePart("HVAC_Unit_01", Vector3.new(7, 4, 6), CFrame.new(hvacX, hvacY, hvacZ), Color3.fromRGB(160, 165, 170), Enum.Material.DiamondPlate, true)
    -- Ventilador superior circular
    local fan = makePart("HVAC_Fan", Vector3.new(4, 0.6, 4), CFrame.new(hvacX, roofY + 4.3, hvacZ), Color3.fromRGB(40, 42, 45), Enum.Material.Metal, false, true)
    fan.Shape = Enum.PartType.Cylinder
    fan.CFrame = CFrame.new(hvacX, roofY + 4.3, hvacZ) * CFrame.Angles(0, 0, math.rad(90))

    -- Tanque de agua cilíndrico sobre zancos
    if w >= 28 and d >= 28 then
        local tankX = cx + halfW - 9
        local tankZ = cz - halfD + 9
        -- 4 patas de soporte
        local stiltH = 5
        makePart("Tank_Stilt_1", Vector3.new(0.6, stiltH, 0.6), CFrame.new(tankX - 2.5, roofY + stiltH / 2, tankZ - 2.5), Color3.fromRGB(50, 52, 55), Enum.Material.Metal, false, true)
        makePart("Tank_Stilt_2", Vector3.new(0.6, stiltH, 0.6), CFrame.new(tankX + 2.5, roofY + stiltH / 2, tankZ - 2.5), Color3.fromRGB(50, 52, 55), Enum.Material.Metal, false, true)
        makePart("Tank_Stilt_3", Vector3.new(0.6, stiltH, 0.6), CFrame.new(tankX - 2.5, roofY + stiltH / 2, tankZ + 2.5), Color3.fromRGB(50, 52, 55), Enum.Material.Metal, false, true)
        makePart("Tank_Stilt_4", Vector3.new(0.6, stiltH, 0.6), CFrame.new(tankX + 2.5, roofY + stiltH / 2, tankZ + 2.5), Color3.fromRGB(50, 52, 55), Enum.Material.Metal, false, true)
        -- Tanque cilíndrico
        local tankCyl = makePart("Water_Tank", Vector3.new(7, 7, 7), CFrame.new(tankX, roofY + stiltH + 3.5, tankZ) * CFrame.Angles(0, 0, math.rad(90)), Color3.fromRGB(90, 70, 55), Enum.Material.WoodPlanks, true)
        tankCyl.Shape = Enum.PartType.Cylinder
    end

    -- Antena de telecomunicaciones con luz de baliza roja parpadeante
    local antH = 18
    local antX = pentX + pentW / 2 + 4
    local antZ = pentZ
    local ant = makePart("Roof_Antenna", Vector3.new(0.8, antH, 0.8), CFrame.new(antX, roofY + antH / 2, antZ), Color3.fromRGB(70, 75, 80), Enum.Material.Metal, false, true)
    local beacon = makePart("Antenna_Beacon", Vector3.new(1.2, 1.2, 1.2), CFrame.new(antX, roofY + antH + 0.6, antZ), Color3.fromRGB(255, 30, 30), Enum.Material.Neon, false, true)
    beacon.Shape = Enum.PartType.Ball
    local beaconLight = Instance.new("PointLight", beacon)
    beaconLight.Color = Color3.fromRGB(255, 40, 40)
    beaconLight.Range = 14
    beaconLight.Brightness = 1.5
    `
        : ""
    }

    print(string.format("[DetailedBuilding] ✅ '%s' (%s, %d pisos, %dx%d) construido en '%s'.", "${name}", "${style}", numFloors, w, d, "${parent}"))
end

buildArchitecturalBuilding()
`;
}
