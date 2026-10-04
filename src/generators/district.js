import { getStylePreset } from "./stylePresets.js";
import { snapVal } from "./grid.js";

/**
 * Generador Urbano Macro AAA: Crea distritos y manzanas vivas de alta fidelidad
 * con calzadas de asfalto, bordillos de granito, pasos de cebra peatonales,
 * aceras anchas elevadas, subdivisión inteligente de parcelas con orientación
 * correcta de fachadas hacia la calle, portales y puertas reales en todos los edificios,
 * escaparates comerciales con rótulos 3D iluminados, veladores y terrazas exteriores,
 * callejones de servicio con contenedores, palets y salidas de emergencia,
 * variedad de alturas (rascacielos en esquinas), azoteas habitables con maquinaria,
 * y plaza central peatonal en manzanas 3x3.
 */
export function generateDistrictLuau({
  name = "Downtown_District",
  center = [0, 0, 0],
  size = [240, 240], // [widthX, lengthZ]
  style = "modern_downtown",
  density = "high", // "high", "medium", "low", "mixed"
  streetWidth = 28,
  sidewalkWidth = 10,
  seed = 54321,
  hasFurniture = true,
  alignToTerrain = true,
  hasPlaza = true,
  parent = "City/Districts",
}) {
  const [cx, cy, cz] = [snapVal(center[0], 4), snapVal(center[1], 4), snapVal(center[2], 4)];
  const [totalW, totalL] = [Math.max(140, snapVal(size[0], 4)), Math.max(140, snapVal(size[1] || size[2] || 240, 4))];
  const sWidth = Math.max(20, snapVal(streetWidth, 4));
  const swWidth = Math.max(8, snapVal(sidewalkWidth, 2));
  const effectiveSeed = typeof seed === "number" ? seed : 54321;

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
        w.CanCollide = false
        w.CanTouch = false
        w.CanQuery = false
        w.Size = sz
        w.CFrame = cf
        w.Color = col
        w.Material = mat or Enum.Material.Fabric
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

    -- 1. CALZADAS PERIMETRALES DE ASFALTO Y SEÑALIZACIÓN VIAL
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

    -- Líneas amarillas dobles y discontinuas en calzadas
    local stripeLen = 7
    local stripeGap = 6
    local numStripes = math.floor(totalW / (stripeLen + stripeGap))
    for s = 1, numStripes do
        local stX = cx - halfW + (s - 0.5) * (stripeLen + stripeGap)
        makePart("Stripe_S_" .. s, Vector3.new(stripeLen, 0.08, 0.8), CFrame.new(stX, cy + 0.04, cz + halfL - streetW / 2), colStripeYellow, Enum.Material.SmoothPlastic, false, true)
        makePart("Stripe_N_" .. s, Vector3.new(stripeLen, 0.08, 0.8), CFrame.new(stX, cy + 0.04, cz - halfL + streetW / 2), colStripeYellow, Enum.Material.SmoothPlastic, false, true)
    end

    -- Tapas de alcantarilla circulares (Manholes) y rejillas de desagüe pluvial
    local manholeCF1 = CFrame.new(cx - 30, cy + 0.05, cz + halfL - streetW / 2) * CFrame.Angles(0, 0, math.rad(90))
    local manholeCF2 = CFrame.new(cx + 30, cy + 0.05, cz - halfL + streetW / 2) * CFrame.Angles(0, 0, math.rad(90))
    makeCylinder("Manhole_1", Vector3.new(3.2, 0.1, 3.2), manholeCF1, Color3.fromRGB(55, 60, 68), Enum.Material.DiamondPlate, false)
    makeCylinder("Manhole_2", Vector3.new(3.2, 0.1, 3.2), manholeCF2, Color3.fromRGB(55, 60, 68), Enum.Material.DiamondPlate, false)

    -- 2. ACERAS PEATONALES ELEVADAS (+0.6 studs con bordillos de granito)
    local curbH = 0.65
    local blockMinX = cx - halfW + streetW
    local blockMaxX = cx + halfW - streetW
    local blockMinZ = cz - halfL + streetW
    local blockMaxZ = cz + halfL - streetW
    local blockW = blockMaxX - blockMinX
    local blockL = blockMaxZ - blockMinZ

    -- Losa completa de la manzana peatonal
    makePart("City_Block_Platform", Vector3.new(blockW, curbH, blockL), CFrame.new(cx, cy + curbH / 2, cz), colSidewalk, Enum.Material.Concrete, true)

    -- Bordillos perimetrales de granito
    local curbThick = 0.8
    makePart("Curb_North", Vector3.new(blockW, curbH + 0.1, curbThick), CFrame.new(cx, cy + curbH / 2, blockMinZ + curbThick / 2), colCurb, Enum.Material.Granite, true)
    makePart("Curb_South", Vector3.new(blockW, curbH + 0.1, curbThick), CFrame.new(cx, cy + curbH / 2, blockMaxZ - curbThick / 2), colCurb, Enum.Material.Granite, true)
    makePart("Curb_West", Vector3.new(curbThick, curbH + 0.1, blockL), CFrame.new(blockMinX + curbThick / 2, cy + curbH / 2, cz), colCurb, Enum.Material.Granite, true)
    makePart("Curb_East", Vector3.new(curbThick, curbH + 0.1, blockL), CFrame.new(blockMaxX - curbThick / 2, cy + curbH / 2, cz), colCurb, Enum.Material.Granite, true)

    -- Pasos de cebra peatonales monumentales con barras termoplásticas blancas
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

    -- 3. SUBDIVISIÓN DE MANZANA EN PARCELAS URBANAS CON CALLEJONES DE SERVICIO
    local usableMinX = blockMinX + swW
    local usableMaxX = blockMaxX - swW
    local usableMinZ = blockMinZ + swW
    local usableMaxZ = blockMaxZ - swW
    local buildableW = usableMaxX - usableMinX
    local buildableL = usableMaxZ - usableMinZ

    local cols = buildableW >= 130 and 3 or 2
    local rows = buildableL >= 130 and 3 or 2
    local alleyW = 8

    local parcelW = (buildableW - (cols - 1) * alleyW) / cols
    local parcelL = (buildableL - (rows - 1) * alleyW) / rows

    -- Callejones de servicio entre edificios con asfalto y sumideros
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

    -- 4. CONSTRUCCIÓN DE EDIFICIOS ARQUITECTÓNICOS PARCELA POR PARCELA
    local bCount = 0
    local isPlazaActive = ${hasPlaza ? "true" : "false"} and (cols == 3 and rows == 3)

    for c = 1, cols do
        for r = 1, rows do
            bCount = bCount + 1
            local bCenterX = usableMinX + (c - 0.5) * parcelW + (c - 1) * alleyW
            local bCenterZ = usableMinZ + (r - 0.5) * parcelL + (r - 1) * alleyW
            local bSeed = seedVal + bCount * 137

            -- Si es la parcela central de un 3x3 y se activa Plaza, crear PLAZA PEATONAL
            if isPlazaActive and c == 2 and r == 2 then
                local plazaModel = Instance.new("Model", districtModel)
                plazaModel.Name = "Central_Pedestrian_Plaza"

                -- Pavimento decorativo con losas de granito y piedra caliza
                local plFloor = makePart("Plaza_Paving", Vector3.new(parcelW, 0.4, parcelL), CFrame.new(bCenterX, cy + curbH + 0.2, bCenterZ), Color3.fromRGB(220, 215, 205), Enum.Material.Cobblestone, true)
                plFloor.Parent = plazaModel

                -- Fuente monumental de agua en el centro de la plaza
                local fountainR = math.min(parcelW, parcelL) * 0.22
                local fCF = CFrame.new(bCenterX, cy + curbH + 1.2, bCenterZ) * CFrame.Angles(0, 0, math.rad(90))
                local basin = makeCylinder("Fountain_Basin", Vector3.new(fountainR * 2, 2.0, fountainR * 2), fCF, Color3.fromRGB(190, 185, 178), Enum.Material.Granite, true)
                basin.Parent = plazaModel

                -- Superficie de agua cristalina reflectante
                local waterP = makeCylinder("Fountain_Water", Vector3.new(fountainR * 1.8, 0.4, fountainR * 1.8), CFrame.new(bCenterX, cy + curbH + 1.8, bCenterZ) * CFrame.Angles(0, 0, math.rad(90)), Color3.fromRGB(80, 160, 210), Enum.Material.Glass, false)
                waterP.Transparency = 0.3
                waterP.Reflectance = 0.5
                waterP.Parent = plazaModel

                -- Columna central de la fuente con surtidor de luz cálida
                local spout = makePart("Fountain_Spout", Vector3.new(2, 6, 2), CFrame.new(bCenterX, cy + curbH + 4, bCenterZ), Color3.fromRGB(200, 195, 188), Enum.Material.Marble, true)
                spout.Parent = plazaModel
                local fLight = Instance.new("PointLight", spout)
                fLight.Color = Color3.fromRGB(200, 235, 255)
                fLight.Range = 24
                fLight.Brightness = 1.6

                -- 4 Bancos de parque alrededor de la fuente
                local bDist = fountainR + 6
                local benchOffsets = {
                    {0, bDist, 0},
                    {0, -bDist, math.rad(180)},
                    {-bDist, 0, math.rad(90)},
                    {bDist, 0, math.rad(-90)},
                }
                for bi, bDef in ipairs(benchOffsets) do
                    local bCF = CFrame.new(bCenterX + bDef[1], cy + curbH + 0.4, bCenterZ + bDef[2]) * CFrame.Angles(0, bDef[3], 0)
                    local benchSeat = makePart("Plaza_Bench_" .. bi, Vector3.new(6, 0.4, 1.8), bCF * CFrame.new(0, 1.2, 0), Color3.fromRGB(115, 75, 45), Enum.Material.WoodPlanks, true)
                    benchSeat.Parent = plazaModel
                    local benchBack = makePart("Plaza_BenchBack_" .. bi, Vector3.new(6, 1.4, 0.3), bCF * CFrame.new(0, 2.2, -0.8), Color3.fromRGB(115, 75, 45), Enum.Material.WoodPlanks, false)
                    benchBack.Parent = plazaModel
                    local legL = makePart("Bench_Leg_L", Vector3.new(0.4, 1.2, 1.8), bCF * CFrame.new(-2.6, 0.6, 0), Color3.fromRGB(35, 38, 42), Enum.Material.Metal, true)
                    legL.Parent = plazaModel
                    local legR = makePart("Bench_Leg_R", Vector3.new(0.4, 1.2, 1.8), bCF * CFrame.new(2.6, 0.6, 0), Color3.fromRGB(35, 38, 42), Enum.Material.Metal, true)
                    legR.Parent = plazaModel
                end
            else
                -- EDIFICIO ARQUITECTÓNICO EN LA PARCELA
                local isCorner = (c == 1 or c == cols) and (r == 1 or r == rows)
                local floorCount = 5

                if density == "high" then
                    floorCount = isCorner and math.floor(10 + ((bSeed * 7) % 7)) or math.floor(5 + ((bSeed * 5) % 5))
                elseif density == "medium" then
                    floorCount = isCorner and math.floor(6 + ((bSeed * 4) % 4)) or math.floor(3 + ((bSeed * 3) % 3))
                elseif density == "low" then
                    floorCount = math.floor(2 + ((bSeed * 3) % 2))
                else -- mixed
                    floorCount = isCorner and math.floor(12 + ((bSeed * 8) % 6)) or math.floor(3 + ((bSeed * 4) % 4))
                end

                local bW = parcelW
                local bD = parcelL
                local groundH = 14
                local upperH = 10.5
                local totalH = groundH + (floorCount - 1) * upperH

                -- Paleta de color y materiales PBR del edificio
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

                local bBaseY = cy + curbH
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

                -- A. CIMENTACIÓN Y ZÓCALO INFERIOR
                makeBPart("Plinth", Vector3.new(bW + 0.8, 1.8, bD + 0.8),
                    CFrame.new(bCenterX, bBaseY + 0.9, bCenterZ),
                    Color3.fromRGB(${styleConfig.baseboardColor[0]}, ${styleConfig.baseboardColor[1]}, ${styleConfig.baseboardColor[2]}),
                    Enum.Material.${styleConfig.baseboardMaterial}, true)

                -- B. CUERPO ESTRUCTURAL PRINCIPAL
                makeBPart("Body", Vector3.new(bW, totalH, bD),
                    CFrame.new(bCenterX, bBaseY + totalH / 2, bCenterZ),
                    colFacade, Enum.Material.${styleConfig.facadeMaterials[0]}, true)

                -- C. PILASTRAS EN RELIEVE EN LAS 4 ESQUINAS
                local pilCol = Color3.fromRGB(${styleConfig.pillarColor[0]}, ${styleConfig.pillarColor[1]}, ${styleConfig.pillarColor[2]})
                local pilMat = Enum.Material.${styleConfig.pillarMaterial}
                local pilThick = 1.2
                makeBPart("Pillar_NW", Vector3.new(pilThick, totalH, pilThick), CFrame.new(bCenterX - bW/2, bBaseY + totalH/2, bCenterZ - bD/2), pilCol, pilMat, false, true)
                makeBPart("Pillar_NE", Vector3.new(pilThick, totalH, pilThick), CFrame.new(bCenterX + bW/2, bBaseY + totalH/2, bCenterZ - bD/2), pilCol, pilMat, false, true)
                makeBPart("Pillar_SW", Vector3.new(pilThick, totalH, pilThick), CFrame.new(bCenterX - bW/2, bBaseY + totalH/2, bCenterZ + bD/2), pilCol, pilMat, false, true)
                makeBPart("Pillar_SE", Vector3.new(pilThick, totalH, pilThick), CFrame.new(bCenterX + bW/2, bBaseY + totalH/2, bCenterZ + bD/2), pilCol, pilMat, false, true)

                -- D. CORNISA SOBRE PLANTA BAJA (Separación de escala comercial)
                local cornCol = Color3.fromRGB(${styleConfig.corniceColor[0]}, ${styleConfig.corniceColor[1]}, ${styleConfig.corniceColor[2]})
                local cornMat = Enum.Material.${styleConfig.corniceMaterial}
                makeBPart("Cornice_Ground", Vector3.new(bW + 1.2, 1.0, bD + 1.2), CFrame.new(bCenterX, bBaseY + groundH, bCenterZ), cornCol, cornMat, false, true)

                -- E. DETERMINACIÓN INTELIGENTE DE FACHADAS ACTIVAS HACIA LA CALLE
                -- Identificar cuáles de los 4 lados dan a la calle perimetral exterior
                local facesNorth = (r == 1)
                local facesSouth = (r == rows)
                local facesWest = (c == 1)
                local facesEast = (c == cols)

                -- Función constructora de fachada comercial y portal hacia la calle
                local function buildStreetFacade(faceDir, widthAlong, depthNormal, centerPos, rotY)
                    local frontOffset = depthNormal / 2 + 0.2
                    local normalVector = faceDir == "South" and Vector3.new(0, 0, 1)
                        or faceDir == "North" and Vector3.new(0, 0, -1)
                        or faceDir == "West" and Vector3.new(-1, 0, 0)
                        or Vector3.new(1, 0, 0)

                    local facadeCF = CFrame.new(centerPos) * CFrame.Angles(0, rotY, 0)

                    -- 1. Portal de entrada remetido con doble puerta de cristal/metal
                    local dPortalW = 6.4
                    local dPortalH = 8.5
                    local dAlcove = 1.6
                    local dCenterCF = facadeCF * CFrame.new(0, dPortalH / 2, frontOffset - dAlcove / 2)

                    -- Marco de la entrada
                    makeBPart("Entrance_Frame", Vector3.new(dPortalW + 1.0, dPortalH + 0.6, dAlcove + 0.4), dCenterCF, pilCol, pilMat, true)

                    -- Doble hoja de puerta
                    local leafW = (dPortalW - 0.4) / 2
                    local leafH = 7.2
                    local dLeafL = makeBPart("Door_Leaf_L", Vector3.new(leafW, leafH, 0.3), facadeCF * CFrame.new(-leafW / 2 - 0.1, leafH / 2 + 0.2, frontOffset - dAlcove), Color3.fromRGB(${styleConfig.doorColor[0]}, ${styleConfig.doorColor[1]}, ${styleConfig.doorColor[2]}), Enum.Material.${styleConfig.doorMaterial}, true)
                    local dLeafR = makeBPart("Door_Leaf_R", Vector3.new(leafW, leafH, 0.3), facadeCF * CFrame.new(leafW / 2 + 0.1, leafH / 2 + 0.2, frontOffset - dAlcove), Color3.fromRGB(${styleConfig.doorColor[0]}, ${styleConfig.doorColor[1]}, ${styleConfig.doorColor[2]}), Enum.Material.${styleConfig.doorMaterial}, true)

                    -- Manillas de puerta
                    makeBPart("Handle_L", Vector3.new(0.2, 2.0, 0.2), facadeCF * CFrame.new(-0.5, 3.8, frontOffset - dAlcove + 0.2), Color3.fromRGB(${styleConfig.doorHandleColor[0]}, ${styleConfig.doorHandleColor[1]}, ${styleConfig.doorHandleColor[2]}), Enum.Material.Metal, false, true)
                    makeBPart("Handle_R", Vector3.new(0.2, 2.0, 0.2), facadeCF * CFrame.new(0.5, 3.8, frontOffset - dAlcove + 0.2), Color3.fromRGB(${styleConfig.doorHandleColor[0]}, ${styleConfig.doorHandleColor[1]}, ${styleConfig.doorHandleColor[2]}), Enum.Material.Metal, false, true)

                    -- Luz cálida en el techo del portal
                    local pLight = Instance.new("PointLight", dLeafL)
                    pLight.Color = Color3.fromRGB(255, 235, 185)
                    pLight.Range = 14
                    pLight.Brightness = 1.4

                    -- 2. Escaparates comerciales a los lados de la puerta
                    local sideShopW = (widthAlong - dPortalW - 4) / 2
                    if sideShopW > 4 then
                        local shopOffset = widthAlong / 2 - sideShopW / 2 - 1.2
                        local shopH = 7.8
                        local shopY = shopH / 2 + 1.2

                        -- Escaparate Izquierdo
                        local gL = makeBPart("Showcase_L", Vector3.new(sideShopW, shopH, 0.3), facadeCF * CFrame.new(-shopOffset, shopY, frontOffset), Color3.fromRGB(${styleConfig.glassColor[0]}, ${styleConfig.glassColor[1]}, ${styleConfig.glassColor[2]}), Enum.Material.Glass, false, true)
                        gL.Transparency = 0.32
                        gL.Reflectance = 0.45

                        -- Escaparate Derecho
                        local gR = makeBPart("Showcase_R", Vector3.new(sideShopW, shopH, 0.3), facadeCF * CFrame.new(shopOffset, shopY, frontOffset), Color3.fromRGB(${styleConfig.glassColor[0]}, ${styleConfig.glassColor[1]}, ${styleConfig.glassColor[2]}), Enum.Material.Glass, false, true)
                        gR.Transparency = 0.32
                        gR.Reflectance = 0.45

                        -- Toldos a 45° sobre los escaparates
                        local awnDepth = 3.2
                        local awnH = 2.2
                        local awnY = shopH + 1.8
                        local awnZ = frontOffset + awnDepth / 2

                        makeBWedge("Awning_L", Vector3.new(sideShopW, awnH, awnDepth), facadeCF * CFrame.new(-shopOffset, awnY, awnZ) * CFrame.Angles(0, math.rad(180), 0), colAwning, Enum.Material.${styleConfig.awningMaterial})
                        makeBWedge("Awning_R", Vector3.new(sideShopW, awnH, awnDepth), facadeCF * CFrame.new(shopOffset, awnY, awnZ) * CFrame.Angles(0, math.rad(180), 0), colAwning, Enum.Material.${styleConfig.awningMaterial})

                        -- Rótulo comercial iluminado 3D (Fascia)
                        local signH = 1.6
                        local signY = awnY + 1.6
                        local signBoard = makeBPart("Store_Sign", Vector3.new(sideShopW, signH, 0.5), facadeCF * CFrame.new(-shopOffset, signY, frontOffset + 0.2), Color3.fromRGB(32, 34, 40), Enum.Material.SmoothPlastic, false, true)
                        local signGlowP = makeBPart("Sign_Neon", Vector3.new(sideShopW - 1, 0.7, 0.2), facadeCF * CFrame.new(-shopOffset, signY, frontOffset + 0.48), buildingSignGlow, Enum.Material.Neon, false, true)
                        local sLight = Instance.new("PointLight", signGlowP)
                        sLight.Color = buildingSignGlow
                        sLight.Range = 12
                        sLight.Brightness = 1.1

                        -- Veladores / Cafetería en la acera frente al edificio
                        local tCF = facadeCF * CFrame.new(shopOffset, 1.4, frontOffset + awnDepth + 2.0)
                        local cTable = makeBPart("Cafe_Table", Vector3.new(2.4, 0.2, 2.4), tCF * CFrame.new(0, 1.2, 0), Color3.fromRGB(50, 45, 40), Enum.Material.WoodPlanks, true)
                        makeBPart("Cafe_Chair_1", Vector3.new(1.4, 1.4, 1.4), tCF * CFrame.new(-1.6, 0.7, 0), Color3.fromRGB(38, 40, 45), Enum.Material.Metal, true)
                        makeBPart("Cafe_Chair_2", Vector3.new(1.4, 1.4, 1.4), tCF * CFrame.new(1.6, 0.7, 0), Color3.fromRGB(38, 40, 45), Enum.Material.Metal, true)
                    end
                end

                -- Función constructora de fachada de callejón (Servicio, contenedores, palets)
                local function buildAlleyFacade(faceDir, widthAlong, depthNormal, centerPos, rotY)
                    local frontOffset = depthNormal / 2 + 0.1
                    local facadeCF = CFrame.new(centerPos) * CFrame.Angles(0, rotY, 0)

                    -- Puerta metálica de servicio
                    local srvDoor = makeBPart("Service_Exit_Door", Vector3.new(3.8, 7.5, 0.3), facadeCF * CFrame.new(0, 3.75, frontOffset), Color3.fromRGB(55, 58, 65), Enum.Material.Metal, true)
                    local srvL = Instance.new("PointLight", srvDoor)
                    srvL.Color = Color3.fromRGB(255, 210, 140)
                    srvL.Range = 12
                    srvL.Brightness = 1.2

                    -- Contenedor de basura industrial (Dumpster) en el callejón
                    local dumpCF = facadeCF * CFrame.new(-widthAlong / 2 + 5, 2.2, frontOffset + 3.2)
                    makeBPart("Alley_Dumpster", Vector3.new(6.5, 4.4, 4.0), dumpCF, Color3.fromRGB(45, 80, 55), Enum.Material.Metal, true)
                    -- Tapa del contenedor
                    makeBPart("Dumpster_Lid", Vector3.new(6.7, 0.4, 4.2), dumpCF * CFrame.new(0, 2.3, 0), Color3.fromRGB(35, 38, 42), Enum.Material.SmoothPlastic, true)

                    -- Pilas de palets de madera en el callejón
                    local palCF = facadeCF * CFrame.new(widthAlong / 2 - 4.5, 0.8, frontOffset + 2.5)
                    makeBPart("Wooden_Pallet_1", Vector3.new(4, 0.5, 4), palCF, Color3.fromRGB(130, 95, 60), Enum.Material.WoodPlanks, true)
                    makeBPart("Wooden_Pallet_2", Vector3.new(4, 0.5, 4), palCF * CFrame.new(0, 0.5, 0), Color3.fromRGB(125, 90, 55), Enum.Material.WoodPlanks, true)
                end

                -- Aplicar fachadas según orientación
                if facesSouth then
                    buildStreetFacade("South", bW, bD, Vector3.new(bCenterX, bBaseY, bCenterZ), 0)
                else
                    buildAlleyFacade("South", bW, bD, Vector3.new(bCenterX, bBaseY, bCenterZ), 0)
                end

                if facesNorth then
                    buildStreetFacade("North", bW, bD, Vector3.new(bCenterX, bBaseY, bCenterZ), math.rad(180))
                else
                    buildAlleyFacade("North", bW, bD, Vector3.new(bCenterX, bBaseY, bCenterZ), math.rad(180))
                end

                if facesWest then
                    buildStreetFacade("West", bD, bW, Vector3.new(bCenterX, bBaseY, bCenterZ), math.rad(-90))
                end

                if facesEast then
                    buildStreetFacade("East", bD, bW, Vector3.new(bCenterX, bBaseY, bCenterZ), math.rad(90))
                end

                -- F. VENTANAS MODULARES EN PISOS SUPERIORES EN LAS 4 DIRECCIONES
                local winW = 3.4
                local winH = 5.2
                local numWinX = math.max(2, math.floor(bW / 8))
                local stepX = bW / numWinX
                local numWinZ = math.max(2, math.floor(bD / 8))
                local stepZ = bD / numWinZ

                for fl = 1, floorCount - 1 do
                    local flY = bBaseY + groundH + (fl - 0.5) * upperH

                    -- Cornisa divisoria horizontal entre pisos
                    if fl < floorCount - 1 then
                        makeBPart("Cornice_Fl_" .. fl, Vector3.new(bW + 0.6, 0.6, bD + 0.6), CFrame.new(bCenterX, bBaseY + groundH + fl * upperH, bCenterZ), cornCol, cornMat, false, true)
                    end

                    -- Ventanas Fachada Sur (+Z)
                    for wx = 1, numWinX do
                        local wX = bCenterX - bW / 2 + (wx - 0.5) * stepX
                        local isLit = ((bSeed * 17 + fl * 29 + wx * 19) % 100) < 48
                        local wPart = makeBPart("Win_S_" .. fl .. "_" .. wx, Vector3.new(winW, winH, 0.2), CFrame.new(wX, flY, bCenterZ + bD / 2 + 0.1), Color3.fromRGB(${styleConfig.glassColor[0]}, ${styleConfig.glassColor[1]}, ${styleConfig.glassColor[2]}), Enum.Material.Glass, false, true)
                        wPart.Transparency = 0.35
                        wPart.Reflectance = 0.4
                        -- Alféizar
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

                    -- Ventanas Fachada Norte (-Z)
                    for wx = 1, numWinX do
                        local wX = bCenterX - bW / 2 + (wx - 0.5) * stepX
                        local isLit = ((bSeed * 23 + fl * 19 + wx * 31) % 100) < 40
                        local wPart = makeBPart("Win_N_" .. fl .. "_" .. wx, Vector3.new(winW, winH, 0.2), CFrame.new(wX, flY, bCenterZ - bD / 2 - 0.1), Color3.fromRGB(${styleConfig.glassColor[0]}, ${styleConfig.glassColor[1]}, ${styleConfig.glassColor[2]}), Enum.Material.Glass, false, true)
                        wPart.Transparency = 0.35
                        wPart.Reflectance = 0.4
                        makeBPart("Sill_N", Vector3.new(winW + 0.6, 0.4, 0.6), CFrame.new(wX, flY - winH / 2 - 0.2, bCenterZ - bD / 2 - 0.3), cornCol, cornMat, false, true)

                        if isLit then
                            wPart.Material = Enum.Material.Neon
                            wPart.Color = Color3.fromRGB(${styleConfig.coolInteriorColor[0]}, ${styleConfig.coolInteriorColor[1]}, ${styleConfig.coolInteriorColor[2]})
                            wPart.Transparency = 0.1
                            local pL = Instance.new("PointLight", wPart)
                            pL.Color = wPart.Color
                            pL.Range = 10
                            pL.Brightness = 0.6
                        end
                    end

                    -- Ventanas Fachada Oeste (-X)
                    for wz = 1, numWinZ do
                        local wZ = bCenterZ - bD / 2 + (wz - 0.5) * stepZ
                        local wPart = makeBPart("Win_W_" .. fl .. "_" .. wz, Vector3.new(0.2, winH, winW), CFrame.new(bCenterX - bW / 2 - 0.1, flY, wZ), Color3.fromRGB(${styleConfig.glassColor[0]}, ${styleConfig.glassColor[1]}, ${styleConfig.glassColor[2]}), Enum.Material.Glass, false, true)
                        wPart.Transparency = 0.35
                        makeBPart("Sill_W", Vector3.new(0.6, 0.4, winW + 0.6), CFrame.new(bCenterX - bW / 2 - 0.3, flY - winH / 2 - 0.2, wZ), cornCol, cornMat, false, true)
                    end

                    -- Ventanas Fachada Este (+X)
                    for wz = 1, numWinZ do
                        local wZ = bCenterZ - bD / 2 + (wz - 0.5) * stepZ
                        local wPart = makeBPart("Win_E_" .. fl .. "_" .. wz, Vector3.new(0.2, winH, winW), CFrame.new(bCenterX + bW / 2 + 0.1, flY, wZ), Color3.fromRGB(${styleConfig.glassColor[0]}, ${styleConfig.glassColor[1]}, ${styleConfig.glassColor[2]}), Enum.Material.Glass, false, true)
                        wPart.Transparency = 0.35
                        makeBPart("Sill_E", Vector3.new(0.6, 0.4, winW + 0.6), CFrame.new(bCenterX + bW / 2 + 0.3, flY - winH / 2 - 0.2, wZ), cornCol, cornMat, false, true)
                    end
                end

                -- G. AZOTEA HABITABLE CON PARAPETO Y ALBARDILLA
                local roofY = bBaseY + totalH
                makeBPart("Roof_Slab", Vector3.new(bW, 1.4, bD), CFrame.new(bCenterX, roofY - 0.7, bCenterZ), Color3.fromRGB(${styleConfig.roofFloorColor[0]}, ${styleConfig.roofFloorColor[1]}, ${styleConfig.roofFloorColor[2]}), Enum.Material.Concrete, true)
                makeBPart("Parapet_F", Vector3.new(bW, 2.4, 0.8), CFrame.new(bCenterX, roofY + 1.2, bCenterZ + bD/2 - 0.4), Color3.fromRGB(${styleConfig.parapetColor[0]}, ${styleConfig.parapetColor[1]}, ${styleConfig.parapetColor[2]}), Enum.Material.${styleConfig.parapetMaterial}, true)
                makeBPart("Parapet_B", Vector3.new(bW, 2.4, 0.8), CFrame.new(bCenterX, roofY + 1.2, bCenterZ - bD/2 + 0.4), Color3.fromRGB(${styleConfig.parapetColor[0]}, ${styleConfig.parapetColor[1]}, ${styleConfig.parapetColor[2]}), Enum.Material.${styleConfig.parapetMaterial}, true)
                makeBPart("Parapet_L", Vector3.new(0.8, 2.4, bD), CFrame.new(bCenterX - bW/2 + 0.4, roofY + 1.2, bCenterZ), Color3.fromRGB(${styleConfig.parapetColor[0]}, ${styleConfig.parapetColor[1]}, ${styleConfig.parapetColor[2]}), Enum.Material.${styleConfig.parapetMaterial}, true)
                makeBPart("Parapet_R", Vector3.new(0.8, 2.4, bD), CFrame.new(bCenterX + bW/2 - 0.4, roofY + 1.2, bCenterZ), Color3.fromRGB(${styleConfig.parapetColor[0]}, ${styleConfig.parapetColor[1]}, ${styleConfig.parapetColor[2]}), Enum.Material.${styleConfig.parapetMaterial}, true)

                -- H. MAQUINARIA DE AZOTEA (HVAC, Antena con baliza roja)
                if bW >= 22 then
                    -- Climatizador HVAC doble ventilador
                    local hvac = makeBPart("HVAC", Vector3.new(7.0, 3.8, 5.5), CFrame.new(bCenterX + bW/4, roofY + 1.9, bCenterZ + bD/4), Color3.fromRGB(150, 155, 162), Enum.Material.DiamondPlate, true)
                    local fan1 = makeBPart("HVAC_Fan1", Vector3.new(2.4, 0.3, 2.4), CFrame.new(bCenterX + bW/4 - 1.5, roofY + 3.9, bCenterZ + bD/4), Color3.fromRGB(40, 42, 48), Enum.Material.Metal, false, true)
                    fan1.Shape = Enum.PartType.Cylinder
                    fan1.CFrame = CFrame.new(bCenterX + bW/4 - 1.5, roofY + 3.9, bCenterZ + bD/4) * CFrame.Angles(0, 0, math.rad(90))

                    -- Antena con baliza roja
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
      hasFurniture
        ? `
    -- 5. MOBILIARIO URBANO DE ACERAS AAA (Farolas con sombras, árboles en alcorques, bocas de incendio, bancos y papeleras)
    local furnModel = Instance.new("Model", districtModel)
    furnModel.Name = "District_StreetFurniture"

    local function spawnLamp(cf)
        local pole = makePart("Lamp_Pole", Vector3.new(0.8, 15, 0.8), cf * CFrame.new(0, 7.5, 0), Color3.fromRGB(42, 45, 52), Enum.Material.Metal, true)
        pole.Parent = furnModel
        local arm = makePart("Lamp_Arm", Vector3.new(0.6, 0.6, 3.2), cf * CFrame.new(0, 14.8, 1.4), Color3.fromRGB(42, 45, 52), Enum.Material.Metal, false)
        arm.Parent = furnModel
        local head = makePart("Lamp_Head", Vector3.new(1.4, 0.6, 1.8), cf * CFrame.new(0, 14.5, 2.6), Color3.fromRGB(35, 38, 44), Enum.Material.Metal, false)
        head.Parent = furnModel
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
        local soil = makePart("Tree_Soil", Vector3.new(3.4, 0.2, 3.4), cf * CFrame.new(0, 0.12, 0), Color3.fromRGB(75, 55, 40), Enum.Material.Ground, false)
        soil.Parent = furnModel
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

    -- Distribuir mobiliario a lo largo de las 4 aceras perimetrales
    local furnStep = 40
    -- Aceras Sur y Norte
    for fx = blockMinX + 16, blockMaxX - 16, furnStep do
        local southCF = CFrame.new(fx, cy + curbH, blockMaxZ - swW / 2)
        local northCF = CFrame.new(fx, cy + curbH, blockMinZ + swW / 2) * CFrame.Angles(0, math.rad(180), 0)

        spawnLamp(southCF)
        spawnTree(southCF * CFrame.new(furnStep / 2, 0, 0))
        spawnLamp(northCF)
        spawnTree(northCF * CFrame.new(furnStep / 2, 0, 0))
    end
    -- Aceras Oeste y Este
    for fz = blockMinZ + 20, blockMaxZ - 20, furnStep do
        local westCF = CFrame.new(blockMinX + swW / 2, cy + curbH, fz) * CFrame.Angles(0, math.rad(90), 0)
        local eastCF = CFrame.new(blockMaxX - swW / 2, cy + curbH, fz) * CFrame.Angles(0, math.rad(-90), 0)

        spawnBench(westCF)
        spawnTree(eastCF)
    end

    -- Bocas de incendio en esquinas de acera
    spawnHydrant(CFrame.new(blockMinX + 6, cy + curbH, blockMaxZ - 6))
    spawnHydrant(CFrame.new(blockMaxX - 6, cy + curbH, blockMaxZ - 6))
    spawnHydrant(CFrame.new(blockMinX + 6, cy + curbH, blockMinZ + 6))
    spawnHydrant(CFrame.new(blockMaxX - 6, cy + curbH, blockMinZ + 6))
    `
        : ""
    }

    print(string.format("[DistrictEngine AAA] ✅ Distrito '%s' (%s, densidad %s, %dx%d studs) generado con éxito en '%s'.", "${name}", "${style}", density, totalW, totalL, "${parent}"))
end

buildCompleteDistrict()
`;
}
