import { snapVal } from "./grid.js";

/**
 * Generador de Estacionamientos Comerciales y Públicos Profesionales Estilo GTA San Andreas.
 * Construye:
 * - Explanada de asfalto con bordillos de hormigón perimetrales
 * - Plazas delimitadas con líneas blancas/amarillas y plazas accesibles (azul)
 * - Topes de rueda de hormigón (wheel stops) en cada plaza
 * - Isletas ajardinadas intermedias con bordillos, tierra y árboles de sombra
 * - Farolas de aparcamiento de gran altura con focos múltiples
 * - Cajero automático de pago de estacionamiento con marquesina
 * - Barrera de acceso elevable en la entrada
 */

export function generateParkingLotLuau({
  name = "Commercial_Parking_Lot",
  center = [0, 0, 0],
  size = [90, 80], // [widthX, depthZ]
  rows = 2,
  includeLandscaping = true,
  includeLightPoles = true,
  includePayStation = true,
  includeBarrierGate = true,
  parent = "City/Parking",
}) {
  const [posX, posY, posZ] = [snapVal(center[0], 4), snapVal(center[1], 4), snapVal(center[2], 4)];
  const [lotW, lotD] = [Math.max(40, snapVal(size[0], 4)), Math.max(40, snapVal(size[1] || size[2] || 80, 4))];

  return `
local CollectionService = game:GetService("CollectionService")

local function buildParkingLot()
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
    local w = ${lotW}
    local d = ${lotD}

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
        p.Material = mat or Enum.Material.Concrete
        return p
    end

    -- 1. EXPLANADA DE ASFALTO Y BORDILLOS PERIMETRALES
    local curbH = 0.6
    makePart("Parking_Asphalt_Deck", Vector3.new(w, 1.2, d), CFrame.new(cx, cy + 0.6, cz), Color3.fromRGB(40, 42, 46), Enum.Material.Concrete, true)

    -- Bordillos perimetrales con hueco de acceso en la entrada frontal (+Z)
    local curbCol = Color3.fromRGB(160, 165, 172)
    local entranceW = 16
    makePart("Curb_North", Vector3.new(w, curbH + 0.1, 0.8), CFrame.new(cx, cy + 1.2 + curbH / 2, cz - d / 2 + 0.4), curbCol, Enum.Material.Concrete, true)
    makePart("Curb_West", Vector3.new(0.8, curbH + 0.1, d), CFrame.new(cx - w / 2 + 0.4, cy + 1.2 + curbH / 2, cz), curbCol, Enum.Material.Concrete, true)
    makePart("Curb_East", Vector3.new(0.8, curbH + 0.1, d), CFrame.new(cx + w / 2 - 0.4, cy + 1.2 + curbH / 2, cz), curbCol, Enum.Material.Concrete, true)
    -- Bordillos frontales dejando el hueco de entrada libre
    local frontCurbW = (w - entranceW) / 2
    makePart("Curb_South_L", Vector3.new(frontCurbW, curbH + 0.1, 0.8), CFrame.new(cx - entranceW / 2 - frontCurbW / 2, cy + 1.2 + curbH / 2, cz + d / 2 - 0.4), curbCol, Enum.Material.Concrete, true)
    makePart("Curb_South_R", Vector3.new(frontCurbW, curbH + 0.1, 0.8), CFrame.new(cx + entranceW / 2 + frontCurbW / 2, cy + 1.2 + curbH / 2, cz + d / 2 - 0.4), curbCol, Enum.Material.Concrete, true)

    -- 2. PLAZAS DE APARCAMIENTO Y TOPES DE RUEDA
    local stallW = 9.0
    local stallL = 16.0
    local aisleW = 20.0 -- Carril central de maniobra
    local numStallsPerRow = math.floor((w - 12) / stallW)

    local rowZ1 = cz - d / 4
    local rowZ2 = cz + d / 4 - 4

    local function spawnStall(xPos, zPos, isHandicap)
        local lineCol = isHandicap and Color3.fromRGB(0, 130, 255) or Color3.fromRGB(245, 245, 250)
        -- Líneas delimitadoras izquierda y derecha
        makePart("Stall_Line_L", Vector3.new(0.4, 0.05, stallL), CFrame.new(xPos - stallW / 2, cy + 1.22, zPos), lineCol, Enum.Material.SmoothPlastic, false, true)
        makePart("Stall_Line_R", Vector3.new(0.4, 0.05, stallL), CFrame.new(xPos + stallW / 2, cy + 1.22, zPos), lineCol, Enum.Material.SmoothPlastic, false, true)
        -- Tope de rueda de hormigón (Wheel stop)
        local wheelStopCol = isHandicap and Color3.fromRGB(235, 195, 40) or Color3.fromRGB(150, 155, 160)
        makePart("Wheel_Stop", Vector3.new(6.0, 0.5, 0.8), CFrame.new(xPos, cy + 1.2 + 0.25, zPos - stallL / 2 + 1.8), wheelStopCol, Enum.Material.Concrete, true)
    end

    for i = 1, numStallsPerRow do
        local stallX = cx - (numStallsPerRow * stallW) / 2 + (i - 0.5) * stallW
        local isHandicap = (i == 1)
        spawnStall(stallX, rowZ1, isHandicap)
        spawnStall(stallX, rowZ2, false)
    end

    ${
      includeLandscaping
        ? `
    -- 3. ISLETAS AJARDINADAS CON ÁRBOLES DE SOMBRA
    local islandX = cx
    local islandZ = cz
    local isW = 6.0
    local isL = 18.0
    -- Bordillo de la isleta
    makePart("Island_Curb", Vector3.new(isW, curbH + 0.1, isL), CFrame.new(islandX, cy + 1.2 + curbH / 2, islandZ), curbCol, Enum.Material.Concrete, true)
    makePart("Island_Mulch", Vector3.new(isW - 0.8, 0.2, isL - 0.8), CFrame.new(islandX, cy + 1.2 + curbH + 0.1, islandZ), Color3.fromRGB(68, 52, 40), Enum.Material.Ground, false)

    -- Árbol de sombra en la isleta
    makePart("Parking_Tree_Trunk", Vector3.new(1.2, 9, 1.2), CFrame.new(islandX, cy + 1.2 + 4.5, islandZ), Color3.fromRGB(85, 55, 35), Enum.Material.WoodPlanks, true)
    makePart("Parking_Tree_Crown", Vector3.new(8, 6.5, 8), CFrame.new(islandX, cy + 1.2 + 10.5, islandZ), Color3.fromRGB(55, 125, 50), Enum.Material.Grass, false)
    `
        : ""
    }

    ${
      includeLightPoles
        ? `
    -- 4. FAROLAS DE APARCAMIENTO DE GRAN ALTURA (High-Mast LED Lights)
    local poleH = 22
    local polePositions = {
        {cx - w / 3, cz - d / 3},
        {cx + w / 3, cz - d / 3},
        {cx - w / 3, cz + d / 3},
        {cx + w / 3, cz + d / 3},
    }
    for li, lp in ipairs(polePositions) do
        local poleX, poleZ = lp[1], lp[2]
        -- Poste metálico
        makePart("Park_Light_Pole_" .. li, Vector3.new(0.9, poleH, 0.9), CFrame.new(poleX, cy + 1.2 + poleH / 2, poleZ), Color3.fromRGB(45, 48, 55), Enum.Material.Metal, true)
        -- Travesaño doble superior
        makePart("Light_Crossarm_" .. li, Vector3.new(4.5, 0.4, 0.4), CFrame.new(poleX, cy + 1.2 + poleH - 0.4, poleZ), Color3.fromRGB(45, 48, 55), Enum.Material.Metal, false, true)
        -- 2 Focos LED
        local f1 = makePart("Light_Head_1_" .. li, Vector3.new(1.8, 0.4, 1.2), CFrame.new(poleX - 1.8, cy + 1.2 + poleH - 0.8, poleZ), Color3.fromRGB(255, 245, 215), Enum.Material.Neon, false, true)
        local f2 = makePart("Light_Head_2_" .. li, Vector3.new(1.8, 0.4, 1.2), CFrame.new(poleX + 1.8, cy + 1.2 + poleH - 0.8, poleZ), Color3.fromRGB(255, 245, 215), Enum.Material.Neon, false, true)
        local pl1 = Instance.new("PointLight", f1)
        pl1.Color = Color3.fromRGB(255, 235, 190)
        pl1.Range = 32
        pl1.Brightness = 1.6
        pl1.Shadows = true
    end
    `
        : ""
    }

    ${
      includePayStation
        ? `
    -- 5. CAJERO DE PAGO DE ESTACIONAMIENTO CON MARQUESINA
    local payX = cx - entranceW / 2 - 3
    local payZ = cz + d / 2 - 4
    -- Caseta / Marquesina del cajero
    makePart("Pay_Canopy", Vector3.new(5.0, 0.4, 4.0), CFrame.new(payX, cy + 1.2 + 8.5, payZ), Color3.fromRGB(40, 44, 52), Enum.Material.Metal, true)
    makePart("Pay_Canopy_Leg", Vector3.new(0.4, 8.5, 0.4), CFrame.new(payX + 2.0, cy + 1.2 + 4.25, payZ - 1.6), Color3.fromRGB(40, 44, 52), Enum.Material.Metal, true)
    -- Máquina automática de tickets con pantalla iluminada
    makePart("Ticket_Machine", Vector3.new(2.0, 5.2, 1.6), CFrame.new(payX, cy + 1.2 + 2.6, payZ), Color3.fromRGB(30, 70, 130), Enum.Material.Metal, true)
    local screen = makePart("Ticket_Screen", Vector3.new(1.2, 0.8, 0.1), CFrame.new(payX, cy + 1.2 + 3.8, payZ + 0.85), Color3.fromRGB(0, 240, 255), Enum.Material.Neon, false, true)
    `
        : ""
    }

    ${
      includeBarrierGate
        ? `
    -- 6. BARRERA ELEVABLE DE CONTROL DE ACCESO (Boom Barrier)
    local gateX = cx + entranceW / 4
    local gateZ = cz + d / 2 - 2
    -- Poste base de la barrera (amarillo/negro)
    makePart("Gate_Pedestal", Vector3.new(1.4, 3.4, 1.4), CFrame.new(gateX, cy + 1.2 + 1.7, gateZ), Color3.fromRGB(235, 185, 35), Enum.Material.Metal, true)
    -- Brazo de la barrera (rojo y blanco a rayas)
    makePart("Boom_Arm", Vector3.new(entranceW * 0.55, 0.3, 0.3), CFrame.new(gateX - (entranceW * 0.28), cy + 1.2 + 2.8, gateZ), Color3.fromRGB(225, 40, 40), Enum.Material.Plastic, true)
    `
        : ""
    }

    print(string.format("[ParkingEngine GTA-AAA] ✅ Estacionamiento '%s' (%dx%d studs) generado en '%s'.", "${name}", w, d, "${parent}"))
end

buildParkingLot()
`;
}
