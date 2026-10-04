import { snapVal } from "./grid.js";

/**
 * Generador de Motel de Carretera Clásico Americano de 2 Plantas (Estilo Schedule 1 / Sunset Motel).
 * Incluye:
 * - Edificio de 2 plantas con pasarelas exteriores transitables y barandillas metálicas
 * - Escaleras exteriores de acero con peldaños de chapa estriada (DiamondPlate)
 * - Habitaciones numeradas individuales con puertas, pomos de latón y compresores A/C bajo las ventanas
 * - Focos y downlights cálidos en las puertas de cada habitación
 * - Recepción / Oficina del gerente con cartel de neón "OFFICE"
 * - Zona de máquinas de hielo ("ICE") y refrescos empotrada bajo las escaleras
 * - Parking frontal asfaltado con plazas numeradas frente a cada habitación
 * - Gran tótem de neón retro de carretera ("MOTEL - NO VACANCY") con iluminación dinámica
 */

export function generateMotelLuau({
  name = "Sunset_Roadside_Motel",
  position = [0, 0, 0],
  roomsPerFloor = 6,
  rotationY = 0,
  includeNeonSign = true,
  includeIceVending = true,
  seed = 6606,
  parent = "City/Commercial",
}) {
  const [posX, posY, posZ] = [snapVal(position[0], 4), snapVal(position[1], 4), snapVal(position[2], 4)];
  const numRooms = Math.max(3, Math.min(12, Math.floor(roomsPerFloor)));
  const rotY = typeof rotationY === "number" ? rotationY : 0;
  const effectiveSeed = typeof seed === "number" ? seed : 6606;

  // Cada habitación tiene 12 studs de fachada
  const roomW = 12.0;
  const motelW = numRooms * roomW + 18; // espacio extra para recepción y escaleras
  const motelD = 24.0;
  const parkingD = 28.0;
  const totalLotD = motelD + parkingD;
  const floorH = 10.5;
  const totalH = floorH * 2;

  return `
local CollectionService = game:GetService("CollectionService")

local function buildMotel()
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
    local motelW = ${motelW}
    local motelD = ${motelD}
    local parkD = ${parkingD}
    local totalLotD = ${totalLotD}
    local numRooms = ${numRooms}
    local roomW = ${roomW}
    local floorH = ${floorH}
    local totalH = ${totalH}

    -- PALETA RETRO MOTEL
    local colWall = Color3.fromRGB(225, 215, 195) -- Estuco tostado desgastado
    local colTrim = Color3.fromRGB(180, 50, 45)    -- Rojo carmesí retro
    local colWalkway = Color3.fromRGB(165, 168, 175)
    local colRailing = Color3.fromRGB(45, 48, 55)
    local colDoor = Color3.fromRGB(65, 95, 125)    -- Puertas azul motel vintage

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
        p.Material = mat or Enum.Material.Concrete
        return p
    end

    local function makeCyl(pName, sz, relCF, col, mat)
        local p = Instance.new("Part", model)
        p.Name = pName
        p.Shape = Enum.PartType.Cylinder
        p.Anchored = true
        p.CanCollide = false
        p.CanTouch = false
        p.Size = sz
        p.CFrame = originCF * relCF
        p.Color = col
        p.Material = mat or Enum.Material.Metal
        return p
    end

    -- 1. EXPLANADA DE APARCAMIENTO Y CIMENTACIÓN
    -- Calzada de asfalto del parking frontal (+Z)
    local parkZ = motelD / 2 + parkD / 2
    makePart("Motel_Parking_Lot", Vector3.new(motelW + 12, 1.2, parkD), CFrame.new(0, 0.6, parkZ), Color3.fromRGB(42, 44, 48), Enum.Material.Concrete, true)

    -- Cimentación elevada del edificio
    makePart("Motel_Foundation", Vector3.new(motelW + 1.2, 1.4, motelD + 1.2), CFrame.new(0, 0.7, 0), Color3.fromRGB(130, 134, 140), Enum.Material.Concrete, true)

    -- 2. CUERPO ESTRUCTURAL PRINCIPAL DEL EDIFICIO (2 PLANTAS)
    makePart("Motel_Main_Block", Vector3.new(motelW, totalH, motelD), CFrame.new(0, 1.4 + totalH / 2, 0), colWall, Enum.Material.Concrete, true)

    -- Banda perimetral decorativa roja superior (Fascia)
    makePart("Motel_Roof_Fascia", Vector3.new(motelW + 1.6, 2.0, motelD + 1.6), CFrame.new(0, 1.4 + totalH + 1.0, 0), colTrim, Enum.Material.SmoothPlastic, false, true)

    -- Cubierta plana con grava
    makePart("Motel_Roof_Deck", Vector3.new(motelW, 0.8, motelD), CFrame.new(0, 1.4 + totalH + 0.4, 0), Color3.fromRGB(80, 84, 90), Enum.Material.Concrete, true)

    -- 3. PASARELA EXTERIOR DEL PISO 2 Y BARANDILLA CONTINUA
    local walkDepth = 5.2
    local walkZ = motelD / 2 + walkDepth / 2
    local walkY = 1.4 + floorH

    -- Losa de la pasarela volada
    makePart("Walkway_Floor_Fl2", Vector3.new(motelW, 0.8, walkDepth), CFrame.new(0, walkY - 0.4, walkZ), colWalkway, Enum.Material.Concrete, true)

    -- Columnas metálicas estructurales que soportan la pasarela
    for colX = -motelW / 2 + 6, motelW / 2 - 6, roomW do
        makePart("Walkway_Stilt", Vector3.new(0.8, floorH, 0.8), CFrame.new(colX, 1.4 + floorH / 2, walkZ + walkDepth / 2 - 0.5), Color3.fromRGB(45, 48, 54), Enum.Material.Metal, true)
    end

    -- Barandilla de seguridad en la pasarela del segundo piso
    local railH = 3.2
    makePart("Walkway_Railing_Main", Vector3.new(motelW, railH, 0.3), CFrame.new(0, walkY + railH / 2, walkZ + walkDepth / 2 - 0.2), colRailing, Enum.Material.Metal, true)
    makePart("Walkway_Railing_L", Vector3.new(0.3, railH, walkDepth), CFrame.new(-motelW / 2 + 0.15, walkY + railH / 2, walkZ), colRailing, Enum.Material.Metal, true)
    makePart("Walkway_Railing_R", Vector3.new(0.3, railH, walkDepth), CFrame.new(motelW / 2 - 0.15, walkY + railH / 2, walkZ), colRailing, Enum.Material.Metal, true)

    -- 4. ESCALERA EXTERIOR DE ACERO (Extremo Derecho +X)
    local stairX = motelW / 2 - 8
    local stairW = 5.5
    local stairZ = walkZ + 1.0

    -- Tramo de escalones de chapa estriada
    local numSteps = 14
    for st = 1, numSteps do
        local frac = st / numSteps
        local stepY = 1.4 + frac * floorH
        local stepZPos = walkZ + walkDepth / 2 - (st * (walkDepth / numSteps))
        makePart("Stair_Tread_" .. st, Vector3.new(stairW, 0.3, 1.4), CFrame.new(stairX, stepY, stepZPos), Color3.fromRGB(60, 65, 72), Enum.Material.DiamondPlate, true)
    end
    -- Barandilla de la escalera
    makePart("Stair_Handrail", Vector3.new(0.3, floorH + 3.0, 0.3), CFrame.new(stairX - stairW / 2, 1.4 + floorH / 2, stairZ), colRailing, Enum.Material.Metal, true)

    -- 5. HABITACIONES NUMERADAS (Planta Baja 101-10X y Planta Alta 201-20X)
    local startRoomX = -motelW / 2 + 10

    local function spawnRoomUnit(roomNum, floorIdx, rX)
        local rBaseY = 1.4 + (floorIdx - 1) * floorH
        local facadeZ = motelD / 2 + 0.25

        -- Puerta de la habitación con marco
        local doorW, doorH = 3.6, 7.8
        local doorX = rX - 2.8
        local doorCF = CFrame.new(doorX, rBaseY + doorH / 2 + 0.2, facadeZ)
        makePart("Door_Frame_" .. roomNum, Vector3.new(doorW + 0.6, doorH + 0.4, 0.4), doorCF, Color3.fromRGB(240, 240, 245), Enum.Material.WoodPlanks, true)
        makePart("Door_Leaf_" .. roomNum, Vector3.new(doorW, doorH, 0.3), doorCF * CFrame.new(0, 0, 0.1), colDoor, Enum.Material.WoodPlanks, true)
        -- Pomo de latón
        makePart("Door_Knob_" .. roomNum, Vector3.new(0.25, 0.25, 0.3), doorCF * CFrame.new(1.3, -0.2, 0.3), Color3.fromRGB(225, 195, 60), Enum.Material.Metal, false, true)

        -- Plaquita con el número de habitación (ej: "101")
        makePart("Plate_Num_" .. roomNum, Vector3.new(0.8, 0.4, 0.1), doorCF * CFrame.new(0, 1.6, 0.28), Color3.fromRGB(220, 190, 50), Enum.Material.SmoothPlastic, false, true)

        -- Farol cálido exterior sobre la puerta
        local lamp = makePart("Room_Lamp_" .. roomNum, Vector3.new(0.7, 0.8, 0.5), CFrame.new(doorX, rBaseY + doorH + 1.2, facadeZ + 0.35), Color3.fromRGB(255, 235, 175), Enum.Material.Neon, false, true)
        local pl = Instance.new("PointLight", lamp)
        pl.Color = Color3.fromRGB(255, 230, 180)
        pl.Range = 12
        pl.Brightness = 1.2

        -- Ventana con cortinas y cristal (sin z-fighting con la pared de hormigón)
        local winW, winH = 4.0, 4.5
        local winX = rX + 2.4
        local winY = rBaseY + 5.2
        local winCF = CFrame.new(winX, winY, facadeZ)
        makePart("Win_Frame_" .. roomNum, Vector3.new(winW + 0.6, winH + 0.6, 0.35), winCF, Color3.fromRGB(240, 240, 245), Enum.Material.WoodPlanks, false, true)
        -- Fondo interior opaco para anular el conflicto de transparencia con la pared
        makePart("Win_Backing_" .. roomNum, Vector3.new(winW, winH, 0.05), winCF * CFrame.new(0, 0, -0.05), Color3.fromRGB(28, 30, 35), Enum.Material.SmoothPlastic, false, true)
        local glass = makePart("Win_Glass_" .. roomNum, Vector3.new(winW, winH, 0.15), winCF * CFrame.new(0, 0, 0.1), Color3.fromRGB(180, 215, 240), Enum.Material.Glass, false, true)
        glass.Transparency = 0.35

        -- Luz interior en algunas habitaciones
        if (roomNum * 17) % 100 < 60 then
            glass.Material = Enum.Material.Neon
            glass.Color = Color3.fromRGB(255, 230, 170)
            glass.Transparency = 0.15
        end

        -- Compresor de aire acondicionado (A/C) empotrado bajo la ventana (icono de motel)
        local acCF = CFrame.new(winX, rBaseY + 1.4, facadeZ + 0.6)
        makePart("AC_Unit_" .. roomNum, Vector3.new(3.0, 1.8, 1.2), acCF, Color3.fromRGB(185, 188, 192), Enum.Material.Metal, true)
        makePart("AC_Vent_" .. roomNum, Vector3.new(2.6, 1.2, 0.1), acCF * CFrame.new(0, 0, 0.6), Color3.fromRGB(45, 48, 54), Enum.Material.Metal, false, true)

        -- Plaza de aparcamiento pintada frente a la habitación (en planta baja)
        if floorIdx == 1 then
            local parkBayZ = motelD / 2 + walkDepth + parkD / 2
            makePart("Park_Line_L_" .. roomNum, Vector3.new(0.4, 0.05, parkD - 4), CFrame.new(rX - roomW / 2 + 0.4, 1.22, parkBayZ), Color3.fromRGB(240, 240, 245), Enum.Material.SmoothPlastic, false, true)
            -- Tope de rueda de hormigón
            makePart("Wheel_Stop_" .. roomNum, Vector3.new(6.0, 0.5, 0.8), CFrame.new(rX, 1.4, motelD / 2 + walkDepth + 4), Color3.fromRGB(160, 162, 168), Enum.Material.Concrete, true)
        end
    end

    -- Generar las habitaciones en ambas plantas
    for i = 1, numRooms do
        local rX = startRoomX + (i - 1) * roomW
        spawnRoomUnit(100 + i, 1, rX)
        spawnRoomUnit(200 + i, 2, rX)
    end

    -- 6. RECEPCIÓN / OFICINA DEL GERENTE ("MOTEL OFFICE")
    local offX = -motelW / 2 + 4.5
    local offZ = motelD / 2 + 0.2
    local offSign = makePart("Office_Neon_Sign", Vector3.new(6.5, 1.6, 0.4), CFrame.new(offX, 1.4 + floorH - 1.2, offZ + 0.4), Color3.fromRGB(40, 240, 255), Enum.Material.Neon, false, true)
    local offLight = Instance.new("PointLight", offSign)
    offLight.Color = Color3.fromRGB(40, 230, 255)
    offLight.Range = 14
    offLight.Brightness = 1.4

    ${
      includeIceVending
        ? `
    -- 7. MÁQUINA DE HIELO AUTOMÁTICA ("ICE") Y REFRESCOS BAJO LAS ESCALERAS
    local iceX = stairX - 5.0
    local iceZ = walkZ - 0.5
    local iceMachine = makePart("Ice_Vending_Machine", Vector3.new(4.2, 5.0, 3.2), CFrame.new(iceX, 1.4 + 2.5, iceZ), Color3.fromRGB(235, 240, 245), Enum.Material.Metal, true)
    local iceSign = makePart("Ice_Sign_Glow", Vector3.new(3.4, 1.0, 0.1), CFrame.new(iceX, 1.4 + 4.2, iceZ + 1.65), Color3.fromRGB(0, 180, 255), Enum.Material.Neon, false, true)
    local sodaMachine = makePart("Soda_Vending_Machine", Vector3.new(3.2, 5.4, 3.0), CFrame.new(iceX + 4.2, 1.4 + 2.7, iceZ), Color3.fromRGB(215, 35, 35), Enum.Material.Metal, true)
    `
        : ""
    }

    ${
      includeNeonSign
        ? `
    -- 8. GRAN TÓTEM DE CARRETERA RETRO CON NEÓN ("MOTEL - NO VACANCY")
    local signX = motelW / 2 + 10
    local signZ = parkZ + 4
    local pylonH = 32

    -- Mástil doble de acero
    makePart("Pylon_Leg_1", Vector3.new(1.0, pylonH, 1.0), CFrame.new(signX - 2.5, 1.2 + pylonH / 2, signZ), Color3.fromRGB(50, 54, 60), Enum.Material.Metal, true)
    makePart("Pylon_Leg_2", Vector3.new(1.0, pylonH, 1.0), CFrame.new(signX + 2.5, 1.2 + pylonH / 2, signZ), Color3.fromRGB(50, 54, 60), Enum.Material.Metal, true)

    -- Gran cabezal retro del cartel con forma de flecha/diamante
    local signHeadCF = CFrame.new(signX, 1.2 + pylonH - 2, signZ)
    local signBoard = makePart("Motel_Pylon_Backing", Vector3.new(14, 10, 1.8), signHeadCF, Color3.fromRGB(195, 45, 40), Enum.Material.SmoothPlastic, true)

    -- Letras iluminadas gigantes "MOTEL" en Neón Amarillo
    local neonLetters = makePart("Neon_Motel_Letters", Vector3.new(12, 4.2, 0.4), signHeadCF * CFrame.new(0, 1.5, 1.0), Color3.fromRGB(255, 230, 60), Enum.Material.Neon, false, true)
    local signLight = Instance.new("PointLight", neonLetters)
    signLight.Color = Color3.fromRGB(255, 225, 70)
    signLight.Range = 32
    signLight.Brightness = 2.2

    -- Letrero inferior "NO VACANCY" en Neón Rojo
    local vacancySign = makePart("Neon_Vacancy_Sign", Vector3.new(9.5, 1.8, 0.4), signHeadCF * CFrame.new(0, -3.0, 1.0), Color3.fromRGB(255, 30, 30), Enum.Material.Neon, false, true)
    local vacLight = Instance.new("PointLight", vacancySign)
    vacLight.Color = Color3.fromRGB(255, 30, 30)
    vacLight.Range = 16
    vacLight.Brightness = 1.4
    `
        : ""
    }

    print(string.format("[MotelEngine] ✅ Motel de carretera '%s' (%d habitaciones, %dx%d studs) generado en '%s'.", "${name}", numRooms * 2, motelW, totalLotD, "${parent}"))
end

buildMotel()
`;
}
