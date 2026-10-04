import { snapVal } from "./grid.js";

/**
 * Generador de Interiores Jugables y Habitables para Edificios Roblox.
 * Genera cajas de escaleras continuas que conectan pisos sin saltar,
 * tabiques divisorios de pasillos y habitaciones, puertas interactivas
 * con ProximityPrompt y TweenService, e iluminación y mobiliario temático.
 */
export function generatePlayableInteriorLuau({
  name = "Playable_Interior",
  center = [0, 0, 0],
  size = [40, 10, 40], // [widthX, floorHeight, depthZ]
  floors = 3,
  theme = "office",    // "office", "residential", "store", "bank"
  hasStairs = true,
  interactiveDoors = true,
  parent = "City/Interiors",
}) {
  const [cx, cy, cz] = [snapVal(center[0], 4), snapVal(center[1], 4), snapVal(center[2], 4)];
  const [w, flH, d] = [Math.max(20, snapVal(size[0], 4)), Math.max(9, size[1] || 10), Math.max(20, snapVal(size[2] || 40, 4))];
  const numFloors = Math.max(1, Math.min(20, Math.floor(floors)));

  return `
local CollectionService = game:GetService("CollectionService")

local function buildPlayableInterior()
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

    local cx = ${cx}
    local cy = ${cy}
    local cz = ${cz}
    local w = ${w}
    local flH = ${flH}
    local d = ${d}
    local numFloors = ${numFloors}
    local theme = "${theme.toLowerCase()}"

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
        p.Material = mat or Enum.Material.SmoothPlastic
        return p
    end

    local function makeInteractiveDoor(cf, nameSuffix)
        -- Marco de la puerta
        local frameCol = Color3.fromRGB(60, 65, 72)
        makePart("DoorFrame_L_" .. nameSuffix, Vector3.new(0.4, 7.5, 0.4), cf * CFrame.new(-2.1, 0, 0), frameCol, Enum.Material.Metal, true)
        makePart("DoorFrame_R_" .. nameSuffix, Vector3.new(0.4, 7.5, 0.4), cf * CFrame.new(2.1, 0, 0), frameCol, Enum.Material.Metal, true)
        makePart("DoorFrame_T_" .. nameSuffix, Vector3.new(4.6, 0.4, 0.4), cf * CFrame.new(0, 3.8, 0), frameCol, Enum.Material.Metal, true)

        -- Hoja de la puerta (giratoria)
        local door = makePart("DoorLeaf_" .. nameSuffix, Vector3.new(3.8, 7.2, 0.3), cf * CFrame.new(0, 0, 0), Color3.fromRGB(110, 75, 50), Enum.Material.WoodPlanks, true)
        door.CanTouch = false

        ${
          interactiveDoors
            ? `
        -- Configurar ProximityPrompt para interactividad
        local prompt = Instance.new("ProximityPrompt", door)
        prompt.ActionText = "Abrir / Cerrar"
        prompt.ObjectText = "Puerta"
        prompt.KeyboardKeyCode = Enum.KeyCode.E
        prompt.HoldDuration = 0
        prompt.MaxActivationDistance = 8
        CollectionService:AddTag(door, "InteractiveDoor")
        door:SetAttribute("IsOpen", false)
        door:SetAttribute("OriginCFrame", cf)
        `
            : ""
        }
    end

    -- 1. BUCLE DE PLANTAS INTERIORES
    for fl = 1, numFloors do
        local flBaseY = cy + (fl - 1) * flH
        local flMidY = flBaseY + flH / 2

        -- Losa de suelo del piso
        local floorCol = Color3.fromRGB(160, 160, 165)
        local floorMat = Enum.Material.SmoothPlastic
        if theme == "residential" then
            floorCol = Color3.fromRGB(115, 80, 50)
            floorMat = Enum.Material.WoodPlanks
        elseif theme == "bank" or theme == "store" then
            floorCol = Color3.fromRGB(215, 215, 220)
            floorMat = Enum.Material.Concrete
        end

        ${
          hasStairs
            ? `
        -- Dejar hueco para la caja de escalera en el forjado
        local stairW = 8
        local stairD = 14
        local sX = cx - w / 2 + stairW / 2 + 2
        local sZ = cz - d / 2 + stairD / 2 + 2

        -- Suelo en secciones dejando libre el hueco de la escalera
        makePart("Floor_Slab_A_" .. fl, Vector3.new(w - stairW - 3, 0.8, d), CFrame.new(cx + (stairW + 3) / 2, flBaseY + 0.4, cz), floorCol, floorMat, true)
        makePart("Floor_Slab_B_" .. fl, Vector3.new(stairW + 3, 0.8, d - stairD - 3), CFrame.new(sX, flBaseY + 0.4, cz + (stairD + 3) / 2), floorCol, floorMat, true)
        `
            : `
        makePart("Floor_Slab_" .. fl, Vector3.new(w, 0.8, d), CFrame.new(cx, flBaseY + 0.4, cz), floorCol, floorMat, true)
        `
        }

        -- 2. TABIQUES DIVISORIOS (Pasillo central y 2 a 4 salas)
        local wallThick = 0.8
        local wallCol = Color3.fromRGB(220, 220, 225)
        local wallMat = Enum.Material.SmoothPlastic

        -- Pasillo central longitudinal (ancho: 8 studs)
        local corridorW = 8
        local leftWallX = cx - corridorW / 2
        local rightWallX = cx + corridorW / 2

        -- Tabique longitudinal izquierdo (con vano de puerta)
        local wallSecLen = (d - 10) / 2
        makePart("Wall_Corr_L1_" .. fl, Vector3.new(wallThick, flH - 0.8, wallSecLen), CFrame.new(leftWallX, flMidY, cz - d / 4), wallCol, wallMat, true)
        makePart("Wall_Corr_L2_" .. fl, Vector3.new(wallThick, flH - 0.8, wallSecLen), CFrame.new(leftWallX, flMidY, cz + d / 4), wallCol, wallMat, true)
        makeInteractiveDoor(CFrame.new(leftWallX, flBaseY + 3.8, cz), fl .. "_L")

        -- Tabique longitudinal derecho (con vano de puerta)
        makePart("Wall_Corr_R1_" .. fl, Vector3.new(wallThick, flH - 0.8, wallSecLen), CFrame.new(rightWallX, flMidY, cz - d / 4), wallCol, wallMat, true)
        makePart("Wall_Corr_R2_" .. fl, Vector3.new(wallThick, flH - 0.8, wallSecLen), CFrame.new(rightWallX, flMidY, cz + d / 4), wallCol, wallMat, true)
        makeInteractiveDoor(CFrame.new(rightWallX, flBaseY + 3.8, cz), fl .. "_R")

        -- Tabiques transversales que separan oficinas/habitaciones
        local sideRoomW = (w - corridorW) / 2
        makePart("Wall_Trans_L_" .. fl, Vector3.new(sideRoomW, flH - 0.8, wallThick), CFrame.new(cx - corridorW / 2 - sideRoomW / 2, flMidY, cz), wallCol, wallMat, true)
        makePart("Wall_Trans_R_" .. fl, Vector3.new(sideRoomW, flH - 0.8, wallThick), CFrame.new(cx + corridorW / 2 + sideRoomW / 2, flMidY, cz), wallCol, wallMat, true)

        -- 3. ILUMINACIÓN INTERIOR DE TECHO
        local function spawnCeilingLight(roomCF)
            local fixture = makePart("LightFixture", Vector3.new(3, 0.3, 3), roomCF * CFrame.new(0, flH - 1.2, 0), Color3.fromRGB(245, 245, 250), Enum.Material.Neon, false)
            local pL = Instance.new("PointLight", fixture)
            pL.Color = Color3.fromRGB(255, 240, 215)
            pL.Range = 20
            pL.Brightness = 1.0
            pL.Shadows = true
        end

        spawnCeilingLight(CFrame.new(cx, flBaseY, cz)) -- Pasillo
        spawnCeilingLight(CFrame.new(cx - w / 4, flBaseY, cz - d / 4)) -- Sala Noroeste
        spawnCeilingLight(CFrame.new(cx + w / 4, flBaseY, cz - d / 4)) -- Sala Noreste
        spawnCeilingLight(CFrame.new(cx - w / 4, flBaseY, cz + d / 4)) -- Sala Suroeste
        spawnCeilingLight(CFrame.new(cx + w / 4, flBaseY, cz + d / 4)) -- Sala Sureste

        -- 4. MOBILIARIO TEMÁTICO EN CADA SALA
        if theme == "office" then
            -- Escritorios con monitor y silla en las salas
            local function spawnDesk(roomCF)
                -- Escritorio
                makePart("Desk_Top", Vector3.new(6, 0.4, 3.2), roomCF * CFrame.new(0, 2.8, 0), Color3.fromRGB(75, 45, 30), Enum.Material.WoodPlanks, true)
                makePart("Desk_LegL", Vector3.new(0.4, 2.8, 3.2), roomCF * CFrame.new(-2.8, 1.4, 0), Color3.fromRGB(45, 48, 52), Enum.Material.Metal, true)
                makePart("Desk_LegR", Vector3.new(0.4, 2.8, 3.2), roomCF * CFrame.new(2.8, 1.4, 0), Color3.fromRGB(45, 48, 52), Enum.Material.Metal, true)
                -- Monitor de ordenador
                makePart("Monitor", Vector3.new(2.4, 1.6, 0.2), roomCF * CFrame.new(0, 3.8, 0.8), Color3.fromRGB(20, 22, 25), Enum.Material.SmoothPlastic, false)
                makePart("Keyboard", Vector3.new(1.8, 0.1, 0.7), roomCF * CFrame.new(0, 3.05, 0), Color3.fromRGB(30, 32, 35), Enum.Material.SmoothPlastic, false)
                -- Archivador metálico
                makePart("Filing_Cabinet", Vector3.new(2.4, 5.5, 2.4), roomCF * CFrame.new(5, 2.75, -2), Color3.fromRGB(110, 115, 120), Enum.Material.Metal, true)
            end
            spawnDesk(CFrame.new(cx + w / 4, flBaseY, cz - d / 4))
            spawnDesk(CFrame.new(cx + w / 4, flBaseY, cz + d / 4))

        elseif theme == "residential" then
            -- Dormitorio / Sala de estar
            local function spawnLivingRoom(roomCF)
                -- Sofá confortable
                makePart("Sofa_Seat", Vector3.new(7, 1.4, 3), roomCF * CFrame.new(0, 1.2, 0), Color3.fromRGB(50, 85, 135), Enum.Material.Fabric, true)
                makePart("Sofa_Back", Vector3.new(7, 2.4, 0.8), roomCF * CFrame.new(0, 2.2, -1.2), Color3.fromRGB(50, 85, 135), Enum.Material.Fabric, true)
                -- Mesa de centro
                makePart("Coffee_Table", Vector3.new(4, 1.2, 2.2), roomCF * CFrame.new(0, 0.6, 3.5), Color3.fromRGB(90, 60, 40), Enum.Material.WoodPlanks, true)
            end
            spawnLivingRoom(CFrame.new(cx - w / 4, flBaseY, cz + d / 4))

        elseif theme == "bank" then
            -- Mostrador de seguridad con cristal blindado y caja fuerte
            local function spawnBankCounter(roomCF)
                -- Mostrador de piedra
                makePart("Bank_Counter", Vector3.new(12, 3.2, 2.4), roomCF * CFrame.new(0, 1.6, 0), Color3.fromRGB(75, 78, 85), Enum.Material.Concrete, true)
                -- Cristal de seguridad
                local glass = makePart("Teller_Glass", Vector3.new(12, 4, 0.3), roomCF * CFrame.new(0, 5.2, 0), Color3.fromRGB(200, 220, 240), Enum.Material.Glass, true)
                glass.Transparency = 0.4
                -- Gran caja fuerte acorazada de acero
                makePart("Bank_Vault", Vector3.new(6, 7, 5), roomCF * CFrame.new(0, 3.5, -6), Color3.fromRGB(45, 48, 55), Enum.Material.DiamondPlate, true)
            end
            spawnBankCounter(CFrame.new(cx + w / 4, flBaseY, cz + d / 4))
        end

        ${
          hasStairs
            ? `
        -- 5. ESCALERA CONTINUA TRANSITABLE (Conecta piso fl con fl + 1)
        if fl < numFloors then
            local stairW = 6
            local sX = cx - w / 2 + stairW / 2 + 3
            local sStartZ = cz - d / 2 + 3
            local sEndZ = cz - d / 2 + 15
            local sDeltaZ = sEndZ - sStartZ
            local numSteps = math.floor(flH / 0.8)
            local stepH = flH / numSteps

            for st = 1, numSteps do
                local alpha = st / numSteps
                local stepY = flBaseY + alpha * flH
                local stepZ = sStartZ + alpha * sDeltaZ
                makePart("StairStep_" .. fl .. "_" .. st, Vector3.new(stairW, stepH, math.abs(sDeltaZ / numSteps) + 0.2),
                    CFrame.new(sX, stepY - stepH / 2, stepZ), Color3.fromRGB(85, 90, 95), Enum.Material.Concrete, true)
            end

            -- Barandilla metálica de seguridad en el hueco de la escalera
            makePart("StairRailing_" .. fl, Vector3.new(0.3, 3, 14),
                CFrame.new(sX + stairW / 2 + 0.2, flBaseY + flH + 1.5, sStartZ + 7), Color3.fromRGB(45, 48, 55), Enum.Material.Metal, true)
        end
        `
            : ""
        }
    end

    print(string.format("[InteriorEngine] ✅ Interior jugable '%s' (%s, %d pisos) generado con éxito en '%s'.", "${name}", theme, numFloors, "${parent}"))
end

buildPlayableInterior()
`;
}
