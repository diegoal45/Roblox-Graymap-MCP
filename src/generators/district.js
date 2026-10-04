import { getStylePreset } from "./stylePresets.js";
import { snapVal } from "./grid.js";

/**
 * Generador Urbano Macro AAA Estilo GTA San Andreas:
 * Soporta distritos comerciales de alta densidad ("commercial_downtown")
 * y barrios residenciales suburbanos tipo Ganton / Grove Street ("residential_suburb"),
 * así como bulevares mixtos ("mixed_urban").
 *
 * Incluye:
 * - Parcelas residenciales con casas unifamiliares, tejados a dos aguas, porches, chimeneas,
 *   garajes adosados, entradas para coches (driveways), jardines con césped, buzones y vallas
 * - Bloques comerciales con chaflanes en esquina a 45°, portales con puertas reales,
 *   rótulos 3D iluminados, terrazas con veladores y callejones de servicio con contenedores
 * - Red de postes de madera con crucetas, transformadores y cables aéreos tendidos (estilo icónico GTA SA)
 * - Calzadas con asfalto, bordillos de granito, imbornales, tapas de alcantarilla y pasos de cebra
 */
export function generateDistrictLuau({
  name = "Downtown_District",
  center = [0, 0, 0],
  size = [240, 240], // [widthX, lengthZ]
  style = "modern_downtown",
  density = "high", // "high", "medium", "low", "mixed", "suburban"
  districtType = "commercial_downtown", // "commercial_downtown", "residential_suburb", "mixed_urban"
  streetWidth = 28,
  sidewalkWidth = 10,
  seed = 54321,
  hasFurniture = true,
  hasPowerLines = true,
  alignToTerrain = true,
  hasPlaza = true,
  parent = "City/Districts",
}) {
  const [cx, cy, cz] = [snapVal(center[0], 4), snapVal(center[1], 4), snapVal(center[2], 4)];
  const [totalW, totalL] = [Math.max(140, snapVal(size[0], 4)), Math.max(140, snapVal(size[1] || size[2] || 240, 4))];
  const sWidth = Math.max(20, snapVal(streetWidth, 4));
  const swWidth = Math.max(8, snapVal(sidewalkWidth, 2));
  const effectiveSeed = typeof seed === "number" ? seed : 54321;

  // Inferir tipo de distrito si density es suburban o low
  const effectiveDistrictType = (districtType === "residential_suburb" || density === "suburban" || density === "low")
    ? "residential_suburb"
    : (districtType === "mixed_urban" ? "mixed_urban" : "commercial_downtown");

  const styleConfig = getStylePreset(style);

  return `
local CollectionService = game:GetService("CollectionService")

local function buildCompleteDistrict()
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

    local districtModel = Instance.new("Model", current)
    districtModel.Name = "${name}"
    pcall(function() districtModel.LevelOfDetail = Enum.ModelLevelOfDetail.StreamingMesh end)

    local cx = ${cx}
    local cy = ${cy}
    local cz = ${cz}
    local totalW = ${totalW}
    local totalL = ${totalL}
    local streetW = ${sWidth}
    local swW = ${swWidth}
    local seedVal = ${effectiveSeed}
    local density = "${density.toLowerCase()}"
    local districtType = "${effectiveDistrictType}"

    ${
      alignToTerrain
        ? `
    -- 0. NIVELADO Y CIMENTACIÓN AUTOMÁTICA DE TERRENO
    pcall(function()
        local Terrain = workspace.Terrain
        local clCF = CFrame.new(cx, cy + 40, cz)
        local clSz = Vector3.new(totalW + 30, 80, totalL + 30)
        Terrain:FillBlock(clCF, clSz, Enum.Material.Air)

        local padCF = CFrame.new(cx, cy - 8, cz)
        local padSz = Vector3.new(totalW + 30, 16, totalL + 30)
        Terrain:FillBlock(padCF, padSz, Enum.Material.Concrete)
    end)
    `
        : ""
    }

    local function makePart(pName, sz, cf, col, mat, canCol, isDecor)
        local p = Instance.new("Part", districtModel)
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

    local function makeWedge(pName, sz, cf, col, mat)
        local w = Instance.new("WedgePart", districtModel)
        w.Name = pName
        w.Anchored = true
        w.CanCollide = true
        w.CanTouch = false
        w.Size = sz
        w.CFrame = cf
        w.Color = col
        w.Material = mat or Enum.Material.WoodPlanks
        return w
    end

    local function makeCylinder(pName, sz, cf, col, mat, canCol)
        local p = Instance.new("Part", districtModel)
        p.Name = pName
        p.Shape = Enum.PartType.Cylinder
        p.Anchored = true
        p.CanCollide = canCol ~= nil and canCol or false
        p.CanTouch = false
        p.CanQuery = false
        p.Size = sz
        p.CFrame = cf
        p.Color = col
        p.Material = mat or Enum.Material.Metal
        return p
    end

    -- 1. CALZADAS PERIMETRALES DE ASFALTO Y SEÑALIZACIÓN VIAL ESTILO GTA SA
    local colAsphalt = Color3.fromRGB(38, 40, 44)
    local colCurb = Color3.fromRGB(155, 160, 168)
    local colSidewalk = Color3.fromRGB(195, 198, 204)
    local colStripeYellow = Color3.fromRGB(240, 200, 45)
    local colStripeWhite = Color3.fromRGB(245, 248, 252)

    local halfW = totalW / 2
    local halfL = totalL / 2

    -- Calzadas Norte (-Z), Sur (+Z), Oeste (-X) y Este (+X)
    makePart("Road_North", Vector3.new(totalW, 1, streetW), CFrame.new(cx, cy - 0.5, cz - halfL + streetW / 2), colAsphalt, Enum.Material.Concrete)
    makePart("Road_South", Vector3.new(totalW, 1, streetW), CFrame.new(cx, cy - 0.5, cz + halfL - streetW / 2), colAsphalt, Enum.Material.Concrete)
    makePart("Road_West", Vector3.new(streetW, 1, totalL - streetW * 2), CFrame.new(cx - halfW + streetW / 2, cy - 0.5, cz), colAsphalt, Enum.Material.Concrete)
    makePart("Road_East", Vector3.new(streetW, 1, totalL - streetW * 2), CFrame.new(cx + halfW - streetW / 2, cy - 0.5, cz), colAsphalt, Enum.Material.Concrete)

    -- Doble línea amarilla continua / discontinua
    local stripeLen = 7
    local stripeGap = 6
    local numStripes = math.floor(totalW / (stripeLen + stripeGap))
    for s = 1, numStripes do
        local stX = cx - halfW + (s - 0.5) * (stripeLen + stripeGap)
        makePart("Stripe_S_" .. s, Vector3.new(stripeLen, 0.08, 0.8), CFrame.new(stX, cy + 0.04, cz + halfL - streetW / 2), colStripeYellow, Enum.Material.SmoothPlastic, false, true)
        makePart("Stripe_N_" .. s, Vector3.new(stripeLen, 0.08, 0.8), CFrame.new(stX, cy + 0.04, cz - halfL + streetW / 2), colStripeYellow, Enum.Material.SmoothPlastic, false, true)
    end

    -- Tapas de alcantarilla circulares (Manholes) en calzadas
    local manholeCF1 = CFrame.new(cx - 30, cy + 0.05, cz + halfL - streetW / 2) * CFrame.Angles(0, 0, math.rad(90))
    local manholeCF2 = CFrame.new(cx + 30, cy + 0.05, cz - halfL + streetW / 2) * CFrame.Angles(0, 0, math.rad(90))
    makeCylinder("Manhole_1", Vector3.new(3.2, 0.1, 3.2), manholeCF1, Color3.fromRGB(55, 60, 68), Enum.Material.DiamondPlate, false)
    makeCylinder("Manhole_2", Vector3.new(3.2, 0.1, 3.2), manholeCF2, Color3.fromRGB(55, 60, 68), Enum.Material.DiamondPlate, false)

    -- 2. ACERAS PEATONALES ELEVADAS (+0.65 studs con bordillos de granito)
    local curbH = 0.65
    local blockMinX = cx - halfW + streetW
    local blockMaxX = cx + halfW - streetW
    local blockMinZ = cz - halfL + streetW
    local blockMaxZ = cz + halfL - streetW
    local blockW = blockMaxX - blockMinX
    local blockL = blockMaxZ - blockMinZ

    -- Losa completa de la manzana
    local blockPlatformMat = (districtType == "residential_suburb") and Enum.Material.Grass or Enum.Material.Concrete
    local blockPlatformCol = (districtType == "residential_suburb") and Color3.fromRGB(60, 132, 50) or colSidewalk
    makePart("City_Block_Platform", Vector3.new(blockW, curbH, blockL), CFrame.new(cx, cy + curbH / 2, cz), blockPlatformCol, blockPlatformMat, true)

    -- Bordillos de granito exteriores
    local curbThick = 0.8
    makePart("Curb_North", Vector3.new(blockW, curbH + 0.1, curbThick), CFrame.new(cx, cy + curbH / 2, blockMinZ + curbThick / 2), colCurb, Enum.Material.Granite, true)
    makePart("Curb_South", Vector3.new(blockW, curbH + 0.1, curbThick), CFrame.new(cx, cy + curbH / 2, blockMaxZ - curbThick / 2), colCurb, Enum.Material.Granite, true)
    makePart("Curb_West", Vector3.new(curbThick, curbH + 0.1, blockL), CFrame.new(blockMinX + curbThick / 2, cy + curbH / 2, cz), colCurb, Enum.Material.Granite, true)
    makePart("Curb_East", Vector3.new(curbThick, curbH + 0.1, blockL), CFrame.new(blockMaxX - curbThick / 2, cy + curbH / 2, cz), colCurb, Enum.Material.Granite, true)

    -- Aceras perimetrales si es barrio residencial (cinturón de acera alrededor de las parcelas ajardinadas)
    if districtType == "residential_suburb" then
        makePart("Suburban_Sidewalk_S", Vector3.new(blockW, curbH + 0.05, swW), CFrame.new(cx, cy + (curbH + 0.05) / 2, blockMaxZ - swW / 2), colSidewalk, Enum.Material.Concrete, true)
        makePart("Suburban_Sidewalk_N", Vector3.new(blockW, curbH + 0.05, swW), CFrame.new(cx, cy + (curbH + 0.05) / 2, blockMinZ + swW / 2), colSidewalk, Enum.Material.Concrete, true)
        makePart("Suburban_Sidewalk_W", Vector3.new(swW, curbH + 0.05, blockL - swW * 2), CFrame.new(blockMinX + swW / 2, cy + (curbH + 0.05) / 2, cz), colSidewalk, Enum.Material.Concrete, true)
        makePart("Suburban_Sidewalk_E", Vector3.new(swW, curbH + 0.05, blockL - swW * 2), CFrame.new(blockMaxX - swW / 2, cy + (curbH + 0.05) / 2, cz), colSidewalk, Enum.Material.Concrete, true)
    end

    -- Pasos de cebra peatonales en las 4 esquinas
    local function spawnCrosswalk(centerCF, length, isHoriz)
        local numBars = 6
        local barW = 2.4
        local barGap = 1.6
        for b = 1, numBars do
            local offset = (b - (numBars + 1) / 2) * (barW + barGap)
            local cf = isHoriz and centerCF * CFrame.new(offset, 0.06, 0) or centerCF * CFrame.new(0, 0.06, offset)
            local sz = isHoriz and Vector3.new(barW, 0.1, length) or Vector3.new(length, 0.1, barW)
            makePart("Zebra_Bar", sz, cf, colStripeWhite, Enum.Material.SmoothPlastic, false, true)
        end
    end

    spawnCrosswalk(CFrame.new(blockMinX - streetW / 2, cy, blockMinZ + 10), streetW - 2, false)
    spawnCrosswalk(CFrame.new(blockMaxX + streetW / 2, cy, blockMinZ + 10), streetW - 2, false)
    spawnCrosswalk(CFrame.new(blockMinX - streetW / 2, cy, blockMaxZ - 10), streetW - 2, false)
    spawnCrosswalk(CFrame.new(blockMaxX + streetW / 2, cy, blockMaxZ - 10), streetW - 2, false)

    -- 3. SUBDIVISIÓN DE PARCELAS
    local usableMinX = blockMinX + swW
    local usableMaxX = blockMaxX - swW
    local usableMinZ = blockMinZ + swW
    local usableMaxZ = blockMaxZ - swW
    local buildableW = usableMaxX - usableMinX
    local buildableL = usableMaxZ - usableMinZ

    -- En suburbio residencial, parcelas más amplias para chalets y jardines
    local cols = (districtType == "residential_suburb") ? (buildableW >= 150 and 3 or 2) : (buildableW >= 130 and 3 or 2)
    local rows = (districtType == "residential_suburb") ? (buildableL >= 140 and 2 or 2) : (buildableL >= 130 and 3 or 2)
    local alleyW = 8

    local parcelW = (buildableW - (cols - 1) * alleyW) / cols
    local parcelL = (buildableL - (rows - 1) * alleyW) / rows

    -- Callejones de servicio entre edificios
    local alleyModel = Instance.new("Model", districtModel)
    alleyModel.Name = "Service_Alleys"

    for c = 1, cols - 1 do
        local alleyX = usableMinX + c * parcelW + (c - 0.5) * alleyW
        local alV = makePart("Service_Alley_V_" .. c, Vector3.new(alleyW, curbH, buildableL), CFrame.new(alleyX, cy + curbH / 2, cz), colAsphalt, Enum.Material.Cobblestone, true)
        alV.Parent = alleyModel
    end
    for r = 1, rows - 1 do
        local alleyZ = usableMinZ + r * parcelL + (r - 0.5) * alleyW
        local alH = makePart("Service_Alley_H_" .. r, Vector3.new(buildableW, curbH, alleyW), CFrame.new(cx, cy + curbH / 2, alleyZ), colAsphalt, Enum.Material.Cobblestone, true)
        alH.Parent = alleyModel
    end

    -- 4. CONSTRUCCIÓN DE PARCELAS: CASAS O EDIFICIOS SEGÚN EL TIPO DE DISTRITO
    local bCount = 0
    local isPlazaActive = ${hasPlaza ? "true" : "false"} and (cols == 3 and rows == 3) and (districtType == "commercial_downtown")
    local utilityPoleNodes = {}

    for c = 1, cols do
        for r = 1, rows do
            bCount = bCount + 1
            local bCenterX = usableMinX + (c - 0.5) * parcelW + (c - 1) * alleyW
            local bCenterZ = usableMinZ + (r - 0.5) * parcelL + (r - 1) * alleyW
            local bSeed = seedVal + bCount * 137
            local bBaseY = cy + curbH

            local isResidentialLot = (districtType == "residential_suburb") or (districtType == "mixed_urban" and r == rows)

            if isPlazaActive and c == 2 and r == 2 then
                -- PLAZA PEATONAL MONUMENTAL
                local plazaModel = Instance.new("Model", districtModel)
                plazaModel.Name = "Central_Pedestrian_Plaza"

                local plFloor = makePart("Plaza_Paving", Vector3.new(parcelW, 0.4, parcelL), CFrame.new(bCenterX, cy + curbH + 0.2, bCenterZ), Color3.fromRGB(220, 215, 205), Enum.Material.Cobblestone, true)
                plFloor.Parent = plazaModel

                local fountainR = math.min(parcelW, parcelL) * 0.22
                local fCF = CFrame.new(bCenterX, cy + curbH + 1.2, bCenterZ) * CFrame.Angles(0, 0, math.rad(90))
                local basin = makeCylinder("Fountain_Basin", Vector3.new(fountainR * 2, 2.0, fountainR * 2), fCF, Color3.fromRGB(190, 185, 178), Enum.Material.Granite, true)
                basin.Parent = plazaModel

                local waterP = makeCylinder("Fountain_Water", Vector3.new(fountainR * 1.8, 0.4, fountainR * 1.8), CFrame.new(bCenterX, cy + curbH + 1.8, bCenterZ) * CFrame.Angles(0, 0, math.rad(90)), Color3.fromRGB(80, 160, 210), Enum.Material.Glass, false)
                waterP.Transparency = 0.3
                waterP.Reflectance = 0.5
                waterP.Parent = plazaModel

                local spout = makePart("Fountain_Spout", Vector3.new(2, 6, 2), CFrame.new(bCenterX, cy + curbH + 4, bCenterZ), Color3.fromRGB(200, 195, 188), Enum.Material.Marble, true)
                spout.Parent = plazaModel
                local fLight = Instance.new("PointLight", spout)
                fLight.Color = Color3.fromRGB(200, 235, 255)
                fLight.Range = 24
                fLight.Brightness = 1.6

            elseif isResidentialLot then
                -- CASAS RESIDENCIALES ESTILO GTA SAN ANDREAS (Grove St / Ganton / Suburban House)
                local houseModel = Instance.new("Model", districtModel)
                houseModel.Name = "Suburban_Residence_" .. c .. "_" .. r
                pcall(function() houseModel.LevelOfDetail = Enum.ModelLevelOfDetail.StreamingMesh end)

                -- Parcela de césped
                local lawn = makePart("Lawn", Vector3.new(parcelW - 0.4, 0.4, parcelL - 0.4), CFrame.new(bCenterX, bBaseY + 0.2, bCenterZ), Color3.fromRGB(58, 128, 48), Enum.Material.Grass, true)
                lawn.Parent = houseModel

                -- Orientación: mira hacia el Norte o hacia el Sur
                local facesSouth = (r == rows)
                local rotAngle = facesSouth and 0 or math.rad(180)
                local streetEdgeZ = facesSouth and (bCenterZ + parcelL / 2) or (bCenterZ - parcelL / 2)

                -- Calzada de entrada de coche (Driveway) conectada a la acera
                local driveW = 11
                local driveLen = parcelL * 0.55
                local driveX = bCenterX + parcelW / 2 - driveW / 2 - 2
                local driveZ = bCenterZ + (facesSouth and (parcelL / 2 - driveLen / 2) or (-parcelL / 2 + driveLen / 2))
                local dw = makePart("Driveway", Vector3.new(driveW, 0.45, driveLen), CFrame.new(driveX, bBaseY + 0.22, driveZ), Color3.fromRGB(180, 182, 188), Enum.Material.Concrete, true)
                dw.Parent = houseModel

                -- Dimensiones de la casa
                local hW = parcelW - 14
                local hD = parcelL * 0.52
                local hH = 10
                local houseX = bCenterX - 4
                local houseZ = bCenterZ - (facesSouth and 4 or -4)
                local roofH = 7.0

                -- Colores de la casa
                local hWallCols = {
                    Color3.fromRGB(225, 215, 195), -- Crema estuco
                    Color3.fromRGB(145, 168, 178), -- Azul celeste
                    Color3.fromRGB(185, 145, 115), -- Madera tostada
                    Color3.fromRGB(210, 205, 192), -- Blanco roto
                    Color3.fromRGB(135, 155, 130), -- Verde suave
                }
                local hWallCol = hWallCols[(bSeed % #hWallCols) + 1]
                local hRoofCols = {
                    Color3.fromRGB(75, 55, 42),
                    Color3.fromRGB(55, 58, 62),
                    Color3.fromRGB(130, 65, 45),
                }
                local hRoofCol = hRoofCols[(bSeed % #hRoofCols) + 1]
                local hTrimCol = Color3.fromRGB(242, 242, 245)

                -- Cimentación elevada
                local found = makePart("Foundation", Vector3.new(hW + 0.8, 1.4, hD + 0.8), CFrame.new(houseX, bBaseY + 0.7, houseZ), Color3.fromRGB(120, 122, 128), Enum.Material.Concrete, true)
                found.Parent = houseModel

                -- Cuerpo de la casa
                local body = makePart("House_Body", Vector3.new(hW, hH, hD), CFrame.new(houseX, bBaseY + 1.4 + hH / 2, houseZ), hWallCol, Enum.Material.WoodPlanks, true)
                body.Parent = houseModel

                -- Tejado a dos aguas (Wedges izquierda y derecha)
                local roofBaseY = bBaseY + 1.4 + hH
                local halfRoofW = (hW + 2.4) / 2
                local roofD = hD + 2.4

                local rWedgeL = makeWedge("Roof_L", Vector3.new(roofD, roofH, halfRoofW),
                    CFrame.new(houseX - halfRoofW / 2, roofBaseY + roofH / 2, houseZ) * CFrame.Angles(0, math.rad(-90), 0), hRoofCol, Enum.Material.WoodPlanks)
                rWedgeL.Parent = houseModel

                local rWedgeR = makeWedge("Roof_R", Vector3.new(roofD, roofH, halfRoofW),
                    CFrame.new(houseX + halfRoofW / 2, roofBaseY + roofH / 2, houseZ) * CFrame.Angles(0, math.rad(90), 0), hRoofCol, Enum.Material.WoodPlanks)
                rWedgeR.Parent = houseModel

                -- Chimenea de ladrillo
                local chim = makePart("Chimney", Vector3.new(2.4, roofH + 3.5, 2.4), CFrame.new(houseX + hW / 4, roofBaseY + (roofH + 3.5) / 2, houseZ - hD / 4), Color3.fromRGB(145, 60, 42), Enum.Material.Brick, true)
                chim.Parent = houseModel

                -- Porche delantero cubierto con escalones y barandillas
                local porchW = 14
                local porchD = 6.5
                local porchH = 8.0
                local porchX = houseX - hW / 2 + porchW / 2 + 1.5
                local porchZ = facesSouth and (houseZ + hD / 2 + porchD / 2) or (houseZ - hD / 2 - porchD / 2)

                local pDeck = makePart("Porch_Deck", Vector3.new(porchW, 1.4, porchD), CFrame.new(porchX, bBaseY + 0.7, porchZ), Color3.fromRGB(115, 85, 60), Enum.Material.WoodPlanks, true)
                pDeck.Parent = houseModel

                -- Columnas y tejadillo del porche
                local pCol1 = makePart("Porch_Col_1", Vector3.new(0.8, porchH, 0.8), CFrame.new(porchX - porchW / 2 + 0.6, bBaseY + 1.4 + porchH / 2, porchZ + (facesSouth and (porchD / 2 - 0.6) or (-porchD / 2 + 0.6))), hTrimCol, Enum.Material.WoodPlanks, true)
                pCol1.Parent = houseModel
                local pCol2 = makePart("Porch_Col_2", Vector3.new(0.8, porchH, 0.8), CFrame.new(porchX + porchW / 2 - 0.6, bBaseY + 1.4 + porchH / 2, porchZ + (facesSouth and (porchD / 2 - 0.6) or (-porchD / 2 + 0.6))), hTrimCol, Enum.Material.WoodPlanks, true)
                pCol2.Parent = houseModel

                -- Tejadillo del porche
                local pRoofCF = CFrame.new(porchX, bBaseY + 1.4 + porchH + 1.0, porchZ) * (facesSouth and CFrame.Angles(0, math.rad(180), 0) or CFrame.Angles(0, 0, 0))
                local pRoof = makeWedge("Porch_Roof", Vector3.new(porchW + 1.0, 2.0, porchD + 1.0), pRoofCF, hRoofCol, Enum.Material.WoodPlanks)
                pRoof.Parent = houseModel

                -- Puerta residencial y farol colgante
                local doorZPos = facesSouth and (houseZ + hD / 2 + 0.15) or (houseZ - hD / 2 - 0.15)
                local doorP = makePart("Front_Door", Vector3.new(3.6, 7.6, 0.3), CFrame.new(porchX, bBaseY + 1.4 + 3.8, doorZPos), Color3.fromRGB(110, 45, 35), Enum.Material.WoodPlanks, true)
                doorP.Parent = houseModel
                local knob = makePart("Door_Knob", Vector3.new(0.2, 0.2, 0.25), CFrame.new(porchX + (facesSouth and 1.3 or -1.3), bBaseY + 1.4 + 3.8, doorZPos + (facesSouth and 0.2 or -0.2)), Color3.fromRGB(220, 185, 75), Enum.Material.Metal, false, true)
                knob.Parent = houseModel

                local pLightP = makePart("Porch_Lamp", Vector3.new(0.8, 1.0, 0.8), CFrame.new(porchX, bBaseY + 1.4 + porchH - 0.5, porchZ), Color3.fromRGB(255, 235, 175), Enum.Material.Neon, false, true)
                pLightP.Parent = houseModel
                local pL = Instance.new("PointLight", pLightP)
                pL.Color = Color3.fromRGB(255, 230, 175)
                pL.Range = 16
                pL.Brightness = 1.4

                -- Ventanas con contraventanas (Shutters)
                local winZPos = facesSouth and (houseZ + hD / 2 + 0.1) or (houseZ - hD / 2 - 0.1)
                local win1 = makePart("Win_Front", Vector3.new(3.6, 4.8, 0.2), CFrame.new(houseX + hW / 2 - 4.5, bBaseY + 1.4 + 4.8, winZPos), Color3.fromRGB(210, 225, 240), Enum.Material.Glass, false, true)
                win1.Transparency = 0.35
                win1.Parent = houseModel
                local shutL = makePart("Shutter_L", Vector3.new(1.2, 4.8, 0.2), CFrame.new(houseX + hW / 2 - 6.6, bBaseY + 1.4 + 4.8, winZPos), Color3.fromRGB(45, 65, 50), Enum.Material.WoodPlanks, false, true)
                shutL.Parent = houseModel
                local shutR = makePart("Shutter_R", Vector3.new(1.2, 4.8, 0.2), CFrame.new(houseX + hW / 2 - 2.4, bBaseY + 1.4 + 4.8, winZPos), Color3.fromRGB(45, 65, 50), Enum.Material.WoodPlanks, false, true)
                shutR.Parent = houseModel

                -- Garaje adosado
                local garW = 13
                local garD = parcelL * 0.45
                local garH = 9.0
                local garX = houseX + hW / 2 + garW / 2 - 1.0
                local garZ = houseZ + (facesSouth and 2 or -2)

                local gBody = makePart("Garage_Body", Vector3.new(garW, garH, garD), CFrame.new(garX, bBaseY + garH / 2, garZ), hWallCol, Enum.Material.WoodPlanks, true)
                gBody.Parent = houseModel

                local gDoorZ = facesSouth and (garZ + garD / 2 + 0.1) or (garZ - garD / 2 - 0.1)
                local gDoor = makePart("Garage_Door", Vector3.new(9.5, 7.2, 0.3), CFrame.new(garX, bBaseY + 3.6, gDoorZ), Color3.fromRGB(240, 242, 245), Enum.Material.WoodPlanks, true)
                gDoor.Parent = houseModel

                -- Buzón de correos americano a pie de calle
                local mbZ = facesSouth and (bCenterZ + parcelL / 2 - 3) or (bCenterZ - parcelL / 2 + 3)
                local mbPost = makePart("Mailbox_Post", Vector3.new(0.4, 4.0, 0.4), CFrame.new(driveX - driveW / 2 - 2, bBaseY + 2.0, mbZ), Color3.fromRGB(90, 65, 45), Enum.Material.WoodPlanks, true)
                mbPost.Parent = houseModel
                local mbBox = makePart("Mailbox_Box", Vector3.new(1.0, 1.0, 1.6), CFrame.new(driveX - driveW / 2 - 2, bBaseY + 4.2, mbZ), Color3.fromRGB(45, 75, 135), Enum.Material.Metal, true)
                mbBox.Parent = houseModel

                -- Valla blanca de madera perimetral (Picket fence)
                local colFence = Color3.fromRGB(240, 240, 245)
                local fL = makePart("Fence_L", Vector3.new(0.4, 3.4, parcelL - 6), CFrame.new(bCenterX - parcelW / 2 + 0.4, bBaseY + 1.7, bCenterZ), colFence, Enum.Material.WoodPlanks, true)
                fL.Parent = houseModel
            else
                -- EDIFICIO ARQUITECTÓNICO COMERCIAL (Downtown, Corner buildings, etc.)
                local isCorner = (c == 1 or c == cols) and (r == 1 or r == rows)
                local floorCount = isCorner and math.floor(10 + ((bSeed * 7) % 7)) or math.floor(5 + ((bSeed * 5) % 5))

                local bW = parcelW
                local bD = parcelL
                local groundH = 14
                local upperH = 10.5
                local totalH = groundH + (floorCount - 1) * upperH

                local colList = {
                    ${styleConfig.facadeColors.map((col) => `Color3.fromRGB(${col[0]}, ${col[1]}, ${col[2]})`).join(", ")}
                }
                local colFacade = colList[(bSeed % #colList) + 1]

                local colAwningList = {
                    ${styleConfig.awningColors.map((col) => `Color3.fromRGB(${col[0]}, ${col[1]}, ${col[2]})`).join(", ")}
                }
                local colAwning = colAwningList[(bSeed % #colAwningList) + 1]

                local signNamesList = {
                    ${styleConfig.signNames.map((sn) => `"${sn}"`).join(", ")}
                }
                local buildingSignName = signNamesList[(bSeed % #signNamesList) + 1]

                local signGlowList = {
                    ${styleConfig.signGlowColors.map((col) => `Color3.fromRGB(${col[0]}, ${col[1]}, ${col[2]})`).join(", ")}
                }
                local buildingSignGlow = signGlowList[(bSeed % #signGlowList) + 1]

                local bModel = Instance.new("Model", districtModel)
                bModel.Name = "Building_" .. c .. "_" .. r
                pcall(function() bModel.LevelOfDetail = Enum.ModelLevelOfDetail.StreamingMesh end)

                local function makeBPart(pName, sz, cf, col, mat, canCol, isDecor)
                    local p = Instance.new("Part", bModel)
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
                    p.Material = mat or Enum.Material.${styleConfig.facadeMaterials[0]}
                    return p
                end

                local function makeBWedge(pName, sz, cf, col, mat)
                    local wPart = Instance.new("WedgePart", bModel)
                    wPart.Name = pName
                    wPart.Anchored = true
                    wPart.CanCollide = false
                    wPart.CanTouch = false
                    wPart.CanQuery = false
                    wPart.Size = sz
                    wPart.CFrame = cf
                    wPart.Color = col
                    wPart.Material = mat or Enum.Material.${styleConfig.awningMaterial}
                    return wPart
                end

                -- A. CIMENTACIÓN Y CUERPO
                makeBPart("Plinth", Vector3.new(bW + 0.8, 1.8, bD + 0.8),
                    CFrame.new(bCenterX, bBaseY + 0.9, bCenterZ),
                    Color3.fromRGB(${styleConfig.baseboardColor[0]}, ${styleConfig.baseboardColor[1]}, ${styleConfig.baseboardColor[2]}),
                    Enum.Material.${styleConfig.baseboardMaterial}, true)

                makeBPart("Body", Vector3.new(bW, totalH, bD),
                    CFrame.new(bCenterX, bBaseY + totalH / 2, bCenterZ),
                    colFacade, Enum.Material.${styleConfig.facadeMaterials[0]}, true)

                -- B. PILASTRAS EN LAS ESQUINAS
                local pilCol = Color3.fromRGB(${styleConfig.pillarColor[0]}, ${styleConfig.pillarColor[1]}, ${styleConfig.pillarColor[2]})
                local pilMat = Enum.Material.${styleConfig.pillarMaterial}
                local pilThick = 1.2
                makeBPart("Pillar_NW", Vector3.new(pilThick, totalH, pilThick), CFrame.new(bCenterX - bW/2, bBaseY + totalH/2, bCenterZ - bD/2), pilCol, pilMat, false, true)
                makeBPart("Pillar_NE", Vector3.new(pilThick, totalH, pilThick), CFrame.new(bCenterX + bW/2, bBaseY + totalH/2, bCenterZ - bD/2), pilCol, pilMat, false, true)
                makeBPart("Pillar_SW", Vector3.new(pilThick, totalH, pilThick), CFrame.new(bCenterX - bW/2, bBaseY + totalH/2, bCenterZ + bD/2), pilCol, pilMat, false, true)
                makeBPart("Pillar_SE", Vector3.new(pilThick, totalH, pilThick), CFrame.new(bCenterX + bW/2, bBaseY + totalH/2, bCenterZ + bD/2), pilCol, pilMat, false, true)

                local cornCol = Color3.fromRGB(${styleConfig.corniceColor[0]}, ${styleConfig.corniceColor[1]}, ${styleConfig.corniceColor[2]})
                local cornMat = Enum.Material.${styleConfig.corniceMaterial}
                makeBPart("Cornice_Ground", Vector3.new(bW + 1.2, 1.0, bD + 1.2), CFrame.new(bCenterX, bBaseY + groundH, bCenterZ), cornCol, cornMat, false, true)

                -- C. FACHADAS COMERCIALES ACTIVAS
                local facesNorth = (r == 1)
                local facesSouth = (r == rows)
                local facesWest = (c == 1)
                local facesEast = (c == cols)

                local function buildStreetFacade(faceDir, widthAlong, depthNormal, centerPos, rotY)
                    local frontOffset = depthNormal / 2 + 0.2
                    local facadeCF = CFrame.new(centerPos) * CFrame.Angles(0, rotY, 0)

                    local dPortalW = 6.4
                    local dPortalH = 8.5
                    local dAlcove = 1.6

                    makeBPart("Entrance_Frame", Vector3.new(dPortalW + 1.0, dPortalH + 0.6, dAlcove + 0.4), facadeCF * CFrame.new(0, dPortalH / 2, frontOffset - dAlcove / 2), pilCol, pilMat, true)

                    local leafW = (dPortalW - 0.4) / 2
                    local leafH = 7.2
                    makeBPart("Door_Leaf_L", Vector3.new(leafW, leafH, 0.3), facadeCF * CFrame.new(-leafW / 2 - 0.1, leafH / 2 + 0.2, frontOffset - dAlcove), Color3.fromRGB(${styleConfig.doorColor[0]}, ${styleConfig.doorColor[1]}, ${styleConfig.doorColor[2]}), Enum.Material.${styleConfig.doorMaterial}, true)
                    makeBPart("Door_Leaf_R", Vector3.new(leafW, leafH, 0.3), facadeCF * CFrame.new(leafW / 2 + 0.1, leafH / 2 + 0.2, frontOffset - dAlcove), Color3.fromRGB(${styleConfig.doorColor[0]}, ${styleConfig.doorColor[1]}, ${styleConfig.doorColor[2]}), Enum.Material.${styleConfig.doorMaterial}, true)

                    makeBPart("Handle_L", Vector3.new(0.2, 2.0, 0.2), facadeCF * CFrame.new(-0.5, 3.8, frontOffset - dAlcove + 0.2), Color3.fromRGB(${styleConfig.doorHandleColor[0]}, ${styleConfig.doorHandleColor[1]}, ${styleConfig.doorHandleColor[2]}), Enum.Material.Metal, false, true)
                    makeBPart("Handle_R", Vector3.new(0.2, 2.0, 0.2), facadeCF * CFrame.new(0.5, 3.8, frontOffset - dAlcove + 0.2), Color3.fromRGB(${styleConfig.doorHandleColor[0]}, ${styleConfig.doorHandleColor[1]}, ${styleConfig.doorHandleColor[2]}), Enum.Material.Metal, false, true)

                    local sideShopW = (widthAlong - dPortalW - 4) / 2
                    if sideShopW > 4 then
                        local shopOffset = widthAlong / 2 - sideShopW / 2 - 1.2
                        local shopH = 7.8
                        local shopY = shopH / 2 + 1.2

                        local gL = makeBPart("Showcase_L", Vector3.new(sideShopW, shopH, 0.3), facadeCF * CFrame.new(-shopOffset, shopY, frontOffset), Color3.fromRGB(${styleConfig.glassColor[0]}, ${styleConfig.glassColor[1]}, ${styleConfig.glassColor[2]}), Enum.Material.Glass, false, true)
                        gL.Transparency = 0.32
                        gL.Reflectance = 0.45

                        local gR = makeBPart("Showcase_R", Vector3.new(sideShopW, shopH, 0.3), facadeCF * CFrame.new(shopOffset, shopY, frontOffset), Color3.fromRGB(${styleConfig.glassColor[0]}, ${styleConfig.glassColor[1]}, ${styleConfig.glassColor[2]}), Enum.Material.Glass, false, true)
                        gR.Transparency = 0.32
                        gR.Reflectance = 0.45

                        local awnDepth = 3.2
                        local awnH = 2.2
                        local awnY = shopH + 1.8
                        local awnZ = frontOffset + awnDepth / 2

                        makeBWedge("Awning_L", Vector3.new(sideShopW, awnH, awnDepth), facadeCF * CFrame.new(-shopOffset, awnY, awnZ) * CFrame.Angles(0, math.rad(180), 0), colAwning, Enum.Material.${styleConfig.awningMaterial})
                        makeBWedge("Awning_R", Vector3.new(sideShopW, awnH, awnDepth), facadeCF * CFrame.new(shopOffset, awnY, awnZ) * CFrame.Angles(0, math.rad(180), 0), colAwning, Enum.Material.${styleConfig.awningMaterial})

                        local signH = 1.6
                        local signY = awnY + 1.6
                        makeBPart("Store_Sign", Vector3.new(sideShopW, signH, 0.5), facadeCF * CFrame.new(-shopOffset, signY, frontOffset + 0.2), Color3.fromRGB(32, 34, 40), Enum.Material.SmoothPlastic, false, true)
                        local signGlowP = makeBPart("Sign_Neon", Vector3.new(sideShopW - 1, 0.7, 0.2), facadeCF * CFrame.new(-shopOffset, signY, frontOffset + 0.48), buildingSignGlow, Enum.Material.Neon, false, true)
                        local sLight = Instance.new("PointLight", signGlowP)
                        sLight.Color = buildingSignGlow
                        sLight.Range = 12
                        sLight.Brightness = 1.1

                        local tCF = facadeCF * CFrame.new(shopOffset, 1.4, frontOffset + awnDepth + 2.0)
                        makeBPart("Cafe_Table", Vector3.new(2.4, 0.2, 2.4), tCF * CFrame.new(0, 1.2, 0), Color3.fromRGB(50, 45, 40), Enum.Material.WoodPlanks, true)
                        makeBPart("Cafe_Chair_1", Vector3.new(1.4, 1.4, 1.4), tCF * CFrame.new(-1.6, 0.7, 0), Color3.fromRGB(38, 40, 45), Enum.Material.Metal, true)
                        makeBPart("Cafe_Chair_2", Vector3.new(1.4, 1.4, 1.4), tCF * CFrame.new(1.6, 0.7, 0), Color3.fromRGB(38, 40, 45), Enum.Material.Metal, true)
                    end
                end

                local function buildAlleyFacade(faceDir, widthAlong, depthNormal, centerPos, rotY)
                    local frontOffset = depthNormal / 2 + 0.1
                    local facadeCF = CFrame.new(centerPos) * CFrame.Angles(0, rotY, 0)

                    local srvDoor = makeBPart("Service_Exit_Door", Vector3.new(3.8, 7.5, 0.3), facadeCF * CFrame.new(0, 3.75, frontOffset), Color3.fromRGB(55, 58, 65), Enum.Material.Metal, true)
                    local srvL = Instance.new("PointLight", srvDoor)
                    srvL.Color = Color3.fromRGB(255, 210, 140)
                    srvL.Range = 12
                    srvL.Brightness = 1.2

                    local dumpCF = facadeCF * CFrame.new(-widthAlong / 2 + 5, 2.2, frontOffset + 3.2)
                    makeBPart("Alley_Dumpster", Vector3.new(6.5, 4.4, 4.0), dumpCF, Color3.fromRGB(45, 80, 55), Enum.Material.Metal, true)
                    makeBPart("Dumpster_Lid", Vector3.new(6.7, 0.4, 4.2), dumpCF * CFrame.new(0, 2.3, 0), Color3.fromRGB(35, 38, 42), Enum.Material.SmoothPlastic, true)

                    local palCF = facadeCF * CFrame.new(widthAlong / 2 - 4.5, 0.8, frontOffset + 2.5)
                    makeBPart("Wooden_Pallet_1", Vector3.new(4, 0.5, 4), palCF, Color3.fromRGB(130, 95, 60), Enum.Material.WoodPlanks, true)
                    makeBPart("Wooden_Pallet_2", Vector3.new(4, 0.5, 4), palCF * CFrame.new(0, 0.5, 0), Color3.fromRGB(125, 90, 55), Enum.Material.WoodPlanks, true)
                end

                if facesSouth then buildStreetFacade("South", bW, bD, Vector3.new(bCenterX, bBaseY, bCenterZ), 0)
                else buildAlleyFacade("South", bW, bD, Vector3.new(bCenterX, bBaseY, bCenterZ), 0) end

                if facesNorth then buildStreetFacade("North", bW, bD, Vector3.new(bCenterX, bBaseY, bCenterZ), math.rad(180))
                else buildAlleyFacade("North", bW, bD, Vector3.new(bCenterX, bBaseY, bCenterZ), math.rad(180)) end

                if facesWest then buildStreetFacade("West", bD, bW, Vector3.new(bCenterX, bBaseY, bCenterZ), math.rad(-90)) end
                if facesEast then buildStreetFacade("East", bD, bW, Vector3.new(bCenterX, bBaseY, bCenterZ), math.rad(90)) end

                -- D. VENTANAS EN LOS PISOS SUPERIORES
                local winW = 3.4
                local winH = 5.2
                local numWinX = math.max(2, math.floor(bW / 8))
                local stepX = bW / numWinX
                local numWinZ = math.max(2, math.floor(bD / 8))
                local stepZ = bD / numWinZ

                for fl = 1, floorCount - 1 do
                    local flY = bBaseY + groundH + (fl - 0.5) * upperH

                    if fl < floorCount - 1 then
                        makeBPart("Cornice_Fl_" .. fl, Vector3.new(bW + 0.6, 0.6, bD + 0.6), CFrame.new(bCenterX, bBaseY + groundH + fl * upperH, bCenterZ), cornCol, cornMat, false, true)
                    end

                    for wx = 1, numWinX do
                        local wX = bCenterX - bW / 2 + (wx - 0.5) * stepX
                        local isLit = ((bSeed * 17 + fl * 29 + wx * 19) % 100) < 48
                        local wPart = makeBPart("Win_S", Vector3.new(winW, winH, 0.2), CFrame.new(wX, flY, bCenterZ + bD / 2 + 0.1), Color3.fromRGB(${styleConfig.glassColor[0]}, ${styleConfig.glassColor[1]}, ${styleConfig.glassColor[2]}), Enum.Material.Glass, false, true)
                        wPart.Transparency = 0.35
                        makeBPart("Sill_S", Vector3.new(winW + 0.6, 0.4, 0.6), CFrame.new(wX, flY - winH / 2 - 0.2, bCenterZ + bD / 2 + 0.3), cornCol, cornMat, false, true)

                        if isLit then
                            wPart.Material = Enum.Material.Neon
                            wPart.Color = Color3.fromRGB(${styleConfig.warmInteriorColor[0]}, ${styleConfig.warmInteriorColor[1]}, ${styleConfig.warmInteriorColor[2]})
                            wPart.Transparency = 0.1
                            local pL = Instance.new("PointLight", wPart)
                            pL.Color = wPart.Color
                            pL.Range = 10
                            pL.Brightness = 0.7
                        end
                    end
                end

                -- E. AZOTEA Y EQUIPAMIENTO TÉCNICO
                local roofY = bBaseY + totalH
                makeBPart("Roof_Slab", Vector3.new(bW, 1.4, bD), CFrame.new(bCenterX, roofY - 0.7, bCenterZ), Color3.fromRGB(${styleConfig.roofFloorColor[0]}, ${styleConfig.roofFloorColor[1]}, ${styleConfig.roofFloorColor[2]}), Enum.Material.Concrete, true)
                makeBPart("Parapet_F", Vector3.new(bW, 2.4, 0.8), CFrame.new(bCenterX, roofY + 1.2, bCenterZ + bD/2 - 0.4), Color3.fromRGB(${styleConfig.parapetColor[0]}, ${styleConfig.parapetColor[1]}, ${styleConfig.parapetColor[2]}), Enum.Material.${styleConfig.parapetMaterial}, true)
                makeBPart("Parapet_B", Vector3.new(bW, 2.4, 0.8), CFrame.new(bCenterX, roofY + 1.2, bCenterZ - bD/2 + 0.4), Color3.fromRGB(${styleConfig.parapetColor[0]}, ${styleConfig.parapetColor[1]}, ${styleConfig.parapetColor[2]}), Enum.Material.${styleConfig.parapetMaterial}, true)

                if bW >= 22 then
                    makeBPart("HVAC", Vector3.new(7.0, 3.8, 5.5), CFrame.new(bCenterX + bW/4, roofY + 1.9, bCenterZ + bD/4), Color3.fromRGB(150, 155, 162), Enum.Material.DiamondPlate, true)
                    local ant = makeBPart("Antenna", Vector3.new(0.8, 16, 0.8), CFrame.new(bCenterX - bW/4, roofY + 8, bCenterZ - bD/4), Color3.fromRGB(65, 70, 75), Enum.Material.Metal, false, true)
                    local beacon = makeBPart("Beacon", Vector3.new(1.2, 1.2, 1.2), CFrame.new(bCenterX - bW/4, roofY + 16.6, bCenterZ - bD/4), Color3.fromRGB(255, 30, 30), Enum.Material.Neon, false, true)
                    beacon.Shape = Enum.PartType.Ball
                    local bl = Instance.new("PointLight", beacon)
                    bl.Color = Color3.fromRGB(255, 30, 30)
                    bl.Range = 16
                    bl.Brightness = 1.8
                end
            end
        end
    end

    ${
      hasPowerLines
        ? `
    -- 5. RED DE POSTES DE MADERA CON CABLES ELÉCTRICOS AÉREOS (ESTILO ICÓNICO GTA SAN ANDREAS)
    local poleModel = Instance.new("Model", districtModel)
    poleModel.Name = "Overhead_Power_Lines"

    local poleStep = 60
    local poleH = 24
    local polePositions = {}

    -- Postes a lo largo de las aceras Sur y Norte
    for px = blockMinX + 10, blockMaxX - 10, poleStep do
        local poleZ_S = blockMaxZ - swW - 1.0
        local poleZ_N = blockMinZ + swW + 1.0
        table.insert(polePositions, {px, cy + curbH, poleZ_S})
        table.insert(polePositions, {px, cy + curbH, poleZ_N})
    end

    for idx, pos in ipairs(polePositions) do
        local pX, pY, pZ = pos[1], pos[2], pos[3]
        -- Poste de madera cilíndrico
        local poleP = makePart("Utility_Pole_" .. idx, Vector3.new(1.1, poleH, 1.1), CFrame.new(pX, pY + poleH / 2, pZ), Color3.fromRGB(80, 58, 42), Enum.Material.WoodPlanks, true)
        poleP.Parent = poleModel

        -- Cruceta horizontal superior de madera
        local arm = makePart("Crossarm_" .. idx, Vector3.new(6.0, 0.4, 0.4), CFrame.new(pX, pY + poleH - 1.2, pZ), Color3.fromRGB(75, 52, 38), Enum.Material.WoodPlanks, false, true)
        arm.Parent = poleModel

        -- Transformador cilíndrico metálico (en postes alternos)
        if idx % 2 == 1 then
            local transCF = CFrame.new(pX + 0.8, pY + poleH - 4.5, pZ) * CFrame.Angles(0, 0, math.rad(90))
            local trans = makeCylinder("Transformer_" .. idx, Vector3.new(2.0, 3.2, 2.0), transCF, Color3.fromRGB(85, 90, 95), Enum.Material.Metal)
            trans.Parent = poleModel
        end
    end

    -- Cables aéreos negros tendidos entre postes contiguos
    for i = 1, #polePositions - 2, 2 do
        local p1 = polePositions[i]
        local p2 = polePositions[i + 2]
        local mid = Vector3.new((p1[1] + p2[1]) / 2, p1[2] + poleH - 1.2, p1[3])
        local span = math.abs(p2[1] - p1[1])
        -- 3 cables paralelos tendidos a través de la cruceta
        for cOff = -2.2, 2.2, 2.2 do
            local wire = makePart("Cable_" .. i .. "_" .. math.floor(cOff), Vector3.new(span, 0.12, 0.12), CFrame.new(mid.X, mid.Y, mid.Z + cOff), Color3.fromRGB(25, 25, 28), Enum.Material.Metal, false, true)
            wire.Parent = poleModel
        end
    end
    `
        : ""
    }

    ${
      hasFurniture
        ? `
    -- 6. MOBILIARIO URBANO DE ACERAS AAA (Farolas, árboles, bancos, hidrantes)
    local furnModel = Instance.new("Model", districtModel)
    furnModel.Name = "District_StreetFurniture"

    local function spawnLamp(cf)
        local pole = makePart("Lamp_Pole", Vector3.new(0.8, 15, 0.8), cf * CFrame.new(0, 7.5, 0), Color3.fromRGB(42, 45, 52), Enum.Material.Metal, true)
        pole.Parent = furnModel
        local arm = makePart("Lamp_Arm", Vector3.new(0.6, 0.6, 3.2), cf * CFrame.new(0, 14.8, 1.4), Color3.fromRGB(42, 45, 52), Enum.Material.Metal, false)
        arm.Parent = furnModel
        local bulb = makePart("Lamp_Bulb", Vector3.new(1.0, 0.2, 1.4), cf * CFrame.new(0, 14.1, 2.6), Color3.fromRGB(255, 240, 200), Enum.Material.Neon, false)
        bulb.Parent = furnModel

        local light = Instance.new("PointLight", bulb)
        light.Color = Color3.fromRGB(255, 230, 185)
        light.Range = 36
        light.Brightness = 1.8
        light.Shadows = true
    end

    local function spawnTree(cf)
        local grate = makePart("Tree_Grate", Vector3.new(4.2, 0.2, 4.2), cf * CFrame.new(0, 0.1, 0), Color3.fromRGB(35, 38, 42), Enum.Material.DiamondPlate, true)
        grate.Parent = furnModel
        local trunk = makePart("Tree_Trunk", Vector3.new(1.4, 8.5, 1.4), cf * CFrame.new(0, 4.35, 0), Color3.fromRGB(85, 55, 35), Enum.Material.WoodPlanks, true)
        trunk.Parent = furnModel
        local crown = makePart("Tree_Crown", Vector3.new(7.0, 6.5, 7.0), cf * CFrame.new(0, 10.8, 0), Color3.fromRGB(55, 125, 50), Enum.Material.Grass, false)
        crown.Parent = furnModel
    end

    local function spawnHydrant(cf)
        local h = makePart("Hydrant", Vector3.new(1.2, 2.8, 1.2), cf * CFrame.new(0, 1.4, 0), Color3.fromRGB(210, 40, 40), Enum.Material.Metal, true)
        h.Shape = Enum.PartType.Cylinder
        h.CFrame = cf * CFrame.new(0, 1.4, 0) * CFrame.Angles(0, 0, math.rad(90))
        h.Parent = furnModel
    end

    local function spawnBench(cf)
        local seat = makePart("Bench_Seat", Vector3.new(5.5, 0.4, 1.6), cf * CFrame.new(0, 1.4, 0), Color3.fromRGB(115, 75, 45), Enum.Material.WoodPlanks, true)
        seat.Parent = furnModel
        local back = makePart("Bench_Back", Vector3.new(5.5, 1.4, 0.4), cf * CFrame.new(0, 2.3, -0.6), Color3.fromRGB(115, 75, 45), Enum.Material.WoodPlanks, false)
        back.Parent = furnModel
        local lLeg = makePart("Bench_L", Vector3.new(0.4, 1.4, 1.6), cf * CFrame.new(-2.5, 0.7, 0), Color3.fromRGB(35, 38, 42), Enum.Material.Metal, true)
        lLeg.Parent = furnModel
        local rLeg = makePart("Bench_R", Vector3.new(0.4, 1.4, 1.6), cf * CFrame.new(2.5, 0.7, 0), Color3.fromRGB(35, 38, 42), Enum.Material.Metal, true)
        rLeg.Parent = furnModel
    end

    local furnStep = 40
    for fx = blockMinX + 16, blockMaxX - 16, furnStep do
        local southCF = CFrame.new(fx, cy + curbH, blockMaxZ - swW / 2)
        local northCF = CFrame.new(fx, cy + curbH, blockMinZ + swW / 2) * CFrame.Angles(0, math.rad(180), 0)

        spawnLamp(southCF)
        spawnTree(southCF * CFrame.new(furnStep / 2, 0, 0))
        spawnLamp(northCF)
        spawnTree(northCF * CFrame.new(furnStep / 2, 0, 0))
    end

    spawnHydrant(CFrame.new(blockMinX + 6, cy + curbH, blockMaxZ - 6))
    spawnHydrant(CFrame.new(blockMaxX - 6, cy + curbH, blockMaxZ - 6))
    spawnHydrant(CFrame.new(blockMinX + 6, cy + curbH, blockMinZ + 6))
    spawnHydrant(CFrame.new(blockMaxX - 6, cy + curbH, blockMinZ + 6))
    `
        : ""
    }

    print(string.format("[DistrictEngine GTA-AAA] ✅ Distrito '%s' (Tipo: %s, %dx%d studs) generado con éxito en '%s'.", "${name}", districtType, totalW, totalL, "${parent}"))
end

buildCompleteDistrict()
`;
}
