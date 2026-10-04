import { snapVal } from "./grid.js";

/**
 * Generador de Casas Residenciales Realistas Estilo GTA San Andreas / Urbano AAA.
 * Construye viviendas unifamiliares completas con:
 * - Tejado a dos aguas (gable) con piñones triangulares recortados exactos, o tejado a cuatro aguas (hip),
 *   o terraza plana moderna (mansion). Aleros volados, tejas PBR y chimenea de ladrillo
 * - Porche delantero cubierto con escalones de acceso, barandillas, columnas y farol colgante
 *   (tejadillo correctamente orientado que vierte hacia el exterior)
 * - Puerta residencial moldeada con marco, manilla de latón y felpudo
 * - Ventanas 3D sin solapamientos, con contraventanas de madera bien posicionadas, alféizares y luz interior
 * - Garaje adosado con portón seccional, foco y camino de entrada de hormigón (driveway)
 * - Jardín delantero con césped, camino de losas de piedra, buzón americano a pie de calle
 * - Patio trasero vallado con barbacoa, mesa de picnic y cubos de basura rodantes
 * - Soporte de rotación completa (rotationY) para orientar la casa a cualquier calle
 */

export const HOUSE_STYLES = {
  suburban_bungalow: {
    name: "Suburban California Bungalow (Estilo Grove St / Ganton)",
    wallMaterials: ["WoodPlanks", "Concrete"],
    wallColors: [
      [225, 215, 195], // Crema estuco californiano
      [145, 165, 175], // Azul grisáceo desvaído
      [185, 145, 115], // Madera tostada
      [210, 205, 190], // Blanco roto
      [135, 155, 130], // Verde oliva suave
    ],
    roofMaterial: "WoodPlanks",
    roofColors: [
      [75, 55, 42],    // Teja madera marrón
      [55, 58, 62],    // Pizarra gris carbón
      [125, 65, 45],   // Teja terracota
    ],
    trimColor: [240, 240, 242], // Molduras blancas
    shutterColor: [45, 65, 50], // Contraventanas verde bosque o café
    doorColor: [120, 45, 35],   // Puerta granate o caoba
    floors: 1,
    roofType: "gable", // Tejado a dos aguas
  },

  victorian_rowhouse: {
    name: "San Fierro Victorian Rowhouse (Estilo Garcia / Queens)",
    wallMaterials: ["WoodPlanks", "Sandstone"],
    wallColors: [
      [175, 190, 195], // Azul victoriano
      [215, 195, 175], // Ocre elegante
      [190, 160, 165], // Rosa palo victoriano
      [220, 222, 215], // Crema sillería
    ],
    roofMaterial: "Concrete",
    roofColors: [
      [42, 45, 52],    // Pizarra oscura
      [65, 48, 55],    // Púrpura oscuro
    ],
    trimColor: [245, 245, 240],
    shutterColor: [35, 38, 45],
    doorColor: [40, 42, 48],
    floors: 2,
    roofType: "gable",
  },

  vinewood_mansion: {
    name: "Vinewood Hills Luxury Villa",
    wallMaterials: ["Concrete", "Marble"],
    wallColors: [
      [245, 245, 245], // Blanco puro moderno
      [228, 225, 218], // Caliza travertino
      [210, 212, 218], // Gris platino
    ],
    roofMaterial: "Concrete",
    roofColors: [
      [55, 58, 65],
      [145, 75, 50],
    ],
    trimColor: [38, 40, 45],
    shutterColor: [38, 40, 45],
    doorColor: [35, 38, 42],
    floors: 2,
    roofType: "flat_terrace",
  },

  duplex_apartment: {
    name: "Multi-Family Duplex / Suburban Apartments",
    wallMaterials: ["Brick", "Concrete"],
    wallColors: [
      [165, 80, 55],  // Ladrillo visto
      [195, 185, 175], // Estuco beige
      [110, 125, 135], // Gris pizarra
    ],
    roofMaterial: "Concrete",
    roofColors: [
      [50, 52, 58],
      [80, 55, 45],
    ],
    trimColor: [235, 235, 235],
    shutterColor: [50, 52, 58],
    doorColor: [60, 45, 35],
    floors: 2,
    roofType: "hip",
  },
};

export function generateHouseLuau({
  name = "Suburban_House",
  position = [0, 0, 0],
  lotSize = [56, 72], // [widthX, depthZ] de la parcela
  style = "suburban_bungalow",
  rotationY = 0,
  seed = 2024,
  hasGarage = true,
  hasPorch = true,
  hasFence = true,
  hasYardProps = true,
  parent = "City/Houses",
}) {
  const [posX, posY, posZ] = [snapVal(position[0], 4), snapVal(position[1], 4), snapVal(position[2], 4)];
  const [lotW, lotD] = [Math.max(40, snapVal(lotSize[0], 4)), Math.max(50, snapVal(lotSize[1] || lotSize[2] || 72, 4))];
  const effectiveSeed = typeof seed === "number" ? seed : 2024;
  const rotY = typeof rotationY === "number" ? rotationY : 0;

  const styleKey = (style || "").toLowerCase().replace(/[^a-z0-9_]/g, "_");
  const config = HOUSE_STYLES[styleKey] || HOUSE_STYLES.suburban_bungalow;

  const wallColors = config.wallColors;
  const wallCol = wallColors[effectiveSeed % wallColors.length];
  const roofColors = config.roofColors;
  const roofCol = roofColors[effectiveSeed % roofColors.length];

  // Dimensiones del cuerpo de la casa dentro de la parcela
  const houseW = Math.min(lotW - 14, config.floors === 2 && styleKey === "victorian_rowhouse" ? 24 : 32);
  const houseD = Math.min(lotD - 24, 34);
  const wallH = config.floors === 2 ? 19 : 10;
  const roofH = 7.5;
  const isTwoStory = config.floors === 2;

  return `
local CollectionService = game:GetService("CollectionService")

local function buildRealisticHouse()
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

    local houseModel = Instance.new("Model", current)
    houseModel.Name = "${name}"
    pcall(function() houseModel.LevelOfDetail = Enum.ModelLevelOfDetail.StreamingMesh end)

    -- CFrame base con rotación sobre el punto de inserción
    local originCF = CFrame.new(${posX}, ${posY}, ${posZ}) * CFrame.Angles(0, math.rad(${rotY}), 0)

    local lotW = ${lotW}
    local lotD = ${lotD}
    local hW = ${houseW}
    local hD = ${houseD}
    local wallH = ${wallH}
    local roofH = ${roofH}
    local isTwoStory = ${isTwoStory ? "true" : "false"}
    local roofType = "${config.roofType || "gable"}"
    local seedVal = ${effectiveSeed}

    -- PALETA DE COLOR Y MATERIALES PBR
    local colWall = Color3.fromRGB(${wallCol[0]}, ${wallCol[1]}, ${wallCol[2]})
    local colRoof = Color3.fromRGB(${roofCol[0]}, ${roofCol[1]}, ${roofCol[2]})
    local colTrim = Color3.fromRGB(${config.trimColor[0]}, ${config.trimColor[1]}, ${config.trimColor[2]})
    local colShutter = Color3.fromRGB(${config.shutterColor[0]}, ${config.shutterColor[1]}, ${config.shutterColor[2]})
    local colDoor = Color3.fromRGB(${config.doorColor[0]}, ${config.doorColor[1]}, ${config.doorColor[2]})
    local colFoundation = Color3.fromRGB(130, 132, 138)
    local colGrass = Color3.fromRGB(62, 135, 52)
    local colDriveway = Color3.fromRGB(175, 178, 185)

    local matWall = Enum.Material.${config.wallMaterials[0]}
    local matRoof = Enum.Material.${config.roofMaterial}

    local function makePart(pName, sz, relCF, col, mat, canCol, isDecor)
        local p = Instance.new("Part", houseModel)
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
        p.Material = mat or matWall
        return p
    end

    local function makeWedge(pName, sz, relCF, col, mat)
        local w = Instance.new("WedgePart", houseModel)
        w.Name = pName
        w.Anchored = true
        w.CanCollide = true
        w.CanTouch = false
        w.Size = sz
        w.CFrame = originCF * relCF
        w.Color = col
        w.Material = mat or matRoof
        return w
    end

    local function makeCylinder(pName, sz, relCF, col, mat, canCol)
        local p = Instance.new("Part", houseModel)
        p.Name = pName
        p.Shape = Enum.PartType.Cylinder
        p.Anchored = true
        p.CanCollide = canCol ~= nil and canCol or false
        p.CanTouch = false
        p.CanQuery = false
        p.Size = sz
        p.CFrame = originCF * relCF
        p.Color = col
        p.Material = mat or Enum.Material.Metal
        return p
    end

    -- 1. PARCELA RESIDENCIAL: CÉSPED, CALZADA DE VEHÍCULOS (DRIVEWAY) Y CIMENTACIÓN
    makePart("Lot_Grass_Lawn", Vector3.new(lotW, 1.2, lotD), CFrame.new(0, 0.6, 0), colGrass, Enum.Material.Grass, true)

    -- Camino de entrada de vehículos de hormigón (Driveway) en el lateral derecho (+X, +Z)
    local driveW = 12
    local driveLen = lotD * 0.62
    local driveX = lotW / 2 - driveW / 2 - 2
    local driveZ = lotD / 2 - driveLen / 2
    makePart("Driveway_Concrete", Vector3.new(driveW, 1.25, driveLen), CFrame.new(driveX, 0.65, driveZ), colDriveway, Enum.Material.Concrete, true)

    -- Cimentación elevada de la vivienda
    local fH = 1.6
    local houseBaseY = 1.2
    local houseZ = -2
    local houseX = - (lotW - hW) * 0.15

    makePart("House_Foundation", Vector3.new(hW + 1.2, fH, hD + 1.2),
        CFrame.new(houseX, houseBaseY + fH / 2, houseZ), colFoundation, Enum.Material.Concrete, true)

    -- 2. CUERPO ESTRUCTURAL DE LA CASA
    local houseBodyY = houseBaseY + fH + wallH / 2
    makePart("House_Body", Vector3.new(hW, wallH, hD),
        CFrame.new(houseX, houseBodyY, houseZ), colWall, matWall, true)

    -- Moldura perimetral inferior decorativa
    makePart("House_Baseboard", Vector3.new(hW + 0.6, 0.8, hD + 0.6),
        CFrame.new(houseX, houseBaseY + fH + 0.4, houseZ), colTrim, Enum.Material.WoodPlanks, false, true)

    -- Moldura intermedia si es de 2 plantas
    if isTwoStory then
        makePart("House_MidBelt", Vector3.new(hW + 0.8, 0.6, hD + 0.8),
            CFrame.new(houseX, houseBaseY + fH + 9.5, houseZ), colTrim, Enum.Material.WoodPlanks, false, true)
    end

    -- 3. TEJADO Y REMATES SUPERIORES SEGÚN EL ESTILO
    local roofBaseY = houseBaseY + fH + wallH
    local eaveHang = 1.6
    local halfHW = (hW + eaveHang * 2) / 2
    local roofTotalD = hD + eaveHang * 2

    if roofType == "flat_terrace" then
        -- Cubierta plana moderna con parapeto y albardilla
        makePart("Roof_Slab", Vector3.new(hW + 0.8, 1.2, hD + 0.8), CFrame.new(houseX, roofBaseY + 0.6, houseZ), colRoof, matRoof, true)
        local paraH = 2.6
        local paraThick = 0.8
        makePart("Parapet_F", Vector3.new(hW + 1.0, paraH, paraThick), CFrame.new(houseX, roofBaseY + 1.2 + paraH / 2, houseZ + hD / 2 - paraThick / 2), colTrim, matWall, true)
        makePart("Parapet_B", Vector3.new(hW + 1.0, paraH, paraThick), CFrame.new(houseX, roofBaseY + 1.2 + paraH / 2, houseZ - hD / 2 + paraThick / 2), colTrim, matWall, true)
        makePart("Parapet_L", Vector3.new(paraThick, paraH, hD - paraThick * 2), CFrame.new(houseX - hW / 2 + paraThick / 2, roofBaseY + 1.2 + paraH / 2, houseZ), colTrim, matWall, true)
        makePart("Parapet_R", Vector3.new(paraThick, paraH, hD - paraThick * 2), CFrame.new(houseX + hW / 2 - paraThick / 2, roofBaseY + 1.2 + paraH / 2, houseZ), colTrim, matWall, true)

    elseif roofType == "hip" then
        -- Tejado a 4 aguas (Hip Roof)
        local hipH = roofH
        local halfD = (hD + eaveHang * 2) / 2
        -- Falda izquierda y derecha
        makeWedge("Roof_Hip_L", Vector3.new(roofTotalD, hipH, halfHW),
            CFrame.new(houseX - halfHW / 2, roofBaseY + hipH / 2, houseZ) * CFrame.Angles(0, math.rad(-90), 0), colRoof, matRoof)
        makeWedge("Roof_Hip_R", Vector3.new(roofTotalD, hipH, halfHW),
            CFrame.new(houseX + halfHW / 2, roofBaseY + hipH / 2, houseZ) * CFrame.Angles(0, math.rad(90), 0), colRoof, matRoof)
        -- Falda frontal y trasera
        makeWedge("Roof_Hip_F", Vector3.new(hW + eaveHang * 2, hipH, halfD),
            CFrame.new(houseX, roofBaseY + hipH / 2, houseZ + halfD / 2), colRoof, matRoof)
        makeWedge("Roof_Hip_B", Vector3.new(hW + eaveHang * 2, hipH, halfD),
            CFrame.new(houseX, roofBaseY + hipH / 2, houseZ - halfD / 2) * CFrame.Angles(0, math.rad(180), 0), colRoof, matRoof)

    else
        -- TEJADO A DOS AGUAS (GABLE ROOF) CON HASTIALES TRIANGULARES PERFECTOS
        -- Faldas izquierda y derecha
        local leftSlopeCF = CFrame.new(houseX - halfHW / 2, roofBaseY + roofH / 2, houseZ)
            * CFrame.Angles(0, math.rad(-90), 0)
        makeWedge("Roof_Slope_Left", Vector3.new(roofTotalD, roofH, halfHW), leftSlopeCF, colRoof, matRoof)

        local rightSlopeCF = CFrame.new(houseX + halfHW / 2, roofBaseY + roofH / 2, houseZ)
            * CFrame.Angles(0, math.rad(90), 0)
        makeWedge("Roof_Slope_Right", Vector3.new(roofTotalD, roofH, halfHW), rightSlopeCF, colRoof, matRoof)

        -- Cumbrera superior (Ridge Cap)
        makePart("Roof_Ridge_Cap", Vector3.new(0.8, 0.4, roofTotalD),
            CFrame.new(houseX, roofBaseY + roofH + 0.1, houseZ), colTrim, Enum.Material.WoodPlanks, false, true)

        -- HASTIALES / PIÑONES TRIANGULARES EXACTOS (Evita que el cuadrado inferior sobresalga)
        -- Cada hastial se forma con 2 WedgeParts que siguen la inclinación exacta de la cubierta
        local gableThick = 0.5
        local halfW = hW / 2

        -- Hastial Frontal (+Z): mitades izquierda y derecha
        local fGableL_CF = CFrame.new(houseX - halfW / 2, roofBaseY + roofH / 2, houseZ + hD / 2)
            * CFrame.Angles(0, math.rad(-90), 0)
        makeWedge("Gable_Tri_FL", Vector3.new(gableThick, roofH, halfW), fGableL_CF, colWall, matWall)

        local fGableR_CF = CFrame.new(houseX + halfW / 2, roofBaseY + roofH / 2, houseZ + hD / 2)
            * CFrame.Angles(0, math.rad(90), 0)
        makeWedge("Gable_Tri_FR", Vector3.new(gableThick, roofH, halfW), fGableR_CF, colWall, matWall)

        -- Hastial Trasero (-Z): mitades izquierda y derecha
        local bGableL_CF = CFrame.new(houseX - halfW / 2, roofBaseY + roofH / 2, houseZ - hD / 2)
            * CFrame.Angles(0, math.rad(-90), 0)
        makeWedge("Gable_Tri_BL", Vector3.new(gableThick, roofH, halfW), bGableL_CF, colWall, matWall)

        local bGableR_CF = CFrame.new(houseX + halfW / 2, roofBaseY + roofH / 2, houseZ - hD / 2)
            * CFrame.Angles(0, math.rad(90), 0)
        makeWedge("Gable_Tri_BR", Vector3.new(gableThick, roofH, halfW), bGableR_CF, colWall, matWall)

        -- Ventana redonda u óculo en el hastial frontal con orientación cilíndrica correcta
        local atticWinCF = CFrame.new(houseX, roofBaseY + roofH * 0.45, houseZ + hD / 2 + 0.3) * CFrame.Angles(0, math.rad(90), 0)
        -- Marco exterior circular
        makeCylinder("Attic_Window_Frame", Vector3.new(0.35, 3.2, 3.2), atticWinCF, colTrim, Enum.Material.WoodPlanks, false)
        -- Cristal interior
        local atticWin = makeCylinder("Attic_Window_Glass", Vector3.new(0.4, 2.6, 2.6), atticWinCF * CFrame.new(-0.05, 0, 0), Color3.fromRGB(200, 225, 245), Enum.Material.Glass, false)
        atticWin.Transparency = 0.35

        -- Chimenea de ladrillo con remate de piedra
        local chimW = 2.8
        local chimD = 2.8
        local chimH = roofH + 4.5
        local chimX = houseX - hW / 3
        local chimZ = houseZ - hD / 4
        makePart("Chimney_Body", Vector3.new(chimW, chimH, chimD),
            CFrame.new(chimX, roofBaseY + chimH / 2, chimZ), Color3.fromRGB(145, 60, 42), Enum.Material.Brick, true)
        makePart("Chimney_Cap", Vector3.new(chimW + 0.8, 0.6, chimD + 0.8),
            CFrame.new(chimX, roofBaseY + chimH + 0.3, chimZ), Color3.fromRGB(80, 82, 88), Enum.Material.Concrete, true)
    end

    ${
      hasPorch
        ? `
    -- 4. PORCHE DELANTERO CUBIERTO (Front Porch con barandillas y columnas)
    local porchW = math.min(16, hW - 10)
    local porchD = 7.0
    local porchH = 8.5
    local porchDeckH = fH
    local porchX = houseX - hW / 2 + porchW / 2 + 1.8
    local porchZ = houseZ + hD / 2 + porchD / 2

    -- Plataforma/Suelo de madera del porche
    makePart("Porch_Deck", Vector3.new(porchW, porchDeckH, porchD),
        CFrame.new(porchX, houseBaseY + porchDeckH / 2, porchZ), Color3.fromRGB(115, 85, 60), Enum.Material.WoodPlanks, true)

    -- Escalones de acceso al porche que descienden hacia el jardín (+Z)
    local stepW = 5.5
    makePart("Porch_Step_1", Vector3.new(stepW, 0.8, 2.0),
        CFrame.new(porchX, houseBaseY + 0.4, porchZ + porchD / 2 + 1.0), Color3.fromRGB(120, 90, 65), Enum.Material.WoodPlanks, true)
    makePart("Porch_Step_2", Vector3.new(stepW, 0.4, 2.0),
        CFrame.new(porchX, houseBaseY + 0.2, porchZ + porchD / 2 + 2.8), Color3.fromRGB(120, 90, 65), Enum.Material.WoodPlanks, true)

    -- Columnas de madera que sostienen el tejadillo del porche
    local colSize = Vector3.new(0.8, porchH, 0.8)
    makePart("Porch_Post_1", colSize, CFrame.new(porchX - porchW / 2 + 0.6, houseBaseY + porchDeckH + porchH / 2, porchZ + porchD / 2 - 0.6), colTrim, Enum.Material.WoodPlanks, true)
    makePart("Porch_Post_2", colSize, CFrame.new(porchX + porchW / 2 - 0.6, houseBaseY + porchDeckH + porchH / 2, porchZ + porchD / 2 - 0.6), colTrim, Enum.Material.WoodPlanks, true)

    -- TEJADILLO A UN AGUA SOBRE EL PORCHE (Orientación corregida: vierte hacia el jardín frontal +Z)
    local pRoofCF = CFrame.new(porchX, houseBaseY + porchDeckH + porchH + 1.2, porchZ)
    makeWedge("Porch_Roof", Vector3.new(porchW + 1.2, 2.4, porchD + 0.8), pRoofCF, colRoof, matRoof)

    -- Barandillas de madera perimetrales del porche
    local railH = 3.0
    makePart("Porch_Rail_L", Vector3.new(0.3, railH, porchD - 1.2),
        CFrame.new(porchX - porchW / 2 + 0.4, houseBaseY + porchDeckH + railH / 2, porchZ), colTrim, Enum.Material.WoodPlanks, true)
    makePart("Porch_Rail_F1", Vector3.new((porchW - stepW) / 2 - 0.2, railH, 0.3),
        CFrame.new(porchX - porchW / 4 - stepW / 4, houseBaseY + porchDeckH + railH / 2, porchZ + porchD / 2 - 0.4), colTrim, Enum.Material.WoodPlanks, true)
    makePart("Porch_Rail_F2", Vector3.new((porchW - stepW) / 2 - 0.2, railH, 0.3),
        CFrame.new(porchX + porchW / 4 + stepW / 4, houseBaseY + porchDeckH + railH / 2, porchZ + porchD / 2 - 0.4), colTrim, Enum.Material.WoodPlanks, true)

    -- Farol colgante cálido sobre el porche
    local porchLamp = makePart("Porch_Lamp", Vector3.new(0.8, 1.2, 0.8),
        CFrame.new(porchX, houseBaseY + porchDeckH + porchH - 0.6, porchZ), Color3.fromRGB(255, 235, 175), Enum.Material.Neon, false, true)
    local pLight = Instance.new("PointLight", porchLamp)
    pLight.Color = Color3.fromRGB(255, 230, 175)
    pLight.Range = 16
    pLight.Brightness = 1.4
    pLight.Shadows = true

    -- PUERTA PRINCIPAL RESIDENCIAL CON MOLDURAS Y MANILLA
    local doorCF = CFrame.new(porchX, houseBaseY + porchDeckH + 4.2, houseZ + hD / 2 + 0.15)
    makePart("Door_Frame", Vector3.new(4.2, 8.4, 0.4), doorCF, colTrim, Enum.Material.WoodPlanks, true)
    makePart("Door_Leaf", Vector3.new(3.6, 7.8, 0.3), doorCF * CFrame.new(0, -0.2, 0.1), colDoor, Enum.Material.WoodPlanks, true)
    makePart("Door_Knob", Vector3.new(0.2, 0.2, 0.3), doorCF * CFrame.new(1.3, -0.2, 0.3), Color3.fromRGB(220, 185, 75), Enum.Material.Metal, false, true)
    makePart("Welcome_Mat", Vector3.new(3.2, 0.08, 1.8),
        CFrame.new(porchX, houseBaseY + porchDeckH + 0.05, houseZ + hD / 2 + 1.6), Color3.fromRGB(85, 60, 40), Enum.Material.Fabric, false, true)
    `
        : ""
    }

    -- 5. VENTANAS RESIDENCIALES 3D SIN SOLAPAMIENTOS
    local function spawnHouseWindow(winName, relCF, hasShutters)
        local wW, wH = 3.4, 4.8
        -- Marco exterior
        makePart(winName .. "_Frame", Vector3.new(wW + 0.6, wH + 0.6, 0.3), relCF, colTrim, Enum.Material.WoodPlanks, false, true)
        -- Cristal
        local glass = makePart(winName .. "_Glass", Vector3.new(wW, wH, 0.2), relCF * CFrame.new(0, 0, 0.05), Color3.fromRGB(215, 230, 245), Enum.Material.Glass, false, true)
        glass.Transparency = 0.35
        glass.Reflectance = 0.3

        local isLit = ((relCF.X * 13 + relCF.Z * 17) % 100) < 55
        if isLit then
            glass.Material = Enum.Material.Neon
            glass.Color = Color3.fromRGB(255, 232, 175)
            glass.Transparency = 0.1
            local wl = Instance.new("PointLight", glass)
            wl.Color = Color3.fromRGB(255, 230, 175)
            wl.Range = 10
            wl.Brightness = 0.7
        end

        -- Alféizar inferior
        makePart(winName .. "_Sill", Vector3.new(wW + 0.8, 0.3, 0.5), relCF * CFrame.new(0, -wH / 2 - 0.2, 0.15), colTrim, Enum.Material.WoodPlanks, false, true)

        -- Contraventanas laterales (Shutters) colocadas fuera del marco sin superposición
        if hasShutters then
            local shutW = 1.1
            local shutOffset = wW / 2 + shutW / 2 + 0.2
            makePart(winName .. "_Shutter_L", Vector3.new(shutW, wH, 0.2), relCF * CFrame.new(-shutOffset, 0, 0.08), colShutter, Enum.Material.WoodPlanks, false, true)
            makePart(winName .. "_Shutter_R", Vector3.new(shutW, wH, 0.2), relCF * CFrame.new(shutOffset, 0, 0.08), colShutter, Enum.Material.WoodPlanks, false, true)
        end
    end

    -- Altura de ventanas planta baja
    local frontWinY = houseBaseY + fH + 4.8
    -- Ventana frontal (+Z): calculada con margen de seguridad del porche
    ${
      hasPorch
        ? `
    local porchRightX = porchX + porchW / 2
    local frontWinX = math.max(porchRightX + 3.2, houseX + hW / 2 - 4.5)
    if frontWinX + 2.8 <= houseX + hW / 2 then
        spawnHouseWindow("Win_Front_1", CFrame.new(frontWinX, frontWinY, houseZ + hD / 2 + 0.1), true)
    end
    `
        : `
    spawnHouseWindow("Win_Front_1", CFrame.new(houseX + hW / 4, frontWinY, houseZ + hD / 2 + 0.1), true)
    spawnHouseWindow("Win_Front_2", CFrame.new(houseX - hW / 4, frontWinY, houseZ + hD / 2 + 0.1), true)
    `
    }

    -- Ventanas laterales izquierdas (-X)
    spawnHouseWindow("Win_Left_1", CFrame.new(houseX - hW / 2 - 0.1, frontWinY, houseZ - 5) * CFrame.Angles(0, math.rad(-90), 0), true)
    spawnHouseWindow("Win_Left_2", CFrame.new(houseX - hW / 2 - 0.1, frontWinY, houseZ + 5) * CFrame.Angles(0, math.rad(-90), 0), true)

    -- Ventana lateral derecha (+X): omitida si hay garaje para evitar solapamientos con la pared del garaje
    ${
      !hasGarage
        ? `
    spawnHouseWindow("Win_Right_1", CFrame.new(houseX + hW / 2 + 0.1, frontWinY, houseZ) * CFrame.Angles(0, math.rad(90), 0), true)
    `
        : ""
    }

    -- Ventanas traseras (-Z)
    local backWinOffset = math.min(6.5, hW / 4)
    spawnHouseWindow("Win_Back_1", CFrame.new(houseX - backWinOffset, frontWinY, houseZ - hD / 2 - 0.1) * CFrame.Angles(0, math.rad(180), 0), true)
    spawnHouseWindow("Win_Back_2", CFrame.new(houseX + backWinOffset, frontWinY, houseZ - hD / 2 - 0.1) * CFrame.Angles(0, math.rad(180), 0), true)

    -- Ventanas de la segunda planta si es de 2 pisos
    if isTwoStory then
        local upperWinY = houseBaseY + fH + 14.0
        spawnHouseWindow("Win_Front_Fl2_1", CFrame.new(houseX - hW / 4, upperWinY, houseZ + hD / 2 + 0.1), true)
        spawnHouseWindow("Win_Front_Fl2_2", CFrame.new(houseX + hW / 4, upperWinY, houseZ + hD / 2 + 0.1), true)
        spawnHouseWindow("Win_Left_Fl2", CFrame.new(houseX - hW / 2 - 0.1, upperWinY, houseZ) * CFrame.Angles(0, math.rad(-90), 0), true)
        spawnHouseWindow("Win_Back_Fl2_1", CFrame.new(houseX - backWinOffset, upperWinY, houseZ - hD / 2 - 0.1) * CFrame.Angles(0, math.rad(180), 0), true)
        spawnHouseWindow("Win_Back_Fl2_2", CFrame.new(houseX + backWinOffset, upperWinY, houseZ - hD / 2 - 0.1) * CFrame.Angles(0, math.rad(180), 0), true)
    end

    ${
      hasGarage
        ? `
    -- 6. GARAJE ADOSADO (Carport / Attached Garage con portón seccional)
    local garW = 14
    local garD = 22
    local garH = 9.5
    local garX = houseX + hW / 2 + garW / 2 - 1.0
    local garZ = houseZ + 2

    -- Cuerpo del garaje
    makePart("Garage_Body", Vector3.new(garW, garH, garD),
        CFrame.new(garX, houseBaseY + garH / 2, garZ), colWall, matWall, true)

    -- Tejadillo del garaje a dos aguas con hastial frontal recortado
    local gRoofH = 3.6
    local gRoofBaseY = houseBaseY + garH
    local gRoofCF_L = CFrame.new(garX - garW / 4, gRoofBaseY + gRoofH / 2, garZ) * CFrame.Angles(0, math.rad(-90), 0)
    makeWedge("Garage_Roof_L", Vector3.new(garD + 1.2, gRoofH, garW / 2 + 0.6), gRoofCF_L, colRoof, matRoof)

    local gRoofCF_R = CFrame.new(garX + garW / 4, gRoofBaseY + gRoofH / 2, garZ) * CFrame.Angles(0, math.rad(90), 0)
    makeWedge("Garage_Roof_R", Vector3.new(garD + 1.2, gRoofH, garW / 2 + 0.6), gRoofCF_R, colRoof, matRoof)

    -- Hastial triangular frontal del garaje
    local gGableL_CF = CFrame.new(garX - garW / 4, gRoofBaseY + gRoofH / 2, garZ + garD / 2) * CFrame.Angles(0, math.rad(-90), 0)
    makeWedge("Garage_Gable_L", Vector3.new(0.4, gRoofH, garW / 2), gGableL_CF, colWall, matWall)
    local gGableR_CF = CFrame.new(garX + garW / 4, gRoofBaseY + gRoofH / 2, garZ + garD / 2) * CFrame.Angles(0, math.rad(90), 0)
    makeWedge("Garage_Gable_R", Vector3.new(0.4, gRoofH, garW / 2), gGableR_CF, colWall, matWall)

    -- Portón de garaje seccional
    local gDoorW = 10.5
    local gDoorH = 7.8
    local gDoorZ = garZ + garD / 2 + 0.1
    makePart("Garage_Door_Frame", Vector3.new(gDoorW + 0.8, gDoorH + 0.4, 0.4),
        CFrame.new(garX, houseBaseY + gDoorH / 2 + 0.2, gDoorZ), colTrim, Enum.Material.WoodPlanks, true)
    makePart("Garage_Door_Panels", Vector3.new(gDoorW, gDoorH, 0.3),
        CFrame.new(garX, houseBaseY + gDoorH / 2 + 0.2, gDoorZ + 0.05), Color3.fromRGB(240, 242, 245), Enum.Material.WoodPlanks, true)

    -- Foco exterior sobre el garaje con sensor
    local gLight = makePart("Garage_Spotlight", Vector3.new(0.8, 0.6, 0.6),
        CFrame.new(garX, houseBaseY + gDoorH + 0.8, gDoorZ + 0.2), Color3.fromRGB(255, 245, 215), Enum.Material.Neon, false, true)
    local gPl = Instance.new("PointLight", gLight)
    gPl.Color = Color3.fromRGB(255, 235, 180)
    gPl.Range = 16
    gPl.Brightness = 1.2
    `
        : ""
    }

    ${
      hasYardProps
        ? `
    -- 7. ELEMENTOS DE ATREZZO RESIDENCIAL Y PAISAJISMO
    -- Camino de losas de piedra desde la acera hasta los escalones del porche
    local pathZStart = lotD / 2
    local pathZEnd = houseZ + hD / 2 + 7.0
    local pathLen = pathZStart - pathZEnd
    if pathLen > 2 then
        makePart("Garden_Stone_Path", Vector3.new(4.2, 0.1, pathLen),
            CFrame.new(houseX - hW / 2 + 10, houseBaseY + 0.05, (pathZStart + pathZEnd) / 2), Color3.fromRGB(180, 175, 165), Enum.Material.Cobblestone, true)
    end

    -- Buzón clásico americano (Mailbox) junto a la entrada de vehículos a pie de acera
    local mbX = driveX - driveW / 2 - 2.5
    local mbZ = lotD / 2 - 4
    makePart("Mailbox_Post", Vector3.new(0.4, 4.0, 0.4),
        CFrame.new(mbX, houseBaseY + 2.0, mbZ), Color3.fromRGB(90, 65, 45), Enum.Material.WoodPlanks, true)
    makePart("Mailbox_Box", Vector3.new(1.0, 1.0, 1.8),
        CFrame.new(mbX, houseBaseY + 4.2, mbZ), Color3.fromRGB(45, 75, 135), Enum.Material.Metal, true)
    makePart("Mailbox_Flag", Vector3.new(0.1, 0.6, 0.4),
        CFrame.new(mbX + 0.55, houseBaseY + 4.4, mbZ - 0.4), Color3.fromRGB(220, 45, 40), Enum.Material.SmoothPlastic, false, true)

    -- Setos podados bajo la ventana delantera
    makePart("Garden_Hedge_1", Vector3.new(7, 2.2, 1.8),
        CFrame.new(houseX + hW / 2 - 4.5, houseBaseY + 1.1, houseZ + hD / 2 + 1.5), Color3.fromRGB(48, 115, 42), Enum.Material.Grass, false)

    -- Patio trasero: Barbacoa grill y cubos de basura rodantes
    local backYardZ = -lotD / 2 + 6
    local bbqCF = CFrame.new(houseX - 6, houseBaseY + 1.8, backYardZ) * CFrame.Angles(0, 0, math.rad(90))
    makeCylinder("BBQ_Grill", Vector3.new(2.4, 3.2, 2.4), bbqCF, Color3.fromRGB(35, 38, 42), Enum.Material.Metal, true)
    makePart("BBQ_Leg_1", Vector3.new(0.2, 1.8, 0.2), CFrame.new(houseX - 7.2, houseBaseY + 0.9, backYardZ), Color3.fromRGB(35, 38, 42), Enum.Material.Metal, false, true)
    makePart("BBQ_Leg_2", Vector3.new(0.2, 1.8, 0.2), CFrame.new(houseX - 4.8, houseBaseY + 0.9, backYardZ), Color3.fromRGB(35, 38, 42), Enum.Material.Metal, false, true)

    -- Cubos de basura rodantes junto al garaje
    local trashCF1 = CFrame.new(driveX - driveW / 2 + 1.5, houseBaseY + 1.6, houseZ)
    makePart("Wheelie_Bin_Green", Vector3.new(1.6, 3.2, 1.6), trashCF1, Color3.fromRGB(42, 95, 50), Enum.Material.SmoothPlastic, true)
    local trashCF2 = CFrame.new(driveX - driveW / 2 + 3.4, houseBaseY + 1.6, houseZ)
    makePart("Wheelie_Bin_Blue", Vector3.new(1.6, 3.2, 1.6), trashCF2, Color3.fromRGB(35, 75, 145), Enum.Material.SmoothPlastic, true)
    `
        : ""
    }

    ${
      hasFence
        ? `
    -- 8. VALLA PERIMETRAL DE MADERA BLANCA (Picket Fence)
    local fenceH = 3.6
    local colFence = Color3.fromRGB(240, 240, 245)
    local fenceBaseY = houseBaseY + fenceH / 2

    -- Valla lateral izquierda
    makePart("Fence_Left", Vector3.new(0.4, fenceH, lotD - 8),
        CFrame.new(-lotW / 2 + 0.4, fenceBaseY, -4), colFence, Enum.Material.WoodPlanks, true)
    -- Valla trasera
    makePart("Fence_Back", Vector3.new(lotW - 2, fenceH, 0.4),
        CFrame.new(0, fenceBaseY, -lotD / 2 + 0.4), colFence, Enum.Material.WoodPlanks, true)
    -- Valla lateral derecha (hasta el driveway)
    makePart("Fence_Right", Vector3.new(0.4, fenceH, lotD - driveLen - 4),
        CFrame.new(lotW / 2 - 0.4, fenceBaseY, -driveLen / 2), colFence, Enum.Material.WoodPlanks, true)
    `
        : ""
    }

    print(string.format("[HouseEngine AAA] ✅ Casa '%s' (%s, huella %dx%d) construida en '%s' (rot: %d°).", "${name}", "${config.name}", hW, hD, "${parent}", ${rotY}))
end

buildRealisticHouse()
`;
}
