import { getStylePreset } from "./stylePresets.js";
import { snapVal } from "./grid.js";

/**
 * Generador Arquitectónico AAA de Edificios Multinivel Detallados.
 * Diseñado con los más altos estándares visuales para Roblox:
 * - Volumetría realista con setbacks/retranqueos y terrazas transitables
 * - Articulación completa en las 4 fachadas (Norte, Sur, Este, Oeste): sin muros ciegos planos
 * - Portal de entrada principal remetido con doble puerta batiente, manillones metálicos, espejo y marquesina
 * - Puerta trasera de servicio con dintel, manija y farol de seguridad
 * - Ventanas 3D con alféizares salientes, dinteles, parteluces (mullions) e iluminación interior realista
 * - Acabados comerciales: escaparates con zócalo, rótulos 3D iluminados, toldos de tela/metal y veladores de cafetería
 * - Balcones en voladizo con barandillas de forja o cristal
 * - Azotea completa con caseta de ascensor transitable, unidad HVAC doble ventilador, tanque de agua sobre zancos de acero y baliza de telecomunicaciones
 */
export function generateDetailedBuildingLuau({
  name = "Detailed_Building",
  position = [0, 0, 0],
  footprint = [44, 44], // [widthX, depthZ]
  floors = 5,
  style = "modern_downtown",
  seed = 1234,
  hasRoofProps = true,
  hasBalconies = true,
  hasFireEscapes = null,
  hasSidewalkDining = true,
  hasSetbacks = true,
  parent = "City/Downtown",
}) {
  const [posX, posY, posZ] = [snapVal(position[0], 4), snapVal(position[1], 4), snapVal(position[2], 4)];
  const [width, depth] = [Math.max(24, snapVal(footprint[0], 4)), Math.max(24, snapVal(footprint[1] || footprint[2] || 44, 4))];
  const totalFloors = Math.max(1, Math.min(30, Math.floor(floors)));
  const effectiveSeed = typeof seed === "number" ? seed : 1234;

  const styleConfig = getStylePreset(style);
  const facadeColors = styleConfig.facadeColors || [[238, 240, 244]];
  const facadeColor = facadeColors[effectiveSeed % facadeColors.length];
  const awningColors = styleConfig.awningColors || [[35, 65, 120]];
  const awningColor = awningColors[effectiveSeed % awningColors.length];
  const signNames = styleConfig.signNames || ["GRAND PLAZA"];
  const signName = signNames[effectiveSeed % signNames.length];
  const signGlowColors = styleConfig.signGlowColors || [[255, 240, 200]];
  const signGlow = signGlowColors[effectiveSeed % signGlowColors.length];

  const enableFireEscapes = hasFireEscapes !== null ? !!hasFireEscapes : !!styleConfig.hasFireEscapes;
  const enableBalconies = hasBalconies !== null ? !!hasBalconies : !!styleConfig.hasBalconies;

  const groundFloorHeight = 14;
  const upperFloorHeight = 10.5;
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
    local seedVal = ${effectiveSeed}

    -- PALETA DE MATERIALES Y COLORES PBR AAA
    local colFacade = Color3.fromRGB(${facadeColor[0]}, ${facadeColor[1]}, ${facadeColor[2]})
    local colPillar = Color3.fromRGB(${styleConfig.pillarColor[0]}, ${styleConfig.pillarColor[1]}, ${styleConfig.pillarColor[2]})
    local colCornice = Color3.fromRGB(${styleConfig.corniceColor[0]}, ${styleConfig.corniceColor[1]}, ${styleConfig.corniceColor[2]})
    local colBase = Color3.fromRGB(${styleConfig.baseboardColor[0]}, ${styleConfig.baseboardColor[1]}, ${styleConfig.baseboardColor[2]})
    local colGlass = Color3.fromRGB(${styleConfig.glassColor[0]}, ${styleConfig.glassColor[1]}, ${styleConfig.glassColor[2]})
    local colAwning = Color3.fromRGB(${awningColor[0]}, ${awningColor[1]}, ${awningColor[2]})
    local colRoof = Color3.fromRGB(${styleConfig.roofFloorColor[0]}, ${styleConfig.roofFloorColor[1]}, ${styleConfig.roofFloorColor[2]})
    local colParapet = Color3.fromRGB(${styleConfig.parapetColor[0]}, ${styleConfig.parapetColor[1]}, ${styleConfig.parapetColor[2]})
    local colDoor = Color3.fromRGB(${styleConfig.doorColor[0]}, ${styleConfig.doorColor[1]}, ${styleConfig.doorColor[2]})
    local colHandle = Color3.fromRGB(${styleConfig.doorHandleColor[0]}, ${styleConfig.doorHandleColor[1]}, ${styleConfig.doorHandleColor[2]})
    local colBalcony = Color3.fromRGB(${styleConfig.balconyColor[0]}, ${styleConfig.balconyColor[1]}, ${styleConfig.balconyColor[2]})

    local matFacade = Enum.Material.${styleConfig.facadeMaterials[0]}
    local matPillar = Enum.Material.${styleConfig.pillarMaterial}
    local matCornice = Enum.Material.${styleConfig.corniceMaterial}
    local matBase = Enum.Material.${styleConfig.baseboardMaterial}
    local matGlass = Enum.Material.Glass
    local matAwning = Enum.Material.${styleConfig.awningMaterial}
    local matParapet = Enum.Material.${styleConfig.parapetMaterial}
    local matDoor = Enum.Material.${styleConfig.doorMaterial}
    local matBalcony = Enum.Material.${styleConfig.balconyMaterial}

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

    local function makeCylinder(pName, sz, cf, col, mat, canCol)
        local cPart = Instance.new("Part", model)
        cPart.Name = pName
        cPart.Shape = Enum.PartType.Cylinder
        cPart.Anchored = true
        cPart.CanCollide = canCol ~= nil and canCol or false
        cPart.CanTouch = false
        cPart.CanQuery = false
        cPart.Size = sz
        cPart.CFrame = cf
        cPart.Color = col
        cPart.Material = mat or Enum.Material.Metal
        return cPart
    end

    local halfW = w / 2
    local halfD = d / 2

    -- 1. CIMENTACIÓN Y ZÓCALO RÚSTICO ANTISUSPENSIÓN (Plinth)
    local plinthDepth = 4.5
    local plinthH = 1.8
    makePart("Foundation_Plinth", Vector3.new(w + 1.6, plinthH + plinthDepth, d + 1.6),
        CFrame.new(cx, cy + (plinthH - plinthDepth) / 2, cz), colBase, matBase, true)

    -- 2. PLANTA BAJA CON ZÓCALO EN RELIEVE
    makePart("Ground_Floor_Podium", Vector3.new(w + 0.8, groundH, d + 0.8),
        CFrame.new(cx, cy + groundH / 2, cz), colFacade, matFacade, true)

    -- Cornisa divisoria prominente sobre planta baja (marca la escala humana)
    makePart("Cornice_Belt_Ground", Vector3.new(w + 2.2, 1.2, d + 2.2),
        CFrame.new(cx, cy + groundH + 0.6, cz), colCornice, matCornice, false, true)

    -- 3. NÚCLEO SUPERIOR Y RETRANQUEO (Setback)
    local hasSetback = ${hasSetbacks ? "true" : "false"} and (numFloors >= 6)
    local setbackFloor = math.max(4, math.floor(numFloors * 0.65))
    local setbackInset = hasSetback and 3.0 or 0
    local upperH_Total = (numFloors - 1) * upperH

    -- Cuerpo de pisos estándar
    if not hasSetback then
        makePart("Core_Upper_Body", Vector3.new(w, upperH_Total, d),
            CFrame.new(cx, cy + groundH + upperH_Total / 2, cz), colFacade, matFacade, true)
    else
        local hLower = (setbackFloor - 1) * upperH
        local hUpper = (numFloors - setbackFloor) * upperH
        makePart("Core_Lower_Shaft", Vector3.new(w, hLower, d),
            CFrame.new(cx, cy + groundH + hLower / 2, cz), colFacade, matFacade, true)
        makePart("Core_Upper_Shaft", Vector3.new(w - setbackInset * 2, hUpper, d - setbackInset * 2),
            CFrame.new(cx, cy + groundH + hLower + hUpper / 2, cz), colFacade, matFacade, true)

        -- Terraza del retranqueo con barandilla perimetral
        local terraceY = cy + groundH + hLower
        makePart("Setback_Terrace_Deck", Vector3.new(w + 0.4, 0.6, d + 0.4),
            CFrame.new(cx, terraceY + 0.3, cz), colRoof, Enum.Material.Concrete, true)
        -- Barandilla de la terraza
        local rH = 3.2
        makePart("Railing_Setback_F", Vector3.new(w, rH, 0.4), CFrame.new(cx, terraceY + rH / 2 + 0.6, cz + halfD - 0.2), colBalcony, matBalcony, true)
        makePart("Railing_Setback_B", Vector3.new(w, rH, 0.4), CFrame.new(cx, terraceY + rH / 2 + 0.6, cz - halfD + 0.2), colBalcony, matBalcony, true)
        makePart("Railing_Setback_L", Vector3.new(0.4, rH, d), CFrame.new(cx - halfW + 0.2, terraceY + rH / 2 + 0.6, cz), colBalcony, matBalcony, true)
        makePart("Railing_Setback_R", Vector3.new(0.4, rH, d), CFrame.new(cx + halfW - 0.2, terraceY + rH / 2 + 0.6, cz), colBalcony, matBalcony, true)
    end

    -- 4. PILASTRAS EN RELIEVE 3D EN LAS 4 ESQUINAS (Estructura y ritmo vertical)
    local pilThick = 1.4
    local pY = cy + totalH / 2
    makePart("Pillar_NW", Vector3.new(pilThick, totalH, pilThick), CFrame.new(cx - halfW, pY, cz - halfD), colPillar, matPillar, false, true)
    makePart("Pillar_NE", Vector3.new(pilThick, totalH, pilThick), CFrame.new(cx + halfW, pY, cz - halfD), colPillar, matPillar, false, true)
    makePart("Pillar_SW", Vector3.new(pilThick, totalH, pilThick), CFrame.new(cx - halfW, pY, cz + halfD), colPillar, matPillar, false, true)
    makePart("Pillar_SE", Vector3.new(pilThick, totalH, pilThick), CFrame.new(cx + halfW, pY, cz + halfD), colPillar, matPillar, false, true)

    -- 5. PORTAL DE ENTRADA PRINCIPAL REMETIDO Y PUERTAS CON ACCESO (Fachada Sur +Z)
    local doorW = 8.0
    local doorH = 9.5
    local alcoveDepth = 2.4
    local frontZ = cz + halfD + 0.4

    -- Hueco/Hornacina remetida del portal (alcove)
    local portalFrameW = doorW + 2.0
    local portalFrameH = doorH + 1.8
    local portalCF = CFrame.new(cx, cy + portalFrameH / 2, frontZ - alcoveDepth / 2)

    -- Marco exterior monumental de piedra/metal
    makePart("Portal_Header", Vector3.new(portalFrameW, 1.4, alcoveDepth + 0.6),
        CFrame.new(cx, cy + doorH + 0.7, frontZ - alcoveDepth / 2), colPillar, matPillar, true)
    makePart("Portal_Jamb_L", Vector3.new(1.0, doorH, alcoveDepth + 0.6),
        CFrame.new(cx - doorW / 2 - 0.5, cy + doorH / 2, frontZ - alcoveDepth / 2), colPillar, matPillar, true)
    makePart("Portal_Jamb_R", Vector3.new(1.0, doorH, alcoveDepth + 0.6),
        CFrame.new(cx + doorW / 2 + 0.5, cy + doorH / 2, frontZ - alcoveDepth / 2), colPillar, matPillar, true)

    -- Techo del portal con downlight integrado cálido
    local alcoveCeiling = makePart("Portal_Soffit", Vector3.new(doorW, 0.4, alcoveDepth),
        CFrame.new(cx, cy + doorH - 0.2, frontZ - alcoveDepth / 2), colPillar, matPillar, false, true)
    local lobbyDownlight = Instance.new("PointLight", alcoveCeiling)
    lobbyDownlight.Color = Color3.fromRGB(255, 235, 190)
    lobbyDownlight.Range = 18
    lobbyDownlight.Brightness = 1.8
    lobbyDownlight.Shadows = true

    -- Escalón / Umbral de entrada de granito pulido
    makePart("Portal_Threshold", Vector3.new(doorW + 0.6, 0.4, alcoveDepth + 0.8),
        CFrame.new(cx, cy + 0.2, frontZ - alcoveDepth / 2 + 0.2), colBase, matBase, true)

    -- DOBLE PUERTA DE ACCESO BATIENTE COMERCIAL (Hoja Izquierda y Derecha)
    local leafW = (doorW - 0.6) / 2
    local leafH = 7.5
    local doorSurfaceZ = frontZ - alcoveDepth + 0.2

    -- Puerta Izquierda
    local doorL = makePart("Door_Leaf_L", Vector3.new(leafW, leafH, 0.4),
        CFrame.new(cx - leafW / 2 - 0.15, cy + leafH / 2 + 0.3, doorSurfaceZ), colDoor, matDoor, true)
    -- Cristal insertado en puerta izquierda
    local glassL = makePart("Door_Glass_L", Vector3.new(leafW - 0.8, leafH - 1.2, 0.2),
        CFrame.new(cx - leafW / 2 - 0.15, cy + leafH / 2 + 0.3, doorSurfaceZ), colGlass, matGlass, false, true)
    glassL.Transparency = 0.35
    glassL.Reflectance = 0.4

    -- Puerta Derecha
    local doorR = makePart("Door_Leaf_R", Vector3.new(leafW, leafH, 0.4),
        CFrame.new(cx + leafW / 2 + 0.15, cy + leafH / 2 + 0.3, doorSurfaceZ), colDoor, matDoor, true)
    local glassR = makePart("Door_Glass_R", Vector3.new(leafW - 0.8, leafH - 1.2, 0.2),
        CFrame.new(cx + leafW / 2 + 0.15, cy + leafH / 2 + 0.3, doorSurfaceZ), colGlass, matGlass, false, true)
    glassR.Transparency = 0.35
    glassR.Reflectance = 0.4

    -- Manillones cilíndricos verticales de diseño arquitectónico
    local handleH = 2.4
    local handleCF_L = CFrame.new(cx - 0.6, cy + 3.8, doorSurfaceZ + 0.3) * CFrame.Angles(0, 0, math.rad(90))
    local handleCF_R = CFrame.new(cx + 0.6, cy + 3.8, doorSurfaceZ + 0.3) * CFrame.Angles(0, 0, math.rad(90))
    makeCylinder("Door_Handle_L", Vector3.new(0.25, handleH, 0.25), handleCF_L, colHandle, Enum.Material.Metal, false)
    makeCylinder("Door_Handle_R", Vector3.new(0.25, handleH, 0.25), handleCF_R, colHandle, Enum.Material.Metal, false)

    -- Ventanal superior del portal (Transom window / Tarja de cristal)
    local transomH = doorH - leafH - 0.5
    local transomPart = makePart("Door_Transom", Vector3.new(doorW - 0.4, transomH, 0.3),
        CFrame.new(cx, cy + leafH + transomH / 2 + 0.4, doorSurfaceZ), colGlass, matGlass, false, true)
    transomPart.Transparency = 0.35
    transomPart.Reflectance = 0.45

    -- Marquesina / Baldaquino suspendido sobre la entrada con tirantes de acero
    local canopyDepth = 5.0
    local canopyW = doorW + 3.0
    local canopyY = cy + doorH + 1.2
    local canopyZ = frontZ + canopyDepth / 2
    local canopySlab = makePart("Entrance_Canopy", Vector3.new(canopyW, 0.6, canopyDepth),
        CFrame.new(cx, canopyY, canopyZ), colPillar, matPillar, true)

    -- Focos embutidos bajo la marquesina
    local canopyLight = Instance.new("PointLight", canopySlab)
    canopyLight.Color = Color3.fromRGB(255, 240, 210)
    canopyLight.Range = 16
    canopyLight.Brightness = 1.4

    -- Tirantes de acero a 45° que sostienen la marquesina
    local rodLen = 5.5
    local rod1 = makePart("Canopy_Rod_L", Vector3.new(0.2, rodLen, 0.2),
        CFrame.new(cx - canopyW / 2 + 0.6, canopyY + 1.8, frontZ + canopyDepth * 0.4) * CFrame.Angles(math.rad(40), 0, 0), colPillar, Enum.Material.Metal, false, true)
    local rod2 = makePart("Canopy_Rod_R", Vector3.new(0.2, rodLen, 0.2),
        CFrame.new(cx + canopyW / 2 - 0.6, canopyY + 1.8, frontZ + canopyDepth * 0.4) * CFrame.Angles(math.rad(40), 0, 0), colPillar, Enum.Material.Metal, false, true)

    -- 6. ESCAPARATES COMERCIALES A LOS LADOS DEL PORTAL (Fachada Sur)
    local availSideW = (w - portalFrameW - 5) / 2
    if availSideW > 6 then
        local leftShopX = cx - halfW + 2 + availSideW / 2
        local rightShopX = cx + halfW - 2 - availSideW / 2
        local shopH = 8.5
        local shopY = cy + shopH / 2 + 1.4

        -- Escaparate Izquierdo con zócalo bajo (knee-wall)
        makePart("Shop_Kneewall_L", Vector3.new(availSideW, 1.4, 0.6), CFrame.new(leftShopX, cy + 0.7, frontZ), colBase, matBase, true)
        local glassShopL = makePart("Showcase_Glass_L", Vector3.new(availSideW, shopH - 1.4, 0.4),
            CFrame.new(leftShopX, shopY + 0.7, frontZ), colGlass, matGlass, false, true)
        glassShopL.Transparency = 0.30
        glassShopL.Reflectance = 0.50

        -- Escaparate Derecho con zócalo bajo
        makePart("Shop_Kneewall_R", Vector3.new(availSideW, 1.4, 0.6), CFrame.new(rightShopX, cy + 0.7, frontZ), colBase, matBase, true)
        local glassShopR = makePart("Showcase_Glass_R", Vector3.new(availSideW, shopH - 1.4, 0.4),
            CFrame.new(rightShopX, shopY + 0.7, frontZ), colGlass, matGlass, false, true)
        glassShopR.Transparency = 0.30
        glassShopR.Reflectance = 0.50

        -- Parteluces (mullions metálicos) que enmarcan los escaparates
        makePart("Mullion_Shop_L", Vector3.new(0.3, shopH - 1.4, 0.5), CFrame.new(leftShopX, shopY + 0.7, frontZ + 0.1), colPillar, matPillar, false, true)
        makePart("Mullion_Shop_R", Vector3.new(0.3, shopH - 1.4, 0.5), CFrame.new(rightShopX, shopY + 0.7, frontZ + 0.1), colPillar, matPillar, false, true)

        -- Toldos a 45° con textura sobre los escaparates
        local awnDepth = 3.6
        local awnH = 2.4
        local awnY = cy + shopH + 1.8
        local awnZ = frontZ + awnDepth / 2

        makeWedge("Awning_Left", Vector3.new(availSideW, awnH, awnDepth),
            CFrame.new(leftShopX, awnY, awnZ) * CFrame.Angles(0, math.rad(180), 0), colAwning, matAwning)
        makeWedge("Awning_Right", Vector3.new(availSideW, awnH, awnDepth),
            CFrame.new(rightShopX, awnY, awnZ) * CFrame.Angles(0, math.rad(180), 0), colAwning, matAwning)

        -- Rótulos comerciales 3D con nombre de tienda y retroiluminación Neon
        local signH = 1.8
        local signY = awnY + 1.8
        local signBoard = makePart("Storefront_Sign_L", Vector3.new(availSideW - 1, signH, 0.6),
            CFrame.new(leftShopX, signY, frontZ + 0.2), Color3.fromRGB(30, 32, 38), Enum.Material.SmoothPlastic, false, true)

        -- Letras / banda de Neón con el nombre del comercio
        local neonStrip = makePart("Sign_Glow_L", Vector3.new(availSideW - 2, 0.8, 0.2),
            CFrame.new(leftShopX, signY, frontZ + 0.55), Color3.fromRGB(${signGlow[0]}, ${signGlow[1]}, ${signGlow[2]}), Enum.Material.Neon, false, true)
        local signLight = Instance.new("PointLight", neonStrip)
        signLight.Color = Color3.fromRGB(${signGlow[0]}, ${signGlow[1]}, ${signGlow[2]})
        signLight.Range = 14
        signLight.Brightness = 1.2

        local signBoardR = makePart("Storefront_Sign_R", Vector3.new(availSideW - 1, signH, 0.6),
            CFrame.new(rightShopX, signY, frontZ + 0.2), Color3.fromRGB(30, 32, 38), Enum.Material.SmoothPlastic, false, true)
        local neonStripR = makePart("Sign_Glow_R", Vector3.new(availSideW - 2, 0.8, 0.2),
            CFrame.new(rightShopX, signY, frontZ + 0.55), Color3.fromRGB(255, 235, 180), Enum.Material.Neon, false, true)
        local signLightR = Instance.new("PointLight", neonStripR)
        signLightR.Color = Color3.fromRGB(255, 235, 180)
        signLightR.Range = 14
        signLightR.Brightness = 1.0

        ${
          hasSidewalkDining
            ? `
        -- VELADORES Y TERRAZA EXTERIOR (Bistro cafe tables y maceteros florales)
        local tableZ = frontZ + awnDepth + 2.0
        -- Mesa 1 y sillas frente al escaparate izquierdo
        local tTop1 = makePart("Cafe_TableTop_1", Vector3.new(2.8, 0.2, 2.8), CFrame.new(leftShopX, cy + 2.6, tableZ), Color3.fromRGB(50, 45, 40), Enum.Material.WoodPlanks, true)
        tTop1.Shape = Enum.PartType.Cylinder
        tTop1.CFrame = CFrame.new(leftShopX, cy + 2.6, tableZ) * CFrame.Angles(0, 0, math.rad(90))
        makeCylinder("Cafe_TableLeg_1", Vector3.new(0.3, 2.5, 0.3), CFrame.new(leftShopX, cy + 1.3, tableZ) * CFrame.Angles(0, 0, math.rad(90)), Color3.fromRGB(35, 38, 42), Enum.Material.Metal, true)

        -- 2 Sillas de forja
        makePart("Cafe_Chair_1A", Vector3.new(1.6, 1.6, 1.6), CFrame.new(leftShopX - 1.8, cy + 0.8, tableZ), Color3.fromRGB(40, 44, 50), Enum.Material.Metal, true)
        makePart("Cafe_Chair_1B", Vector3.new(1.6, 1.6, 1.6), CFrame.new(leftShopX + 1.8, cy + 0.8, tableZ), Color3.fromRGB(40, 44, 50), Enum.Material.Metal, true)

        -- Jardinera con arbustos ornamentales
        local planter = makePart("Planter_Box", Vector3.new(availSideW * 0.8, 1.6, 1.6), CFrame.new(rightShopX, cy + 0.8, tableZ), Color3.fromRGB(65, 50, 38), Enum.Material.WoodPlanks, true)
        local shrub = makePart("Planter_Shrub", Vector3.new(availSideW * 0.75, 1.8, 1.4), CFrame.new(rightShopX, cy + 2.1, tableZ), Color3.fromRGB(55, 120, 50), Enum.Material.Grass, false)
        `
            : ""
        }
    end

    -- 7. PUERTA TRASERA DE SERVICIO (Fachada Norte -Z)
    local backZ = cz - halfD - 0.4
    local srvW = 4.2
    local srvH = 7.8
    -- Marco de la puerta trasera
    makePart("Service_Door_Frame", Vector3.new(srvW + 0.8, srvH + 0.6, 0.6),
        CFrame.new(cx, cy + srvH / 2 + 0.3, backZ + 0.2), colPillar, matPillar, true)
    -- Hoja metálica de servicio
    makePart("Service_Door_Leaf", Vector3.new(srvW, srvH, 0.3),
        CFrame.new(cx, cy + srvH / 2 + 0.3, backZ), Color3.fromRGB(60, 65, 72), Enum.Material.DiamondPlate, true)
    -- Manilla de palanca
    makePart("Service_Door_Handle", Vector3.new(0.6, 0.2, 0.4),
        CFrame.new(cx + srvW / 2 - 0.6, cy + 3.6, backZ - 0.2), Color3.fromRGB(220, 180, 45), Enum.Material.Metal, false, true)
    -- Farol de seguridad con rejilla protectora
    local srvLightPart = makePart("Service_Security_Light", Vector3.new(1.0, 0.8, 0.8),
        CFrame.new(cx, cy + srvH + 1.2, backZ - 0.3), Color3.fromRGB(255, 230, 160), Enum.Material.Neon, false, true)
    local srvLight = Instance.new("PointLight", srvLightPart)
    srvLight.Color = Color3.fromRGB(255, 220, 150)
    srvLight.Range = 16
    srvLight.Brightness = 1.4

    -- 8. PISOS SUPERIORES: VENTANAS 3D MODULARES EN LAS 4 FACHADAS
    local winW = 3.6
    local winH = 5.4
    local sillProtrude = 0.6
    local lintelProtrude = 0.4

    -- Función auxiliar para construir ventana con alféizar, parteluz e iluminación variable
    local function spawnWindowModule(namePrefix, cfCenter, normalAngleY, isBalconyFloor)
        local baseCF = cfCenter * CFrame.Angles(0, normalAngleY, 0)

        -- 1. Alféizar inferior sobresaliente
        local sillCF = baseCF * CFrame.new(0, -winH / 2 - 0.2, sillProtrude / 2)
        makePart(namePrefix .. "_Sill", Vector3.new(winW + 0.8, 0.4, sillProtrude), sillCF, colCornice, matCornice, false, true)

        -- 2. Dintel superior decorativo
        local lintelCF = baseCF * CFrame.new(0, winH / 2 + 0.3, lintelProtrude / 2)
        makePart(namePrefix .. "_Lintel", Vector3.new(winW + 0.8, 0.6, lintelProtrude), lintelCF, colCornice, matCornice, false, true)

        -- 3. Marco perimetral
        local frameCF = baseCF * CFrame.new(0, 0, 0.1)
        makePart(namePrefix .. "_Frame", Vector3.new(winW, winH, 0.3), frameCF, colPillar, matPillar, false, true)

        -- 4. Parteluz vertical central (mullion) y travesaño horizontal (transom)
        local mullionCF = baseCF * CFrame.new(0, 0, 0.16)
        makePart(namePrefix .. "_Mullion", Vector3.new(0.25, winH - 0.4, 0.2), mullionCF, colPillar, matPillar, false, true)
        local transomCF = baseCF * CFrame.new(0, winH * 0.25, 0.16)
        makePart(namePrefix .. "_Transom", Vector3.new(winW - 0.4, 0.25, 0.2), transomCF, colPillar, matPillar, false, true)

        -- 5. Panel de cristal con iluminación interior procedural variada
        local glassCF = baseCF * CFrame.new(0, 0, -0.05)
        local glassP = makePart(namePrefix .. "_Glass", Vector3.new(winW - 0.5, winH - 0.5, 0.2), glassCF, colGlass, matGlass, false, true)
        glassP.Transparency = 0.32
        glassP.Reflectance = 0.45

        -- Iluminación dinámica realista
        local hash = (cfCenter.X * 17 + cfCenter.Y * 31 + cfCenter.Z * 43) % 100
        if hash < 45 then
            -- Luz cálida residencial / oficina
            glassP.Material = Enum.Material.Neon
            glassP.Color = Color3.fromRGB(${styleConfig.warmInteriorColor[0]}, ${styleConfig.warmInteriorColor[1]}, ${styleConfig.warmInteriorColor[2]})
            glassP.Transparency = 0.1
            local winLight = Instance.new("PointLight", glassP)
            winLight.Color = glassP.Color
            winLight.Range = 12
            winLight.Brightness = 0.8
        elseif hash < 70 then
            -- Luz fría LED corporativa
            glassP.Material = Enum.Material.Neon
            glassP.Color = Color3.fromRGB(${styleConfig.coolInteriorColor[0]}, ${styleConfig.coolInteriorColor[1]}, ${styleConfig.coolInteriorColor[2]})
            glassP.Transparency = 0.12
            local winLight = Instance.new("PointLight", glassP)
            winLight.Color = glassP.Color
            winLight.Range = 10
            winLight.Brightness = 0.7
        else
            -- Habitación apagada (fondo oscuro)
            glassP.Color = Color3.fromRGB(30, 35, 45)
            glassP.Transparency = 0.25
        end

        -- Si es balcón, generar losa y barandilla
        if isBalconyFloor then
            local bDepth = 3.2
            local bWidth = winW + 1.6
            local slabCF = baseCF * CFrame.new(0, -winH / 2 - 0.4, bDepth / 2)
            makePart(namePrefix .. "_Balcony_Slab", Vector3.new(bWidth, 0.6, bDepth), slabCF, colCornice, matCornice, true)

            -- Barandilla frontal y laterales
            local bRailH = 3.2
            local rFrontCF = baseCF * CFrame.new(0, -winH / 2 + bRailH / 2 - 0.1, bDepth)
            makePart(namePrefix .. "_Railing_F", Vector3.new(bWidth, bRailH, 0.3), rFrontCF, colBalcony, matBalcony, true)
            local rLeftCF = baseCF * CFrame.new(-bWidth / 2 + 0.15, -winH / 2 + bRailH / 2 - 0.1, bDepth / 2)
            makePart(namePrefix .. "_Railing_L", Vector3.new(0.3, bRailH, bDepth), rLeftCF, colBalcony, matBalcony, true)
            local rRightCF = baseCF * CFrame.new(bWidth / 2 - 0.15, -winH / 2 + bRailH / 2 - 0.1, bDepth / 2)
            makePart(namePrefix .. "_Railing_R", Vector3.new(0.3, bRailH, bDepth), rRightCF, colBalcony, matBalcony, true)
        end
    end

    -- Bucle por cada piso superior
    for fl = 1, numFloors - 1 do
        local flBaseY = cy + groundH + (fl - 1) * upperH
        local flCenterY = flBaseY + upperH / 2

        -- Cornisa horizontal perimetral continua entre pisos
        makePart("Cornice_Belt_Fl_" .. fl, Vector3.new(w + 1.2, 0.7, d + 1.2),
            CFrame.new(cx, flBaseY + upperH, cz), colCornice, matCornice, false, true)

        local hasBalconyThisFloor = ${enableBalconies ? "true" : "false"} and (fl % 2 == 1) and (fl < numFloors - 1)

        -- 8A. FACHADA FRONTAL SUR (+Z)
        local numWinX = math.max(2, math.floor((w - 8) / 8))
        local stepX = (w - 6) / numWinX
        for wx = 1, numWinX do
            local winPosX = cx - halfW + 3 + (wx - 0.5) * stepX
            local isBalc = hasBalconyThisFloor and (wx == 1 or wx == numWinX)
            spawnWindowModule("Win_Front_" .. fl .. "_" .. wx,
                CFrame.new(winPosX, flCenterY, cz + halfD), 0, isBalc)
        end

        -- 8B. FACHADA TRASERA NORTE (-Z)
        for wx = 1, numWinX do
            local winPosX = cx - halfW + 3 + (wx - 0.5) * stepX
            spawnWindowModule("Win_Back_" .. fl .. "_" .. wx,
                CFrame.new(winPosX, flCenterY, cz - halfD), math.rad(180), false)

            -- Compresores de A/C exteriores bajo ventanas en la fachada trasera
            if (fl + wx) % 2 == 0 then
                local acCF = CFrame.new(winPosX + 1.0, flCenterY - winH / 2 - 1.2, cz - halfD - 1.2)
                makePart("AC_Unit_" .. fl .. "_" .. wx, Vector3.new(2.4, 1.8, 1.6), acCF, Color3.fromRGB(180, 185, 190), Enum.Material.Metal, false, true)
                -- Rejilla del ventilador
                local fanCyl = makeCylinder("AC_Fan_" .. fl .. "_" .. wx, Vector3.new(1.2, 0.2, 1.2), acCF * CFrame.new(0, 0, -0.85) * CFrame.Angles(0, 0, math.rad(90)), Color3.fromRGB(40, 44, 50), Enum.Material.Metal, false)
            end
        end

        -- 8C. FACHADA OESTE (-X)
        local numWinZ = math.max(2, math.floor((d - 8) / 8))
        local stepZ = (d - 6) / numWinZ
        for wz = 1, numWinZ do
            local winPosZ = cz - halfD + 3 + (wz - 0.5) * stepZ
            spawnWindowModule("Win_West_" .. fl .. "_" .. wz,
                CFrame.new(cx - halfW, flCenterY, winPosZ), math.rad(-90), false)
        end

        -- 8D. FACHADA ESTE (+X)
        for wz = 1, numWinZ do
            local winPosZ = cz - halfD + 3 + (wz - 0.5) * stepZ
            spawnWindowModule("Win_East_" .. fl .. "_" .. wz,
                CFrame.new(cx + halfW, flCenterY, winPosZ), math.rad(90), false)
        end

        ${
          enableFireEscapes
            ? `
        -- ESCALERA DE INCENDIOS DE ACERO (Fachada Lateral Oeste o Trasera)
        local feX = cx - halfW - 1.8
        local feZ = cz - halfD + 7
        -- Plataforma de escape
        makePart("FireEscape_Plat_" .. fl, Vector3.new(3.6, 0.4, 7), CFrame.new(feX, flBaseY + 0.2, feZ), Color3.fromRGB(35, 38, 42), Enum.Material.DiamondPlate, true)
        -- Barandilla de seguridad
        makePart("FireEscape_Rail_O_" .. fl, Vector3.new(0.3, 3.4, 7), CFrame.new(feX - 1.7, flBaseY + 1.9, feZ), Color3.fromRGB(35, 38, 42), Enum.Material.Metal, true)
        makePart("FireEscape_Rail_S_" .. fl, Vector3.new(3.6, 3.4, 0.3), CFrame.new(feX, flBaseY + 1.9, feZ + 3.4), Color3.fromRGB(35, 38, 42), Enum.Material.Metal, true)
        makePart("FireEscape_Rail_N_" .. fl, Vector3.new(3.6, 3.4, 0.3), CFrame.new(feX, flBaseY + 1.9, feZ - 3.4), Color3.fromRGB(35, 38, 42), Enum.Material.Metal, true)
        -- Tramo de escalera diagonal al siguiente piso
        if fl < numFloors - 1 then
            local stairLen = math.sqrt(upperH * upperH + 6 * 6)
            local angle = math.deg(math.atan2(upperH, 6))
            local stairCF = CFrame.new(feX, flBaseY + upperH / 2, feZ) * CFrame.Angles(0, 0, math.rad(-angle))
            makePart("FireEscape_Stair_" .. fl, Vector3.new(2.8, 0.4, 6), CFrame.new(feX, flBaseY + upperH / 2, feZ), Color3.fromRGB(35, 38, 42), Enum.Material.DiamondPlate, true)
        end
        `
            : ""
        }
    end

    -- 9. AZOTEA HABITABLE Y PARAPETO TÁCTICO CON ALBARDILLAS
    local roofY = cy + totalH
    -- Losa de suelo de azotea con pendiente técnica
    makePart("Roof_Slab", Vector3.new(w + 0.4, 1.4, d + 0.4), CFrame.new(cx, roofY - 0.7, cz), colRoof, Enum.Material.Concrete, true)

    -- Parapeto perimetral (cobertura balística de 2.6 studs para tiroteos tácticos)
    local paraH = 2.6
    local paraThick = 1.2
    local paraCenterY = roofY + paraH / 2
    makePart("Parapet_N", Vector3.new(w + 1.2, paraH, paraThick), CFrame.new(cx, paraCenterY, cz - halfD + paraThick / 2), colParapet, matParapet, true)
    makePart("Parapet_S", Vector3.new(w + 1.2, paraH, paraThick), CFrame.new(cx, paraCenterY, cz + halfD - paraThick / 2), colParapet, matParapet, true)
    makePart("Parapet_W", Vector3.new(paraThick, paraH, d + 1.2), CFrame.new(cx - halfW + paraThick / 2, paraCenterY, cz), colParapet, matParapet, true)
    makePart("Parapet_E", Vector3.new(paraThick, paraH, d + 1.2), CFrame.new(cx + halfW - paraThick / 2, paraCenterY, cz), colParapet, matParapet, true)

    -- Albardilla / Remate superior de piedra en el parapeto (Coping)
    local copingH = 0.5
    local copingThick = paraThick + 0.4
    makePart("Coping_N", Vector3.new(w + 1.6, copingH, copingThick), CFrame.new(cx, roofY + paraH + copingH / 2, cz - halfD + paraThick / 2), colCornice, matCornice, false, true)
    makePart("Coping_S", Vector3.new(w + 1.6, copingH, copingThick), CFrame.new(cx, roofY + paraH + copingH / 2, cz + halfD - paraThick / 2), colCornice, matCornice, false, true)
    makePart("Coping_W", Vector3.new(copingThick, copingH, d + 1.6), CFrame.new(cx - halfW + paraThick / 2, roofY + paraH + copingH / 2, cz), colCornice, matCornice, false, true)
    makePart("Coping_E", Vector3.new(copingThick, copingH, d + 1.6), CFrame.new(cx + halfW - paraThick / 2, roofY + paraH + copingH / 2, cz), colCornice, matCornice, false, true)

    ${
      hasRoofProps
        ? `
    -- 10. EQUIPAMIENTO TÉCNICO Y MAQUINARIA DE AZOTEA (AAA Rooftop Dressing)
    -- 10A. Caseta de acceso al ascensor y escaleras (Elevator Penthouse)
    local pentW = 12
    local pentD = 14
    local pentH = 9.5
    local pentX = cx - halfW + pentW / 2 + 3.5
    local pentZ = cz - halfD + pentD / 2 + 3.5
    local pentY = roofY + pentH / 2

    makePart("Elevator_Penthouse", Vector3.new(pentW, pentH, pentD), CFrame.new(pentX, pentY, pentZ), colCornice, Enum.Material.Concrete, true)
    -- Visera/Cornisa de la caseta
    makePart("Penthouse_Roof_Trim", Vector3.new(pentW + 1.0, 0.6, pentD + 1.0), CFrame.new(pentX, roofY + pentH + 0.3, pentZ), colPillar, matPillar, false, true)

    -- Puerta técnica de acceso a la azotea con manija
    local pDoorW = 3.6
    local pDoorH = 7.2
    local pDoorZ = pentZ + pentD / 2 + 0.1
    makePart("Penthouse_Door_Frame", Vector3.new(pDoorW + 0.6, pDoorH + 0.4, 0.4), CFrame.new(pentX, roofY + pDoorH / 2 + 0.2, pDoorZ), colPillar, matPillar, true)
    makePart("Penthouse_Door_Leaf", Vector3.new(pDoorW, pDoorH, 0.3), CFrame.new(pentX, roofY + pDoorH / 2 + 0.2, pDoorZ + 0.05), Color3.fromRGB(55, 58, 65), Enum.Material.Metal, true)
    makePart("Penthouse_Door_Handle", Vector3.new(0.5, 0.2, 0.3), CFrame.new(pentX + pDoorW / 2 - 0.5, roofY + 3.6, pDoorZ + 0.25), Color3.fromRGB(220, 180, 50), Enum.Material.Metal, false, true)
    -- Luz sobre la puerta del penthouse
    local pLight = makePart("Penthouse_Light", Vector3.new(0.8, 0.8, 0.6), CFrame.new(pentX, roofY + pDoorH + 1.0, pDoorZ + 0.2), Color3.fromRGB(255, 240, 190), Enum.Material.Neon, false, true)
    local pPl = Instance.new("PointLight", pLight)
    pPl.Color = Color3.fromRGB(255, 235, 180)
    pPl.Range = 14
    pPl.Brightness = 1.2

    -- 10B. Unidad de climatización industrial HVAC doble ventilador
    local hvacX = cx + halfW - 9
    local hvacZ = cz + halfD - 9
    local hvacY = roofY + 2.2
    makePart("HVAC_Main_Body", Vector3.new(8.5, 4.4, 6.5), CFrame.new(hvacX, hvacY, hvacZ), Color3.fromRGB(155, 160, 168), Enum.Material.DiamondPlate, true)
    -- Rejillas de ventilación y dos ventiladores circulares
    local fanCF1 = CFrame.new(hvacX - 2.0, roofY + 4.6, hvacZ) * CFrame.Angles(0, 0, math.rad(90))
    local fanCF2 = CFrame.new(hvacX + 2.0, roofY + 4.6, hvacZ) * CFrame.Angles(0, 0, math.rad(90))
    makeCylinder("HVAC_Fan_1", Vector3.new(3.0, 0.4, 3.0), fanCF1, Color3.fromRGB(35, 38, 44), Enum.Material.Metal, false)
    makeCylinder("HVAC_Fan_2", Vector3.new(3.0, 0.4, 3.0), fanCF2, Color3.fromRGB(35, 38, 44), Enum.Material.Metal, false)
    -- Tubería de conducto que conecta con el edificio
    makePart("HVAC_Duct_Pipe", Vector3.new(1.8, 1.8, 4.0), CFrame.new(hvacX, roofY + 1.5, hvacZ - 4.5), Color3.fromRGB(90, 95, 102), Enum.Material.Metal, true)

    -- 10C. Tanque de agua cilíndrico sobre zancos de acero (si dimensiones >= 28)
    if w >= 28 and d >= 28 then
        local tankX = cx + halfW - 9
        local tankZ = cz - halfD + 9
        local stiltH = 6.0

        -- 4 zancos de acero estructural
        makePart("Stilt_1", Vector3.new(0.6, stiltH, 0.6), CFrame.new(tankX - 2.8, roofY + stiltH / 2, tankZ - 2.8), Color3.fromRGB(45, 48, 54), Enum.Material.Metal, false, true)
        makePart("Stilt_2", Vector3.new(0.6, stiltH, 0.6), CFrame.new(tankX + 2.8, roofY + stiltH / 2, tankZ - 2.8), Color3.fromRGB(45, 48, 54), Enum.Material.Metal, false, true)
        makePart("Stilt_3", Vector3.new(0.6, stiltH, 0.6), CFrame.new(tankX - 2.8, roofY + stiltH / 2, tankZ + 2.8), Color3.fromRGB(45, 48, 54), Enum.Material.Metal, false, true)
        makePart("Stilt_4", Vector3.new(0.6, stiltH, 0.6), CFrame.new(tankX + 2.8, roofY + stiltH / 2, tankZ + 2.8), Color3.fromRGB(45, 48, 54), Enum.Material.Metal, false, true)
        -- Plataforma de soporte
        makePart("Tank_Platform", Vector3.new(7.2, 0.6, 7.2), CFrame.new(tankX, roofY + stiltH, tankZ), Color3.fromRGB(50, 54, 60), Enum.Material.Metal, true)

        -- Cuerpo cilíndrico del tanque de madera/metal
        local tankCF = CFrame.new(tankX, roofY + stiltH + 4.2, tankZ) * CFrame.Angles(0, 0, math.rad(90))
        makeCylinder("Water_Tank_Cylinder", Vector3.new(7.4, 7.8, 7.4), tankCF, Color3.fromRGB(85, 65, 48), Enum.Material.WoodPlanks, true)
        -- Tapa cónica de chapa metálica
        makeWedge("Tank_Roof_Cap", Vector3.new(7.0, 1.8, 3.5), CFrame.new(tankX, roofY + stiltH + 8.8, tankZ), Color3.fromRGB(55, 60, 68), Enum.Material.Metal)
    end

    -- 10D. Antena de telecomunicaciones de gran altura con baliza de navegación aeronáutica
    local antH = 22
    local antX = pentX + pentW / 2 + 3.0
    local antZ = pentZ
    makePart("Comm_Tower_Mast", Vector3.new(0.8, antH, 0.8), CFrame.new(antX, roofY + antH / 2, antZ), Color3.fromRGB(65, 70, 78), Enum.Material.Metal, false, true)
    -- Crucetas de la antena
    makePart("Comm_Cross_1", Vector3.new(4.0, 0.3, 0.3), CFrame.new(antX, roofY + antH * 0.7, antZ), Color3.fromRGB(70, 75, 82), Enum.Material.Metal, false, true)
    makePart("Comm_Cross_2", Vector3.new(2.4, 0.3, 0.3), CFrame.new(antX, roofY + antH * 0.88, antZ), Color3.fromRGB(70, 75, 82), Enum.Material.Metal, false, true)

    -- Baliza roja estroboscópica en la cúspide
    local beaconBall = makePart("Aviation_Beacon", Vector3.new(1.4, 1.4, 1.4), CFrame.new(antX, roofY + antH + 0.7, antZ), Color3.fromRGB(255, 30, 30), Enum.Material.Neon, false, true)
    beaconBall.Shape = Enum.PartType.Ball
    local bLight = Instance.new("PointLight", beaconBall)
    bLight.Color = Color3.fromRGB(255, 25, 25)
    bLight.Range = 24
    bLight.Brightness = 2.2
    `
        : ""
    }

    print(string.format("[DetailedBuilding AAA] ✅ '%s' (%s, %d pisos, %dx%d studs) generado con éxito en '%s'.", "${name}", "${style}", numFloors, w, d, "${parent}"))
end

buildArchitecturalBuilding()
`;
}
