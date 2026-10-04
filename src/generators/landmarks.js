import { snapVal } from "./grid.js";

/**
 * Generador de Edificios Emblemáticos y Servicios Urbanos Estilo GTA San Andreas.
 * Soporta:
 * - "gas_station": Gasolinera con gran marquesina iluminada, surtidores con mangueras,
 *   tótem de precios gigante, tienda de conveniencia 24/7, máquina de hielo y aparcamientos.
 * - "fast_food_diner": Restaurante de comida rápida tipo Burger Shot / Diner clásico con
 *   carril Drive-Thru, poste de menú con interfono, ventanilla de recogida y gran cartel elevado.
 * - "police_station": Comisaría de policía cívica con helipuerto operativo en azotea,
 *   3 cocheras para patrullas con portones enrollables, torre de radio y aparcamiento vallado.
 */

export function generateLandmarkLuau({
  type = "gas_station",
  name,
  position = [0, 0, 0],
  rotationY = 0,
  seed = 5050,
  parent = "City/Landmarks",
}) {
  const [posX, posY, posZ] = [snapVal(position[0], 4), snapVal(position[1], 4), snapVal(position[2], 4)];
  const landmarkName = name || (type === "gas_station" ? "Gas_Station_24_7" : type === "fast_food_diner" ? "Fast_Food_Diner" : "Police_Precinct");
  const effectiveSeed = typeof seed === "number" ? seed : 5050;

  return `
local CollectionService = game:GetService("CollectionService")

local function buildLandmark()
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
    model.Name = "${landmarkName}"
    pcall(function() model.LevelOfDetail = Enum.ModelLevelOfDetail.StreamingMesh end)

    local baseCF = CFrame.new(${posX}, ${posY}, ${posZ}) * CFrame.Angles(0, math.rad(${rotationY}), 0)
    local seedVal = ${effectiveSeed}

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
        p.CFrame = baseCF * relCF
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
        w.Size = sz
        w.CFrame = baseCF * relCF
        w.Color = col
        w.Material = mat or Enum.Material.SmoothPlastic
        return w
    end

    local function makeCylinder(pName, sz, relCF, col, mat, canCol)
        local p = Instance.new("Part", model)
        p.Name = pName
        p.Shape = Enum.PartType.Cylinder
        p.Anchored = true
        p.CanCollide = canCol ~= nil and canCol or false
        p.CanTouch = false
        p.CanQuery = false
        p.Size = sz
        p.CFrame = baseCF * relCF
        p.Color = col
        p.Material = mat or Enum.Material.Metal
        return p
    end

    local landmarkType = "${type}"

    if landmarkType == "gas_station" then
        -- -------------------------------------------------------------
        -- 1. GASOLINERA CON TIENDA 24/7 ESTILO GTA SAN ANDREAS (XOOMER)
        -- -------------------------------------------------------------
        local lotW, lotD = 90, 80
        -- Explanada de asfalto y hormigón
        makePart("Gas_Lot_Asphalt", Vector3.new(lotW, 1.2, lotD), CFrame.new(0, 0.6, 0), Color3.fromRGB(42, 44, 48), Enum.Material.Concrete, true)

        -- A. GRAN MARQUESINA ILUMINADA SOBRE SURTIDORES
        local canopyW, canopyD, canopyH = 46, 26, 17
        local canopyZ = 16
        -- Cubierta de la marquesina
        local canopyRoof = makePart("Canopy_Roof", Vector3.new(canopyW, 2.4, canopyD), CFrame.new(0, canopyH, canopyZ), Color3.fromRGB(240, 242, 245), Enum.Material.Metal, true)
        -- Fascia perimetral roja/azul de la marca
        makePart("Canopy_Fascia_Front", Vector3.new(canopyW + 0.4, 1.8, 0.6), CFrame.new(0, canopyH, canopyZ + canopyD / 2), Color3.fromRGB(215, 35, 35), Enum.Material.SmoothPlastic, false, true)
        makePart("Canopy_Fascia_Back", Vector3.new(canopyW + 0.4, 1.8, 0.6), CFrame.new(0, canopyH, canopyZ - canopyD / 2), Color3.fromRGB(215, 35, 35), Enum.Material.SmoothPlastic, false, true)
        makePart("Canopy_Neon_Strip", Vector3.new(canopyW - 2, 0.4, 0.2), CFrame.new(0, canopyH - 0.5, canopyZ + canopyD / 2 + 0.3), Color3.fromRGB(255, 230, 80), Enum.Material.Neon, false, true)

        -- 4 Columnas de acero que soportan la marquesina
        local colX = canopyW / 2 - 8
        local colZ = canopyD / 2 - 6
        local colPositions = {
            {-colX, canopyZ - colZ},
            {colX, canopyZ - colZ},
            {-colX, canopyZ + colZ},
            {colX, canopyZ + colZ},
        }
        for i, cp in ipairs(colPositions) do
            makePart("Canopy_Col_" .. i, Vector3.new(1.8, canopyH, 1.8), CFrame.new(cp[1], canopyH / 2, cp[2]), Color3.fromRGB(70, 75, 82), Enum.Material.Metal, true)
        end

        -- Focos LED embutidos en el techo de la marquesina
        for fx = -12, 12, 12 do
            for fz = canopyZ - 6, canopyZ + 6, 12 do
                local lamp = makePart("Canopy_Downlight", Vector3.new(2.4, 0.2, 2.4), CFrame.new(fx, canopyH - 1.1, fz), Color3.fromRGB(255, 250, 235), Enum.Material.Neon, false, true)
                local pl = Instance.new("PointLight", lamp)
                pl.Color = Color3.fromRGB(255, 245, 220)
                pl.Range = 26
                pl.Brightness = 1.8
                pl.Shadows = true
            end
        end

        -- B. 2 ISLETAS CON 4 SURTIDORES DE COMBUSTIBLE DIGITALES
        local islandW, islandD, islandH = 4.2, 20, 1.2
        for s = 1, 2 do
            local isX = (s == 1) and -10 or 10
            -- Isleta de hormigón con bordillo protector
            makePart("Pump_Island_" .. s, Vector3.new(islandW, islandH, islandD), CFrame.new(isX, 1.2 + islandH / 2, canopyZ), Color3.fromRGB(215, 218, 222), Enum.Material.Concrete, true)
            -- Bolardos amarillos de protección en los extremos
            makeCylinder("Bollard_N_" .. s, Vector3.new(0.8, 3.2, 0.8), CFrame.new(isX, 1.2 + 1.6, canopyZ - islandD / 2 + 1.2) * CFrame.Angles(0, 0, math.rad(90)), Color3.fromRGB(235, 190, 35), Enum.Material.Metal, true)
            makeCylinder("Bollard_S_" .. s, Vector3.new(0.8, 3.2, 0.8), CFrame.new(isX, 1.2 + 1.6, canopyZ + islandD / 2 - 1.2) * CFrame.Angles(0, 0, math.rad(90)), Color3.fromRGB(235, 190, 35), Enum.Material.Metal, true)

            -- 2 Surtidores por isleta (Norte y Sur)
            for p = 1, 2 do
                local pZ = canopyZ + (p == 1 and -4.5 or 4.5)
                local pumpBody = makePart("Fuel_Pump_" .. s .. "_" .. p, Vector3.new(2.4, 5.8, 3.2), CFrame.new(isX, 1.2 + islandH + 2.9, pZ), Color3.fromRGB(225, 40, 40), Enum.Material.Metal, true)
                -- Pantalla digital de importe y litros
                local screen = makePart("Pump_Screen_" .. s .. "_" .. p, Vector3.new(2.5, 1.4, 1.8), CFrame.new(isX, 1.2 + islandH + 4.2, pZ), Color3.fromRGB(40, 44, 50), Enum.Material.SmoothPlastic, false, true)
                local neonNum = makePart("Pump_Digits_" .. s .. "_" .. p, Vector3.new(2.55, 0.6, 1.4), CFrame.new(isX, 1.2 + islandH + 4.2, pZ), Color3.fromRGB(80, 255, 120), Enum.Material.Neon, false, true)
            end
        end

        -- C. TIENDA DE CONVENIENCIA 24/7 EN EL FONDO DE LA PARCELA
        local storeW, storeD, storeH = 48, 26, 13
        local storeZ = -lotD / 2 + storeD / 2 + 4
        -- Cuerpo del edificio comercial
        makePart("Store_Building", Vector3.new(storeW, storeH, storeD), CFrame.new(0, 1.2 + storeH / 2, storeZ), Color3.fromRGB(235, 230, 220), Enum.Material.Concrete, true)
        -- Cornisa superior de remate
        makePart("Store_Roof_Trim", Vector3.new(storeW + 1.2, 1.0, storeD + 1.2), CFrame.new(0, 1.2 + storeH + 0.5, storeZ), Color3.fromRGB(180, 45, 45), Enum.Material.Metal, false, true)

        -- Escaparates de cristal de suelo a techo en fachada frontal (+Z de la tienda)
        local glassW = storeW * 0.7
        local sFrontZ = storeZ + storeD / 2 + 0.1
        local shopGlass = makePart("Store_Showcase_Glass", Vector3.new(glassW, 8.5, 0.3), CFrame.new(0, 1.2 + 5.5, sFrontZ), Color3.fromRGB(160, 210, 240), Enum.Material.Glass, false, true)
        shopGlass.Transparency = 0.35
        shopGlass.Reflectance = 0.45

        -- Doble puerta acristalada automática
        local doorP = makePart("Store_Entrance_Door", Vector3.new(6.4, 8.0, 0.4), CFrame.new(0, 1.2 + 4.0, sFrontZ + 0.1), Color3.fromRGB(45, 50, 58), Enum.Material.Metal, true)
        local dGlass = makePart("Store_Door_Glass", Vector3.new(5.6, 7.2, 0.2), CFrame.new(0, 1.2 + 4.0, sFrontZ + 0.1), Color3.fromRGB(180, 220, 250), Enum.Material.Glass, false, true)
        dGlass.Transparency = 0.35

        -- Rótulo luminoso 3D gigante "24-7 CONVENIENCE STORE"
        local signBox = makePart("Store_Signboard", Vector3.new(glassW + 4, 2.6, 0.8), CFrame.new(0, 1.2 + 10.8, sFrontZ + 0.4), Color3.fromRGB(35, 38, 44), Enum.Material.SmoothPlastic, false, true)
        local neonSign = makePart("Store_Neon_Logo", Vector3.new(glassW + 2, 1.6, 0.3), CFrame.new(0, 1.2 + 10.8, sFrontZ + 0.8), Color3.fromRGB(255, 235, 60), Enum.Material.Neon, false, true)
        local sL = Instance.new("PointLight", neonSign)
        sL.Color = Color3.fromRGB(255, 230, 80)
        sL.Range = 18
        sL.Brightness = 1.4

        -- D. ATREZZO DE GASOLINERA: TÓTEM DE PRECIOS, MÁQUINA DE HIELO Y APARCAMIENTOS
        -- Tótem de precios en la esquina de la entrada (Pylon Price Sign)
        local totemX = lotW / 2 - 8
        local totemZ = lotD / 2 - 8
        local poleTotem = makePart("Price_Totem_Pole", Vector3.new(1.4, 26, 1.4), CFrame.new(totemX, 1.2 + 13, totemZ), Color3.fromRGB(55, 60, 68), Enum.Material.Metal, true)
        local boardTotem = makePart("Price_Totem_Board", Vector3.new(8.0, 11, 2.0), CFrame.new(totemX, 1.2 + 20, totemZ), Color3.fromRGB(210, 35, 35), Enum.Material.SmoothPlastic, false, true)
        local priceDigits = makePart("Price_Digits_Neon", Vector3.new(6.8, 8.5, 2.2), CFrame.new(totemX, 1.2 + 20, totemZ), Color3.fromRGB(80, 255, 100), Enum.Material.Neon, false, true)
        local tL = Instance.new("PointLight", priceDigits)
        tL.Color = Color3.fromRGB(80, 255, 100)
        tL.Range = 22
        tL.Brightness = 1.5

        -- Arcón congelador exterior de bolsas de hielo ("ICE")
        local iceX = storeW / 2 - 6
        local iceBox = makePart("Ice_Chest", Vector3.new(5.0, 3.6, 3.0), CFrame.new(iceX, 1.2 + 1.8, sFrontZ + 1.5), Color3.fromRGB(235, 240, 245), Enum.Material.Metal, true)
        makePart("Ice_Lid", Vector3.new(4.8, 0.4, 2.8), CFrame.new(iceX, 1.2 + 3.7, sFrontZ + 1.5), Color3.fromRGB(40, 110, 185), Enum.Material.SmoothPlastic, false, true)

        -- Cajero automático (ATM) empotrado en la fachada
        local atmX = -storeW / 2 + 5
        makePart("ATM_Machine", Vector3.new(3.0, 5.0, 1.5), CFrame.new(atmX, 1.2 + 3.0, sFrontZ + 0.6), Color3.fromRGB(45, 75, 130), Enum.Material.Metal, true)
        local atmScreen = makePart("ATM_Screen", Vector3.new(1.8, 1.2, 0.1), CFrame.new(atmX, 1.2 + 3.5, sFrontZ + 1.4), Color3.fromRGB(0, 220, 255), Enum.Material.Neon, false, true)

        -- Plazas de aparcamiento pintadas con líneas blancas y topes de hormigón
        for p = 1, 4 do
            local parkX = -storeW / 2 + 10 + (p - 1) * 9
            local parkZ = storeZ + storeD / 2 + 8
            -- Líneas delimitadoras de plaza
            makePart("Park_Line_L_" .. p, Vector3.new(0.4, 0.05, 14), CFrame.new(parkX - 4, 1.23, parkZ), Color3.fromRGB(245, 245, 245), Enum.Material.SmoothPlastic, false, true)
            makePart("Park_Line_R_" .. p, Vector3.new(0.4, 0.05, 14), CFrame.new(parkX + 4, 1.23, parkZ), Color3.fromRGB(245, 245, 245), Enum.Material.SmoothPlastic, false, true)
            -- Tope de rueda de hormigón (Wheel stop)
            makePart("Wheel_Stop_" .. p, Vector3.new(6.0, 0.6, 0.8), CFrame.new(parkX, 1.2 + 0.3, parkZ - 5.5), Color3.fromRGB(160, 162, 168), Enum.Material.Concrete, true)
        end

    elseif landmarkType == "fast_food_diner" then
        -- -------------------------------------------------------------
        -- 2. RESTAURANTE DE COMIDA RÁPIDA / DINER CON DRIVE-THRU (BURGER SHOT)
        -- -------------------------------------------------------------
        local lotW, lotD = 86, 80
        makePart("Diner_Asphalt_Lot", Vector3.new(lotW, 1.2, lotD), CFrame.new(0, 0.6, 0), Color3.fromRGB(40, 42, 46), Enum.Material.Concrete, true)

        local bW, bD, bH = 42, 34, 13
        local bX = -10
        local bZ = 0
        -- Edificio estilo retro con azulejo o estuco
        makePart("Diner_Building", Vector3.new(bW, bH, bD), CFrame.new(bX, 1.2 + bH / 2, bZ), Color3.fromRGB(235, 225, 205), Enum.Material.Concrete, true)
        -- Banda roja decorativa en la parte superior (fascia retro)
        makePart("Diner_Roof_Trim", Vector3.new(bW + 1.0, 1.6, bD + 1.0), CFrame.new(bX, 1.2 + bH + 0.8, bZ), Color3.fromRGB(210, 40, 35), Enum.Material.SmoothPlastic, false, true)

        -- Gran ventanal panorámico de mesas
        local frontZ = bZ + bD / 2 + 0.1
        local dGlass = makePart("Diner_Front_Glass", Vector3.new(bW * 0.7, 7.5, 0.3), CFrame.new(bX, 1.2 + 5.0, frontZ), Color3.fromRGB(180, 220, 245), Enum.Material.Glass, false, true)
        dGlass.Transparency = 0.35

        -- Puerta de entrada con tirador
        makePart("Diner_Door", Vector3.new(4.5, 7.5, 0.4), CFrame.new(bX + bW / 2 - 4.5, 1.2 + 3.75, frontZ), Color3.fromRGB(50, 54, 62), Enum.Material.Metal, true)

        -- Rótulo frontal iluminado "BURGER SHOT / DINER"
        local dinerSign = makePart("Diner_Front_Sign", Vector3.new(24, 3.2, 0.6), CFrame.new(bX, 1.2 + bH + 2.8, frontZ + 0.2), Color3.fromRGB(35, 38, 44), Enum.Material.SmoothPlastic, false, true)
        local dinerNeon = makePart("Diner_Neon_Text", Vector3.new(22, 2.2, 0.3), CFrame.new(bX, 1.2 + bH + 2.8, frontZ + 0.6), Color3.fromRGB(255, 185, 40), Enum.Material.Neon, false, true)
        local dL = Instance.new("PointLight", dinerNeon)
        dL.Color = Color3.fromRGB(255, 180, 40)
        dL.Range = 22
        dL.Brightness = 1.6

        -- CARRIL DE DRIVE-THRU EN EL LATERAL DERECHO (+X)
        local driveLaneX = bX + bW / 2 + 8
        -- Poste de menú con interfono de pedidos (Order Menu Box)
        local menuBox = makePart("DriveThru_Menu", Vector3.new(1.0, 6.5, 5.0), CFrame.new(driveLaneX + 6, 1.2 + 3.25, bZ + 6), Color3.fromRGB(45, 48, 55), Enum.Material.Metal, true)
        local menuScreen = makePart("Menu_Illuminated_Panel", Vector3.new(0.2, 5.5, 4.2), CFrame.new(driveLaneX + 5.4, 1.2 + 3.25, bZ + 6), Color3.fromRGB(255, 245, 210), Enum.Material.Neon, false, true)
        local speakerBox = makePart("Speaker_Mic", Vector3.new(0.6, 1.0, 1.0), CFrame.new(driveLaneX + 5.2, 1.2 + 3.0, bZ + 2.5), Color3.fromRGB(30, 32, 38), Enum.Material.Metal, true)

        -- Ventanilla de recogida de pedidos (Pickup Window) en la pared del restaurante
        local windowCF = CFrame.new(bX + bW / 2 + 0.1, 1.2 + 4.8, bZ - 4) * CFrame.Angles(0, math.rad(90), 0)
        makePart("Pickup_Window_Glass", Vector3.new(3.8, 3.2, 0.3), windowCF, Color3.fromRGB(160, 205, 240), Enum.Material.Glass, false, true)
        makePart("Pickup_Canopy_Trim", Vector3.new(4.4, 0.4, 1.8), windowCF * CFrame.new(0, 1.8, 0.9), Color3.fromRGB(215, 35, 35), Enum.Material.Metal, false, true)

        -- Cartel de poste gigante para autopista (Giant Pole Sign de 32 studs)
        local signPoleX = lotW / 2 - 8
        local signPoleZ = lotD / 2 - 8
        makePart("Giant_Sign_Pole", Vector3.new(1.6, 32, 1.6), CFrame.new(signPoleX, 1.2 + 16, signPoleZ), Color3.fromRGB(65, 70, 78), Enum.Material.Metal, true)
        local giantLogo = makePart("Giant_Sign_Head", Vector3.new(10, 8, 1.8), CFrame.new(signPoleX, 1.2 + 28, signPoleZ), Color3.fromRGB(255, 200, 40), Enum.Material.Neon, false, true)
        giantLogo.Shape = Enum.PartType.Ball
        local gSignLight = Instance.new("PointLight", giantLogo)
        gSignLight.Color = Color3.fromRGB(255, 195, 45)
        gSignLight.Range = 28
        gSignLight.Brightness = 2.0

    elseif landmarkType == "police_station" then
        -- -------------------------------------------------------------
        -- 3. COMISARÍA DE POLICÍA CÍVICA CON HELIPUERTO Y COCHERAS
        -- -------------------------------------------------------------
        local lotW, lotD = 96, 88
        makePart("Police_Asphalt_Lot", Vector3.new(lotW, 1.2, lotD), CFrame.new(0, 0.6, 0), Color3.fromRGB(42, 45, 50), Enum.Material.Concrete, true)

        local bW, bD, bH = 54, 40, 20
        local bX = -8
        local bZ = -4
        -- Edificio de 2 plantas de hormigón y ladrillo noble
        makePart("Police_Main_Building", Vector3.new(bW, bH, bD), CFrame.new(bX, 1.2 + bH / 2, bZ), Color3.fromRGB(195, 198, 205), Enum.Material.Concrete, true)
        -- Banda azul corporativa de policía
        makePart("Police_Blue_Fascia", Vector3.new(bW + 0.6, 1.8, bD + 0.6), CFrame.new(bX, 1.2 + bH / 2, bZ), Color3.fromRGB(30, 60, 135), Enum.Material.SmoothPlastic, false, true)

        -- Portal de entrada monumental con escudo policial
        local frontZ = bZ + bD / 2 + 0.2
        makePart("Police_Entrance_Portal", Vector3.new(10, 9.5, 1.4), CFrame.new(bX, 1.2 + 4.75, frontZ), Color3.fromRGB(45, 50, 60), Enum.Material.Granite, true)
        local pDoors = makePart("Police_Glass_Doors", Vector3.new(8, 8.0, 0.4), CFrame.new(bX, 1.2 + 4.0, frontZ + 0.1), Color3.fromRGB(170, 210, 245), Enum.Material.Glass, false, true)
        pDoors.Transparency = 0.35

        -- Cartel iluminado "POLICE DEPARTMENT / 71st PRECINCT"
        local pSign = makePart("Police_Sign_Neon", Vector3.new(14, 2.2, 0.4), CFrame.new(bX, 1.2 + 11.5, frontZ + 0.6), Color3.fromRGB(220, 235, 255), Enum.Material.Neon, false, true)
        local psl = Instance.new("PointLight", pSign)
        psl.Color = Color3.fromRGB(180, 220, 255)
        psl.Range = 18
        psl.Brightness = 1.4

        -- 3 COCHERAS PARA PATRULLAS CON PORTONES ENROLLABLES (Garage Bays)
        local bayW = 10.5
        local bayH = 8.5
        for bay = 1, 3 do
            local bayX = bX - bW / 2 + 7 + (bay - 1) * 13
            makePart("Patrol_Bay_Door_" .. bay, Vector3.new(bayW, bayH, 0.4), CFrame.new(bayX, 1.2 + bayH / 2, frontZ - 0.2), Color3.fromRGB(75, 80, 90), Enum.Material.Metal, true)
            -- Foco rojo/azul sobre las cocheras
            local bayLight = makePart("Emergency_Beacon_" .. bay, Vector3.new(1, 0.8, 1), CFrame.new(bayX, 1.2 + bayH + 1.2, frontZ), (bay % 2 == 1) and Color3.fromRGB(255, 30, 30) or Color3.fromRGB(30, 90, 255), Enum.Material.Neon, false, true)
            bayLight.Shape = Enum.PartType.Ball
        end

        -- HELIPUERTO OPERATIVO EN LA AZOTEA
        local roofY = 1.2 + bH
        local heliPadCF = CFrame.new(bX, roofY + 0.2, bZ)
        -- Plataforma circular del helipuerto
        local padBase = makeCylinder("Helipad_Base", Vector3.new(28, 0.4, 28), heliPadCF * CFrame.Angles(0, 0, math.rad(90)), Color3.fromRGB(50, 54, 60), Enum.Material.Concrete, true)
        -- Círculo amarillo y letra 'H'
        makePart("Helipad_Bar_L", Vector3.new(1.4, 0.08, 12), heliPadCF * CFrame.new(-3.5, 0.22, 0), Color3.fromRGB(245, 205, 45), Enum.Material.Neon, false, true)
        makePart("Helipad_Bar_R", Vector3.new(1.4, 0.08, 12), heliPadCF * CFrame.new(3.5, 0.22, 0), Color3.fromRGB(245, 205, 45), Enum.Material.Neon, false, true)
        makePart("Helipad_Bar_Cross", Vector3.new(8.4, 0.08, 1.4), heliPadCF * CFrame.new(0, 0.22, 0), Color3.fromRGB(245, 205, 45), Enum.Material.Neon, false, true)

        -- 4 Luces perimetrales de balizamiento del helipuerto
        local hRadius = 14
        local hLights = {
            {-hRadius, 0}, {hRadius, 0}, {0, -hRadius}, {0, hRadius}
        }
        for li, lp in ipairs(hLights) do
            local hlPart = makePart("Helipad_Light_" .. li, Vector3.new(0.8, 0.6, 0.8), heliPadCF * CFrame.new(lp[1], 0.4, lp[2]), Color3.fromRGB(80, 255, 120), Enum.Material.Neon, false, true)
            local hlp = Instance.new("PointLight", hlPart)
            hlp.Color = Color3.fromRGB(80, 255, 120)
            hlp.Range = 12
            hlp.Brightness = 1.2
        end

        -- Torre de telecomunicaciones y radio policial
        makePart("Police_Radio_Mast", Vector3.new(1.0, 28, 1.0), heliPadCF * CFrame.new(bW / 2 - 3, 14, -bD / 2 + 3), Color3.fromRGB(75, 80, 88), Enum.Material.Metal, false, true)
    end

    print(string.format("[Landmarks GTA-AAA] ✅ '%s' construido con éxito en '%s'.", "${landmarkName}", "${parent}"))
end

buildLandmark()
`;
}
