import { getStylePreset } from "./stylePresets.js";
import { snapVal } from "./grid.js";

/**
 * Generador Urbano Macro AAA: Crea distritos y manzanas completas
 * con calzadas de asfalto, bordillos de granito, pasos de cebra, aceras elevadas,
 * subdivisión de parcelas densas (sin huecos aleatorios), variedad de alturas y estilos,
 * mobiliario urbano (farolas con sombras, árboles, bocas de incendio) y cimentación nivelada.
 */
export function generateDistrictLuau({
  name = "Downtown_District",
  center = [0, 0, 0],
  size = [240, 240], // [widthX, lengthZ]
  style = "modern_downtown",
  density = "high", // "high", "medium", "low", "mixed"
  streetWidth = 28,
  sidewalkWidth = 8,
  seed = 54321,
  hasFurniture = true,
  alignToTerrain = true,
  parent = "City/Districts",
}) {
  const [cx, cy, cz] = [snapVal(center[0], 4), snapVal(center[1], 4), snapVal(center[2], 4)];
  const [totalW, totalL] = [Math.max(120, snapVal(size[0], 4)), Math.max(120, snapVal(size[1] || size[2] || 240, 4))];
  const sWidth = Math.max(16, snapVal(streetWidth, 4));
  const swWidth = Math.max(6, snapVal(sidewalkWidth, 2));
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
    -- 0. NIVELADO AUTOMÁTICO DE TERRENO (Evitar que edificios floten)
    pcall(function()
        local Terrain = workspace.Terrain
        local clCF = CFrame.new(cx, cy + 40, cz)
        local clSz = Vector3.new(totalW + 20, 80, totalL + 20)
        Terrain:FillBlock(clCF, clSz, Enum.Material.Air)

        local padCF = CFrame.new(cx, cy - 8, cz)
        local padSz = Vector3.new(totalW + 20, 16, totalL + 20)
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
        w.Material = mat or Enum.Material.SmoothPlastic
        return w
    end

    -- 1. CALZADAS PERIMETRALES Y CENTRALES (Asfalto oscuro con bordillos)
    local colAsphalt = Color3.fromRGB(36, 38, 42)
    local colCurb = Color3.fromRGB(150, 155, 160)
    local colSidewalk = Color3.fromRGB(185, 188, 192)
    local colStripeYellow = Color3.fromRGB(235, 195, 45)
    local colStripeWhite = Color3.fromRGB(240, 242, 245)

    local halfW = totalW / 2
    local halfL = totalL / 2

    -- Calzada Norte (-Z) y Sur (+Z)
    makePart("Road_North", Vector3.new(totalW, 1, streetW), CFrame.new(cx, cy - 0.5, cz - halfL + streetW / 2), colAsphalt, Enum.Material.Concrete)
    makePart("Road_South", Vector3.new(totalW, 1, streetW), CFrame.new(cx, cy - 0.5, cz + halfL - streetW / 2), colAsphalt, Enum.Material.Concrete)

    -- Calzada Oeste (-X) y Este (+X)
    makePart("Road_West", Vector3.new(streetW, 1, totalL - streetW * 2), CFrame.new(cx - halfW + streetW / 2, cy - 0.5, cz), colAsphalt, Enum.Material.Concrete)
    makePart("Road_East", Vector3.new(streetW, 1, totalL - streetW * 2), CFrame.new(cx + halfW - streetW / 2, cy - 0.5, cz), colAsphalt, Enum.Material.Concrete)

    -- Líneas viales amarillas discontinuas en la calzada Sur
    local stripeLen = 6
    local stripeGap = 6
    local numStripes = math.floor(totalW / (stripeLen + stripeGap))
    for s = 1, numStripes do
        local stX = cx - halfW + (s - 0.5) * (stripeLen + stripeGap)
        makePart("Stripe_S_" .. s, Vector3.new(stripeLen, 0.1, 0.8), CFrame.new(stX, cy + 0.05, cz + halfL - streetW / 2), colStripeYellow, Enum.Material.SmoothPlastic, false, true)
        makePart("Stripe_N_" .. s, Vector3.new(stripeLen, 0.1, 0.8), CFrame.new(stX, cy + 0.05, cz - halfL + streetW / 2), colStripeYellow, Enum.Material.SmoothPlastic, false, true)
    end

    -- 2. ACERAS ELEVADAS (+0.6 studs con bordillos)
    local curbH = 0.6
    local blockMinX = cx - halfW + streetW
    local blockMaxX = cx + halfW - streetW
    local blockMinZ = cz - halfL + streetW
    local blockMaxZ = cz + halfL - streetW
    local blockW = blockMaxX - blockMinX
    local blockL = blockMaxZ - blockMinZ

    -- Losa completa de la manzana peatonal
    makePart("City_Block_Platform", Vector3.new(blockW, curbH, blockL), CFrame.new(cx, cy + curbH / 2, cz), colSidewalk, Enum.Material.Concrete, true)

    -- Bordillos de granito exteriores
    local curbThick = 0.8
    makePart("Curb_North", Vector3.new(blockW, curbH + 0.1, curbThick), CFrame.new(cx, cy + curbH / 2, blockMinZ + curbThick / 2), colCurb, Enum.Material.Concrete, true)
    makePart("Curb_South", Vector3.new(blockW, curbH + 0.1, curbThick), CFrame.new(cx, cy + curbH / 2, blockMaxZ - curbThick / 2), colCurb, Enum.Material.Concrete, true)
    makePart("Curb_West", Vector3.new(curbThick, curbH + 0.1, blockL), CFrame.new(blockMinX + curbThick / 2, cy + curbH / 2, cz), colCurb, Enum.Material.Concrete, true)
    makePart("Curb_East", Vector3.new(curbThick, curbH + 0.1, blockL), CFrame.new(blockMaxX - curbThick / 2, cy + curbH / 2, cz), colCurb, Enum.Material.Concrete, true)

    -- Pasos de cebra peatonales en las 4 esquinas de la manzana
    local function spawnCrosswalk(centerCF, length, isHoriz)
        local numBars = 5
        local barW = 2.0
        local barGap = 1.5
        for b = 1, numBars do
            local offset = (b - (numBars + 1) / 2) * (barW + barGap)
            local cf = isHoriz and centerCF * CFrame.new(offset, 0.06, 0) or centerCF * CFrame.new(0, 0.06, offset)
            local sz = isHoriz and Vector3.new(barW, 0.1, length) or Vector3.new(length, 0.1, barW)
            makePart("Zebra_Bar", sz, cf, colStripeWhite, Enum.Material.SmoothPlastic, false, true)
        end
    end

    spawnCrosswalk(CFrame.new(blockMinX - streetW / 2, cy, blockMinZ + 8), streetW - 2, false)
    spawnCrosswalk(CFrame.new(blockMaxX + streetW / 2, cy, blockMinZ + 8), streetW - 2, false)
    spawnCrosswalk(CFrame.new(blockMinX - streetW / 2, cy, blockMaxZ - 8), streetW - 2, false)
    spawnCrosswalk(CFrame.new(blockMaxX + streetW / 2, cy, blockMaxZ - 8), streetW - 2, false)

    -- 3. SUBDIVISIÓN DE MANZANA EN PARCELAS URBANAS DENSAS (Sin huecos feos)
    -- Dejamos acera libre perimetral de swW studs para los peatones
    local usableMinX = blockMinX + swW
    local usableMaxX = blockMaxX - swW
    local usableMinZ = blockMinZ + swW
    local usableMaxZ = blockMaxZ - swW
    local buildableW = usableMaxX - usableMinX
    local buildableL = usableMaxZ - usableMinZ

    -- Subdivisión en cuadrícula de 2x2, 2x3 o 3x3 parcelas con callejones estrechos (4-6 studs)
    local cols = buildableW >= 120 and 3 or 2
    local rows = buildableL >= 120 and 3 or 2
    local alleyW = 6

    local parcelW = (buildableW - (cols - 1) * alleyW) / cols
    local parcelL = (buildableL - (rows - 1) * alleyW) / rows

    -- Callejones de servicio asfaltados entre edificios (para atmósfera urbana realista)
    for c = 1, cols - 1 do
        local alleyX = usableMinX + c * parcelW + (c - 0.5) * alleyW
        makePart("Service_Alley_V_" .. c, Vector3.new(alleyW, curbH, buildableL), CFrame.new(alleyX, cy + curbH / 2, cz), colAsphalt, Enum.Material.Concrete, true)
    end
    for r = 1, rows - 1 do
        local alleyZ = usableMinZ + r * parcelL + (r - 0.5) * alleyW
        makePart("Service_Alley_H_" .. r, Vector3.new(buildableW, curbH, alleyW), CFrame.new(cx, cy + curbH / 2, alleyZ), colAsphalt, Enum.Material.Concrete, true)
    end

    -- 4. GENERACIÓN DE EDIFICIOS ARQUITECTÓNICOS EN CADA PARCELA
    local bCount = 0
    for c = 1, cols do
        for r = 1, rows do
            bCount = bCount + 1
            local bCenterX = usableMinX + (c - 0.5) * parcelW + (c - 1) * alleyW
            local bCenterZ = usableMinZ + (r - 0.5) * parcelL + (r - 1) * alleyW

            -- Determinar altura según densidad y posición (las esquinas suelen ser más altas)
            local isCorner = (c == 1 or c == cols) and (r == 1 or r == rows)
            local floorCount = 5

            if density == "high" then
                floorCount = isCorner and math.floor(10 + ((seedVal * bCount * 7) % 7)) or math.floor(6 + ((seedVal * bCount * 5) % 5))
            elseif density == "medium" then
                floorCount = isCorner and math.floor(6 + ((seedVal * bCount * 4) % 4)) or math.floor(4 + ((seedVal * bCount * 3) % 3))
            elseif density == "low" then
                floorCount = math.floor(2 + ((seedVal * bCount * 3) % 3))
            else -- mixed
                floorCount = isCorner and math.floor(12 + ((seedVal * bCount * 6) % 6)) or math.floor(3 + ((seedVal * bCount * 4) % 4))
            end

            -- Variación cromática y estilo
            local bSeed = seedVal + bCount * 101
            local bW = parcelW
            local bD = parcelL
            local groundH = 13
            local upperH = 10
            local totalH = groundH + (floorCount - 1) * upperH

            local colList = {
                ${styleConfig.facadeColors.map((c) => `Color3.fromRGB(${c[0]}, ${c[1]}, ${c[2]})`).join(", ")}
            }
            local colFacade = colList[(bSeed % #colList) + 1]
            local colAwningList = {
                ${styleConfig.awningColors.map((c) => `Color3.fromRGB(${c[0]}, ${c[1]}, ${c[2]})`).join(", ")}
            }
            local colAwning = colAwningList[(bSeed % #colAwningList) + 1]

            -- Estructura del edificio en la parcela
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

            -- Zócalo exterior
            makeBPart("Plinth", Vector3.new(bW + 0.8, 1.8, bD + 0.8), CFrame.new(bCenterX, bBaseY + 0.9, bCenterZ), Color3.fromRGB(${styleConfig.baseboardColor[0]}, ${styleConfig.baseboardColor[1]}, ${styleConfig.baseboardColor[2]}), Enum.Material.${styleConfig.baseboardMaterial}, true)
            -- Cuerpo principal
            makeBPart("Body", Vector3.new(bW, totalH, bD), CFrame.new(bCenterX, bBaseY + totalH / 2, bCenterZ), colFacade, Enum.Material.${styleConfig.facadeMaterials[0]}, true)

            -- Columnas de esquina en relieve
            local pilCol = Color3.fromRGB(${styleConfig.pillarColor[0]}, ${styleConfig.pillarColor[1]}, ${styleConfig.pillarColor[2]})
            local pilMat = Enum.Material.${styleConfig.pillarMaterial}
            local pilThick = 1.0
            makeBPart("Pillar_NW", Vector3.new(pilThick, totalH, pilThick), CFrame.new(bCenterX - bW/2, bBaseY + totalH/2, bCenterZ - bD/2), pilCol, pilMat, false, true)
            makeBPart("Pillar_NE", Vector3.new(pilThick, totalH, pilThick), CFrame.new(bCenterX + bW/2, bBaseY + totalH/2, bCenterZ - bD/2), pilCol, pilMat, false, true)
            makeBPart("Pillar_SW", Vector3.new(pilThick, totalH, pilThick), CFrame.new(bCenterX - bW/2, bBaseY + totalH/2, bCenterZ + bD/2), pilCol, pilMat, false, true)
            makeBPart("Pillar_SE", Vector3.new(pilThick, totalH, pilThick), CFrame.new(bCenterX + bW/2, bBaseY + totalH/2, bCenterZ + bD/2), pilCol, pilMat, false, true)

            -- Planta baja comercial: Escaparates con toldos hacia la calle
            local facingSide = (r == rows and "South") or (r == 1 and "North") or (c == 1 and "West") or "East"
            local frontZ = bCenterZ + bD / 2
            local shopW = bW * 0.75
            local shopGlass = makeBPart("Storefront_Glass", Vector3.new(shopW, 8, 0.4), CFrame.new(bCenterX, bBaseY + 5, frontZ + 0.1), Color3.fromRGB(${styleConfig.glassColor[0]}, ${styleConfig.glassColor[1]}, ${styleConfig.glassColor[2]}), Enum.Material.Glass, false, true)
            shopGlass.Transparency = 0.35
            shopGlass.Reflectance = 0.45

            -- Toldo 3D a 45°
            local awnW = makeWedge("Storefront_Awning", Vector3.new(shopW, 2.2, 3.2), CFrame.new(bCenterX, bBaseY + 10, frontZ + 1.6) * CFrame.Angles(0, math.rad(180), 0), colAwning, Enum.Material.${styleConfig.awningMaterial})

            -- Cornisa sobre la planta baja
            makeBPart("Cornice_Ground", Vector3.new(bW + 0.8, 0.8, bD + 0.8), CFrame.new(bCenterX, bBaseY + groundH, bCenterZ), Color3.fromRGB(${styleConfig.corniceColor[0]}, ${styleConfig.corniceColor[1]}, ${styleConfig.corniceColor[2]}), Enum.Material.${styleConfig.corniceMaterial}, false, true)

            -- Ventanas con iluminación realista en pisos superiores
            local numWinX = math.max(1, math.floor(bW / 8))
            local stepX = bW / numWinX
            for fl = 1, floorCount - 1 do
                local flY = bBaseY + groundH + (fl - 0.5) * upperH
                for wx = 1, numWinX do
                    local wPosX = bCenterX - bW / 2 + (wx - 0.5) * stepX
                    local isLit = ((bSeed * 13 + fl * 29 + wx * 17) % 100) < 45

                    -- Ventana Frontal
                    local wPart = makeBPart("Win_F", Vector3.new(3.4, 5.2, 0.2), CFrame.new(wPosX, flY, frontZ + 0.1), Color3.fromRGB(${styleConfig.glassColor[0]}, ${styleConfig.glassColor[1]}, ${styleConfig.glassColor[2]}), Enum.Material.Glass, false, true)
                    wPart.Transparency = 0.35
                    wPart.Reflectance = 0.4
                    -- Alféizar
                    makeBPart("Sill_F", Vector3.new(4.0, 0.4, 0.6), CFrame.new(wPosX, flY - 2.8, frontZ + 0.3), Color3.fromRGB(${styleConfig.corniceColor[0]}, ${styleConfig.corniceColor[1]}, ${styleConfig.corniceColor[2]}), Enum.Material.${styleConfig.corniceMaterial}, false, true)

                    if isLit then
                        wPart.Material = Enum.Material.Neon
                        wPart.Color = Color3.fromRGB(255, 235, 185)
                        wPart.Transparency = 0.1
                        local pL = Instance.new("PointLight", wPart)
                        pL.Color = Color3.fromRGB(255, 235, 185)
                        pL.Range = 10
                        pL.Brightness = 0.6
                    end
                end
            end

            -- Azotea y parapeto
            local roofY = bBaseY + totalH
            makeBPart("Roof_Slab", Vector3.new(bW, 1.2, bD), CFrame.new(bCenterX, roofY - 0.6, bCenterZ), Color3.fromRGB(${styleConfig.roofFloorColor[0]}, ${styleConfig.roofFloorColor[1]}, ${styleConfig.roofFloorColor[2]}), Enum.Material.Concrete, true)
            makeBPart("Parapet_F", Vector3.new(bW, 2.2, 0.8), CFrame.new(bCenterX, roofY + 1.1, frontZ - 0.4), Color3.fromRGB(${styleConfig.parapetColor[0]}, ${styleConfig.parapetColor[1]}, ${styleConfig.parapetColor[2]}), Enum.Material.${styleConfig.parapetMaterial}, true)
            makeBPart("Parapet_B", Vector3.new(bW, 2.2, 0.8), CFrame.new(bCenterX, roofY + 1.1, bCenterZ - bD/2 + 0.4), Color3.fromRGB(${styleConfig.parapetColor[0]}, ${styleConfig.parapetColor[1]}, ${styleConfig.parapetColor[2]}), Enum.Material.${styleConfig.parapetMaterial}, true)

            -- Props de azotea (HVAC, tanques, antenas)
            if bW >= 24 then
                local hvac = makeBPart("HVAC", Vector3.new(6, 3.5, 5), CFrame.new(bCenterX + bW/4, roofY + 1.75, bCenterZ + bD/4), Color3.fromRGB(150, 155, 160), Enum.Material.DiamondPlate, true)
                local ant = makeBPart("Antenna", Vector3.new(0.6, 14, 0.6), CFrame.new(bCenterX - bW/4, roofY + 7, bCenterZ - bD/4), Color3.fromRGB(60, 65, 70), Enum.Material.Metal, false, true)
                local beacon = makeBPart("Beacon", Vector3.new(1, 1, 1), CFrame.new(bCenterX - bW/4, roofY + 14.5, bCenterZ - bD/4), Color3.fromRGB(255, 30, 30), Enum.Material.Neon, false, true)
                beacon.Shape = Enum.PartType.Ball
                local bl = Instance.new("PointLight", beacon)
                bl.Color = Color3.fromRGB(255, 30, 30)
                bl.Range = 12
                bl.Brightness = 1.2
            end
        end
    end

    ${
      hasFurniture
        ? `
    -- 5. MOBILIARIO URBANO DE ACERAS (Farolas con sombras, árboles en alcorques, bocas de incendio)
    local furnModel = Instance.new("Model", districtModel)
    furnModel.Name = "District_StreetFurniture"

    local function spawnLamp(cf)
        local pole = makePart("Lamp_Pole", Vector3.new(0.8, 14, 0.8), cf * CFrame.new(0, 7, 0), Color3.fromRGB(45, 48, 55), Enum.Material.Metal, true)
        pole.Parent = furnModel
        local arm = makePart("Lamp_Arm", Vector3.new(0.6, 0.6, 3), cf * CFrame.new(0, 13.8, 1.2), Color3.fromRGB(45, 48, 55), Enum.Material.Metal, false)
        arm.Parent = furnModel
        local bulb = makePart("Lamp_Bulb", Vector3.new(1.0, 0.2, 1.4), cf * CFrame.new(0, 13.1, 2.5), Color3.fromRGB(255, 240, 200), Enum.Material.Neon, false)
        bulb.Parent = furnModel

        local light = Instance.new("PointLight", bulb)
        light.Color = Color3.fromRGB(255, 230, 185)
        light.Range = 32
        light.Brightness = 1.5
        light.Shadows = true
    end

    local function spawnTree(cf)
        local grate = makePart("Tree_Grate", Vector3.new(4, 0.2, 4), cf * CFrame.new(0, 0.1, 0), Color3.fromRGB(35, 38, 42), Enum.Material.DiamondPlate, true)
        grate.Parent = furnModel
        local trunk = makePart("Tree_Trunk", Vector3.new(1.2, 8, 1.2), cf * CFrame.new(0, 4.1, 0), Color3.fromRGB(85, 55, 35), Enum.Material.WoodPlanks, true)
        trunk.Parent = furnModel
        local crown = makePart("Tree_Crown", Vector3.new(6.5, 6, 6.5), cf * CFrame.new(0, 10, 0), Color3.fromRGB(55, 120, 50), Enum.Material.Grass, false)
        crown.Parent = furnModel
    end

    local function spawnHydrant(cf)
        local h = makePart("Hydrant", Vector3.new(1.2, 2.6, 1.2), cf * CFrame.new(0, 1.3, 0), Color3.fromRGB(205, 40, 40), Enum.Material.Metal, true)
        h.Shape = Enum.PartType.Cylinder
        h.CFrame = cf * CFrame.new(0, 1.3, 0) * CFrame.Angles(0, 0, math.rad(90))
        h.Parent = furnModel
    end

    -- Distribuir mobiliario a lo largo de las aceras Sur y Norte
    local furnStep = 44
    for fx = blockMinX + 16, blockMaxX - 16, furnStep do
        local southCF = CFrame.new(fx, cy + curbH, blockMaxZ - swW / 2)
        local northCF = CFrame.new(fx, cy + curbH, blockMinZ + swW / 2) * CFrame.Angles(0, math.rad(180), 0)

        spawnLamp(southCF)
        spawnTree(southCF * CFrame.new(furnStep / 2, 0, 0))
        spawnLamp(northCF)
        spawnTree(northCF * CFrame.new(furnStep / 2, 0, 0))
    end

    -- Bocas de incendio en esquinas de acera
    spawnHydrant(CFrame.new(blockMinX + 6, cy + curbH, blockMaxZ - 6))
    spawnHydrant(CFrame.new(blockMaxX - 6, cy + curbH, blockMaxZ - 6))
    spawnHydrant(CFrame.new(blockMinX + 6, cy + curbH, blockMinZ + 6))
    spawnHydrant(CFrame.new(blockMaxX - 6, cy + curbH, blockMinZ + 6))
    `
        : ""
    }

    print(string.format("[DistrictEngine] ✅ Distrito AAA '%s' (%s, densidad %s, %dx%d studs) generado con éxito en '%s'.", "${name}", "${style}", density, totalW, totalL, "${parent}"))
end

buildCompleteDistrict()
`;
}
