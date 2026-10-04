import { snapVal } from "./grid.js";

/**
 * Generador de Negocio Urbano Turbio / Local Comercial Clandestino
 * (Shady Business / Storefront - Estilo Schedule 1 / Hyland Point / GTA).
 * 
 * Esencial en Schedule 1 para blanqueo de dinero, compra/venta de objetos robados,
 * empeños, dispensarios 24/7 y puntos de entrega clandestinos (Dead Drops).
 * 
 * Tipos de negocio:
 * - "pawn": Casa de empeños ("QUICK PAWN & LOAN"), rejas doradas/negras, vitrinas de compra.
 * - "pharmacy": Farmacia de barrio 24/7 ("CORNER RX MEDS"), cruz verde de neón, ventanilla blindada.
 * - "bodega": Tienda de ultramarinos / colmado ("LUCKY BODEGA"), cartel retro, estanterías.
 * - "laundromat": Lavandería 24h ("SPARKLE WASH"), filas de lavadoras/secadoras industriales, camuflaje perfecto.
 * 
 * Características clave:
 * - Fachada comercial con rejas de seguridad antirrobo en cristaleras
 * - Mostrador blindado de atención con ventanilla pasamonedas y cristal de seguridad
 * - Callejón trasero con contenedor de basura grande, puerta blindada de emergencia con teclado PIN
 * - Escalera metálica de escape al tejado con unidades de aire acondicionado
 * - Cámara de vigilancia CCTV funcional con LED rojo de grabación
 * - Escondite clandestino interactivo (Dead Drop / Stash) con tags de CollectionService y atributos
 */

export function generateShadyBusinessLuau({
  name = "Shady_Business_Storefront",
  position = [0, 0, 0],
  rotationY = 0,
  businessType = "pawn", // "pawn", "pharmacy", "bodega", "laundromat"
  hasBackAlley = true,
  hasSecurityBars = true,
  includeInterior = true,
  includeDeadDrop = true,
  parent = "City/Commercial",
}) {
  const [posX, posY, posZ] = [snapVal(position[0], 4), snapVal(position[1], 4), snapVal(position[2], 4)];
  const rotY = typeof rotationY === "number" ? rotationY : 0;

  // Dimensiones del local comercial
  const buildingW = 28.0;
  const buildingD = 36.0;
  const buildingH = 15.0;

  return `
local CollectionService = game:GetService("CollectionService")

local function buildShadyStorefront()
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
    local bW = ${buildingW}
    local bD = ${buildingD}
    local bH = ${buildingH}
    local bType = "${businessType}"

    -- Paletas temáticas según el tipo de negocio
    local colWall = Color3.fromRGB(185, 178, 168)
    local colTrim = Color3.fromRGB(65, 70, 78)
    local colSign = Color3.fromRGB(220, 160, 20)
    local signText = "QUICK PAWN & LOAN"
    local signSub = "CASH FOR GOLD - WE BUY EVERYTHING"

    if bType == "pharmacy" then
        colWall = Color3.fromRGB(205, 212, 218)
        colTrim = Color3.fromRGB(45, 95, 110)
        colSign = Color3.fromRGB(40, 180, 100)
        signText = "24/7 RX PHARMACY"
        signSub = "DISCOUNT PRESCRIPTIONS & CLINIC"
    elseif bType == "bodega" then
        colWall = Color3.fromRGB(195, 165, 140)
        colTrim = Color3.fromRGB(150, 45, 35)
        colSign = Color3.fromRGB(215, 60, 45)
        signText = "LUCKY BODEGA & DELI"
        signSub = "COLD BEER - GROCERY - LOTTO"
    elseif bType == "laundromat" then
        colWall = Color3.fromRGB(210, 215, 220)
        colTrim = Color3.fromRGB(40, 105, 170)
        colSign = Color3.fromRGB(35, 140, 230)
        signText = "24H SPEEDY LAUNDROMAT"
        signSub = "DROP-OFF SERVICE - COIN OPERATED"
    end

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
        p.Material = mat or Enum.Material.Brick
        return p
    end

    local function makeWedge(pName, sz, relCF, col, mat)
        local w = Instance.new("WedgePart", model)
        w.Name = pName
        w.Anchored = true
        w.CanCollide = true
        w.CanTouch = false
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
        c.CanCollide = false
        c.CanTouch = false
        c.Size = sz
        c.CFrame = originCF * relCF
        c.Color = col
        c.Material = mat or Enum.Material.Metal
        return c
    end

    -- 1. CIMIENTOS Y SUELO
    makePart("Store_Foundation", Vector3.new(bW + 2, 1.2, bD + 2), CFrame.new(0, 0.6, 0), Color3.fromRGB(120, 124, 128), Enum.Material.Concrete, true)
    makePart("Interior_Floor", Vector3.new(bW - 2, 0.4, bD - 2), CFrame.new(0, 1.2, 0), Color3.fromRGB(225, 222, 215), Enum.Material.Concrete, true)

    -- 2. ESTRUCTURA DE PAREDES
    local wallThick = 1.0
    local floorY = 1.2
    local wallH = bH - 1.2

    -- Pared Izquierda (-X)
    makePart("Wall_Left", Vector3.new(wallThick, wallH, bD), CFrame.new(-bW / 2 + wallThick / 2, floorY + wallH / 2, 0), colWall, Enum.Material.Brick, true)
    -- Pared Derecha (+X)
    makePart("Wall_Right", Vector3.new(wallThick, wallH, bD), CFrame.new(bW / 2 - wallThick / 2, floorY + wallH / 2, 0), colWall, Enum.Material.Brick, true)

    -- Pared Trasera (+Z / Callejón)
    -- Si tiene callejón trasero, dejamos hueco para puerta blindada de servicio
    ${hasBackAlley ? `
    local backDoorW = 4.2
    local backDoorH = 8.0
    local sideBackW = (bW - backDoorW) / 2
    makePart("Wall_Back_L", Vector3.new(sideBackW, wallH, wallThick), CFrame.new(-bW / 2 + sideBackW / 2, floorY + wallH / 2, bD / 2 - wallThick / 2), colWall, Enum.Material.Brick, true)
    makePart("Wall_Back_R", Vector3.new(sideBackW, wallH, wallThick), CFrame.new(bW / 2 - sideBackW / 2, floorY + wallH / 2, bD / 2 - wallThick / 2), colWall, Enum.Material.Brick, true)
    makePart("Wall_Back_Top", Vector3.new(backDoorW, wallH - backDoorH, wallThick), CFrame.new(0, floorY + backDoorH + (wallH - backDoorH) / 2, bD / 2 - wallThick / 2), colWall, Enum.Material.Brick, true)

    -- Puerta blindada de callejón
    local bDoor = makePart("Back_Security_Door", Vector3.new(backDoorW - 0.4, backDoorH - 0.2, 0.6), CFrame.new(0, floorY + backDoorH / 2, bD / 2 - wallThick / 2), Color3.fromRGB(60, 62, 68), Enum.Material.Metal, true)
    CollectionService:AddTag(bDoor, "SecurityDoor")
    bDoor:SetAttribute("Locked", true)
    bDoor:SetAttribute("KeypadCode", "4921")

    -- Tejadillo de chapa sobre la puerta trasera
    makePart("Back_Door_Awning", Vector3.new(backDoorW + 2, 0.4, 3.2), CFrame.new(0, floorY + backDoorH + 0.8, bD / 2 + 1.2), Color3.fromRGB(45, 48, 52), Enum.Material.Metal, true)
    -- Foco exterior industrial sobre puerta trasera
    local alleyLight = makePart("Alley_Spotlight", Vector3.new(1.0, 0.8, 1.2), CFrame.new(0, floorY + backDoorH + 1.8, bD / 2 + 0.4), Color3.fromRGB(240, 240, 220), Enum.Material.Neon, false)
    local sLight = Instance.new("SpotLight", alleyLight)
    sLight.Brightness = 2.5
    sLight.Range = 26
    sLight.Face = Enum.NormalId.Back
    sLight.Color = Color3.fromRGB(255, 230, 190)
    ` : `
    makePart("Wall_Back", Vector3.new(bW, wallH, wallThick), CFrame.new(0, floorY + wallH / 2, bD / 2 - wallThick / 2), colWall, Enum.Material.Brick, true)
    `}

    -- 3. FACHADA FRONTAL (-Z / Calle principal)
    -- Pilares esquineros
    local cornerColW = 2.4
    makePart("Pillar_Front_L", Vector3.new(cornerColW, wallH, wallThick * 1.5), CFrame.new(-bW / 2 + cornerColW / 2, floorY + wallH / 2, -bD / 2 + wallThick / 2), colTrim, Enum.Material.Concrete, true)
    makePart("Pillar_Front_R", Vector3.new(cornerColW, wallH, wallThick * 1.5), CFrame.new(bW / 2 - cornerColW / 2, floorY + wallH / 2, -bD / 2 + wallThick / 2), colTrim, Enum.Material.Concrete, true)

    -- Muro superior / Friso del letrero
    local signH = 4.2
    makePart("Front_Lintel", Vector3.new(bW, signH, wallThick * 1.4), CFrame.new(0, floorY + wallH - signH / 2, -bD / 2 + wallThick / 2), colTrim, Enum.Material.Concrete, true)

    -- Letrero luminoso del negocio
    local signBoard = makePart("Store_Signboard", Vector3.new(bW - 4.0, signH - 1.0, 0.6), CFrame.new(0, floorY + wallH - signH / 2, -bD / 2 - 0.3), colSign, Enum.Material.SmoothPlastic, true)
    local signGui = Instance.new("SurfaceGui", signBoard)
    signGui.Face = Enum.NormalId.Front
    signGui.LightInfluence = 0.3
    signGui.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud
    signGui.PixelsPerStud = 50

    local signFrame = Instance.new("Frame", signGui)
    signFrame.Size = UDim2.new(1, 0, 1, 0)
    signFrame.BackgroundTransparency = 1

    local signTitle = Instance.new("TextLabel", signFrame)
    signTitle.Size = UDim2.new(1, 0, 0.65, 0)
    signTitle.Position = UDim2.new(0, 0, 0.05, 0)
    signTitle.BackgroundTransparency = 1
    signTitle.Text = signText
    signTitle.TextColor3 = Color3.fromRGB(255, 255, 255)
    signTitle.TextScaled = true
    signTitle.Font = Enum.Font.GothamBold

    local signSubLabel = Instance.new("TextLabel", signFrame)
    signSubLabel.Size = UDim2.new(1, 0, 0.3, 0)
    signSubLabel.Position = UDim2.new(0, 0, 0.68, 0)
    signSubLabel.BackgroundTransparency = 1
    signSubLabel.Text = signSub
    signSubLabel.TextColor3 = Color3.fromRGB(240, 240, 180)
    signSubLabel.TextScaled = true
    signSubLabel.Font = Enum.Font.GothamMedium

    -- Entrada central y grandes escaparates a los lados
    local frontDoorW = 5.2
    local frontDoorH = 8.5
    local winW = (bW - 2 * cornerColW - frontDoorW) / 2
    local winH = 7.0
    local winSillH = 1.4

    -- Antepechos bajo las ventanas
    makePart("Win_Sill_L", Vector3.new(winW, winSillH, wallThick), CFrame.new(-frontDoorW / 2 - winW / 2, floorY + winSillH / 2, -bD / 2 + wallThick / 2), colTrim, Enum.Material.Concrete, true)
    makePart("Win_Sill_R", Vector3.new(winW, winSillH, wallThick), CFrame.new(frontDoorW / 2 + winW / 2, floorY + winSillH / 2, -bD / 2 + wallThick / 2), colTrim, Enum.Material.Concrete, true)

    -- Cristaleras frontales
    local glassL = makePart("Window_Glass_L", Vector3.new(winW - 0.4, winH, 0.4), CFrame.new(-frontDoorW / 2 - winW / 2, floorY + winSillH + winH / 2, -bD / 2 + wallThick / 2), Color3.fromRGB(170, 205, 220), Enum.Material.Glass, true)
    glassL.Transparency = 0.55
    local glassR = makePart("Window_Glass_R", Vector3.new(winW - 0.4, winH, 0.4), CFrame.new(frontDoorW / 2 + winW / 2, floorY + winSillH + winH / 2, -bD / 2 + wallThick / 2), Color3.fromRGB(170, 205, 220), Enum.Material.Glass, true)
    glassR.Transparency = 0.55

    -- 4. REJAS DE SEGURIDAD ANTIRROBO EN ESCAPARATES
    ${hasSecurityBars ? `
    local barSpacing = 1.5
    for _, sideX in ipairs({-frontDoorW / 2 - winW / 2, frontDoorW / 2 + winW / 2}) do
        local startX = sideX - winW / 2 + 0.8
        local endX = sideX + winW / 2 - 0.8
        local numBars = math.floor((endX - startX) / barSpacing)
        for b = 0, numBars do
            local bx = startX + b * barSpacing
            makePart("Security_Bar_V", Vector3.new(0.25, winH + 0.4, 0.25),
                CFrame.new(bx, floorY + winSillH + winH / 2, -bD / 2 - 0.1),
                Color3.fromRGB(40, 42, 45), Enum.Material.Metal, true)
        end
        -- Travesaños horizontales
        for _, frac in ipairs({0.25, 0.5, 0.75}) do
            makePart("Security_Bar_H", Vector3.new(winW - 0.4, 0.25, 0.25),
                CFrame.new(sideX, floorY + winSillH + winH * frac, -bD / 2 - 0.1),
                Color3.fromRGB(40, 42, 45), Enum.Material.Metal, true)
        end
    end
    ` : ""}

    -- Puerta de entrada con marco y cristal
    local entranceFrame = makePart("Door_Frame_Front", Vector3.new(frontDoorW, frontDoorH, 0.6), CFrame.new(0, floorY + frontDoorH / 2, -bD / 2 + wallThick / 2), colTrim, Enum.Material.Metal, false)
    local doorGlass = makePart("Door_Glass_Front", Vector3.new(frontDoorW - 0.8, frontDoorH - 0.8, 0.3), CFrame.new(0, floorY + frontDoorH / 2, -bD / 2 + wallThick / 2), Color3.fromRGB(180, 215, 230), Enum.Material.Glass, false)
    doorGlass.Transparency = 0.65
    -- Persiana enrollable de tijera semiabierta sobre la puerta
    makePart("Security_Gate_Rolled", Vector3.new(frontDoorW + 0.4, 1.2, 0.8), CFrame.new(0, floorY + frontDoorH - 0.6, -bD / 2 - 0.2), Color3.fromRGB(90, 94, 100), Enum.Material.Metal, true)

    -- 5. TEJADO Y PRETILES SUPERIORES (ROOFTOP)
    makePart("Roof_Slab", Vector3.new(bW, 0.8, bD), CFrame.new(0, bH + 0.4, 0), Color3.fromRGB(75, 78, 82), Enum.Material.Concrete, true)
    -- Pretil perimetral
    local parapetH = 2.4
    makePart("Parapet_Front", Vector3.new(bW, parapetH, 1.0), CFrame.new(0, bH + 0.8 + parapetH / 2, -bD / 2 + 0.5), colTrim, Enum.Material.Concrete, true)
    makePart("Parapet_Back", Vector3.new(bW, parapetH, 1.0), CFrame.new(0, bH + 0.8 + parapetH / 2, bD / 2 - 0.5), colTrim, Enum.Material.Concrete, true)
    makePart("Parapet_Left", Vector3.new(1.0, parapetH, bD - 2), CFrame.new(-bW / 2 + 0.5, bH + 0.8 + parapetH / 2, 0), colTrim, Enum.Material.Concrete, true)
    makePart("Parapet_Right", Vector3.new(1.0, parapetH, bD - 2), CFrame.new(bW / 2 - 0.5, bH + 0.8 + parapetH / 2, 0), colTrim, Enum.Material.Concrete, true)

    -- Unidad de Climatización Industrial / HVAC en la azotea
    local hvac = makePart("Roof_HVAC_Unit", Vector3.new(6.0, 4.0, 7.0), CFrame.new(4, bH + 0.8 + 2.0, -2), Color3.fromRGB(155, 160, 165), Enum.Material.Metal, true)
    makeCylinder("HVAC_Fan_Top", Vector3.new(0.4, 3.2, 3.2), CFrame.new(4, bH + 0.8 + 4.1, -2) * CFrame.Angles(0, 0, math.rad(90)), Color3.fromRGB(40, 45, 50), Enum.Material.Metal)

    -- 6. INTERIOR JUGABLE (MOSTRADOR BLINDADO Y TRASERA)
    ${includeInterior ? `
    -- Pared divisoria entre zona pública y trastienda
    local partitionZ = 4.0
    local partitionW = bW - 2.0
    local partitionH = wallH - 0.4
    local passDoorW = 3.6

    -- Muro divisorio izquierdo
    makePart("Interior_Wall_L", Vector3.new((partitionW - passDoorW) / 2, partitionH, 0.8),
        CFrame.new(-passDoorW / 2 - (partitionW - passDoorW) / 4, floorY + partitionH / 2, partitionZ),
        Color3.fromRGB(200, 195, 185), Enum.Material.WoodPlanks, true)

    -- Muro divisorio derecho
    makePart("Interior_Wall_R", Vector3.new((partitionW - passDoorW) / 2, partitionH, 0.8),
        CFrame.new(passDoorW / 2 + (partitionW - passDoorW) / 4, floorY + partitionH / 2, partitionZ),
        Color3.fromRGB(200, 195, 185), Enum.Material.WoodPlanks, true)

    -- Mostrador blindado de atención al cliente
    local counterZ = -4.0
    local counterW = 16.0
    local counterH = 3.6
    local counterD = 2.4

    -- Base mostrador
    makePart("Clerk_Counter_Base", Vector3.new(counterW, counterH, counterD),
        CFrame.new(0, floorY + counterH / 2, counterZ),
        Color3.fromRGB(70, 45, 30), Enum.Material.Wood, true)

    -- Cristal antibalas superior del mostrador
    local bProofGlass = makePart("Bulletproof_Glass_Partition", Vector3.new(counterW, 4.5, 0.4),
        CFrame.new(0, floorY + counterH + 2.25, counterZ - 0.8),
        Color3.fromRGB(190, 220, 235), Enum.Material.Glass, true)
    bProofGlass.Transparency = 0.6

    -- Ventanilla pasamonedas de acero
    makePart("Pass_Through_Tray", Vector3.new(2.4, 0.2, 1.6),
        CFrame.new(0, floorY + counterH + 0.1, counterZ - 0.8),
        Color3.fromRGB(180, 185, 190), Enum.Material.Metal, true)

    -- Caja registradora en el mostrador
    makePart("Cash_Register", Vector3.new(1.8, 1.2, 1.8),
        CFrame.new(3.0, floorY + counterH + 0.6, counterZ),
        Color3.fromRGB(45, 48, 52), Enum.Material.Metal, true)

    -- Estanterías de mercancía en la pared lateral de la tienda
    for s = 1, 3 do
        local shelfY = floorY + s * 2.5
        makePart("Store_Shelf_" .. s, Vector3.new(0.8, 0.2, 14.0),
            CFrame.new(-bW / 2 + 1.6, shelfY, -6),
            Color3.fromRGB(140, 95, 60), Enum.Material.Wood, true)
    end

    -- Luz fluorescente de techo en la tienda
    local shopLight = makePart("Fluorescent_Light", Vector3.new(2.0, 0.3, 10.0),
        CFrame.new(0, bH - 0.4, -4),
        Color3.fromRGB(245, 250, 255), Enum.Material.Neon, false)
    local pLight = Instance.new("PointLight", shopLight)
    pLight.Brightness = 1.8
    pLight.Range = 24
    pLight.Color = Color3.fromRGB(235, 245, 255)
    ` : ""}

    -- 7. CALLEJÓN TRASERO Y ACCESORIOS EXTERIORES
    ${hasBackAlley ? `
    -- Contenedor de basura industrial (Dumpster) en el callejón
    local dumpW, dumpH, dumpD = 6.0, 4.4, 4.2
    local dumpCF = CFrame.new(7.0, floorY + dumpH / 2, bD / 2 + 5.0)
    local dumpster = makePart("Alley_Dumpster", Vector3.new(dumpW, dumpH, dumpD), dumpCF, Color3.fromRGB(40, 90, 60), Enum.Material.Metal, true)
    -- Tapa inclinada del contenedor
    makePart("Dumpster_Lid", Vector3.new(dumpW + 0.2, 0.3, dumpD + 0.2), dumpCF * CFrame.new(0, dumpH / 2 + 0.15, 0) * CFrame.Angles(math.rad(15), 0, 0), Color3.fromRGB(25, 28, 30), Enum.Material.SmoothPlastic, true)
    CollectionService:AddTag(dumpster, "Dumpster")

    -- Escalera metálica de escape al tejado en la pared trasera
    local ladderX = -8.0
    local numRungs = 14
    for r = 1, numRungs do
        local rungY = floorY + r * 1.0
        makePart("Roof_Ladder_Rung_" .. r, Vector3.new(2.0, 0.2, 0.2),
            CFrame.new(ladderX, rungY, bD / 2 + 0.6),
            Color3.fromRGB(90, 95, 100), Enum.Material.Metal, false)
    end
    -- Guías verticales de la escalera
    makePart("Ladder_Rail_L", Vector3.new(0.2, bH, 0.2), CFrame.new(ladderX - 1.0, floorY + bH / 2, bD / 2 + 0.6), Color3.fromRGB(70, 75, 80), Enum.Material.Metal, true)
    makePart("Ladder_Rail_R", Vector3.new(0.2, bH, 0.2), CFrame.new(ladderX + 1.0, floorY + bH / 2, bD / 2 + 0.6), Color3.fromRGB(70, 75, 80), Enum.Material.Metal, true)

    -- Cámara de seguridad CCTV en la esquina del tejado apuntando al callejón
    local camMount = makePart("CCTV_Bracket", Vector3.new(0.4, 0.4, 1.2), CFrame.new(bW / 2 - 0.4, bH - 0.5, bD / 2 + 0.6), Color3.fromRGB(50, 52, 55), Enum.Material.Metal, false)
    local camBody = makePart("CCTV_Body", Vector3.new(0.8, 0.8, 1.6), CFrame.new(bW / 2 - 0.4, bH - 0.9, bD / 2 + 1.6) * CFrame.Angles(math.rad(-25), math.rad(-30), 0), Color3.fromRGB(220, 222, 225), Enum.Material.SmoothPlastic, false)
    -- LED rojo de grabación parpadeante
    local camLed = makePart("CCTV_Red_LED", Vector3.new(0.2, 0.2, 0.2), CFrame.new(bW / 2 - 0.3, bH - 1.0, bD / 2 + 2.2), Color3.fromRGB(255, 30, 30), Enum.Material.Neon, false)
    CollectionService:AddTag(camBody, "CCTV_Camera")
    ` : ""}

    -- 8. ESCONDITE CLANDESTINO / DEAD DROP (Schedule 1 Mechanic)
    ${includeDeadDrop ? `
    -- Escondite disimulado en el callejón tras una caja de fusibles / registros suelta
    local stashCF = CFrame.new(-3.5, floorY + 3.2, bD / 2 + 0.3)
    local stashBox = makePart("DeadDrop_ElectricalBox", Vector3.new(1.4, 2.0, 0.7), stashCF, Color3.fromRGB(85, 90, 80), Enum.Material.Metal, true)
    CollectionService:AddTag(stashBox, "DeadDrop_Stash")
    CollectionService:AddTag(stashBox, "Interactable")
    stashBox:SetAttribute("StashId", "Drop_" .. bType .. "_01")
    stashBox:SetAttribute("Capacity", 15)
    stashBox:SetAttribute("Unlocked", false)
    stashBox:SetAttribute("Description", "Caja eléctrica floja en el callejón. Contenedor perfecto para intercambios clandestinos.")

    -- Cable falso hacia el suelo
    makePart("Stash_Conduit", Vector3.new(0.2, 3.2, 0.2), CFrame.new(-3.5, floorY + 1.6, bD / 2 + 0.2), Color3.fromRGB(60, 62, 65), Enum.Material.Metal, false)
    ` : ""}

    CollectionService:AddTag(model, "CommercialBuilding")
    CollectionService:AddTag(model, "ShadyBusiness")
    model:SetAttribute("BusinessType", bType)

    return model
end

buildShadyStorefront()
`;
}
