import { snapVal } from "./grid.js";

/**
 * Generador de Complejo de Trasteros y Almacenes (Self-Storage Units - Estilo Schedule 1 / Northtown Lockers).
 * Elemento clave en Schedule 1 para alquilar almacenes, montar laboratorios clandestinos y guardar mercancía.
 * Incluye:
 * - Filas paralelas de trasteros con persianas metálicas enrollables (colores naranja/azul/rojo) y numeración
 * - Vías de maniobra y carga para furgonetas y coches de hormigón
 * - Unidad secreta accesible con interior jugable (mesa de laboratorio/pesaje, bidones químicos y caja fuerte)
 * - Caseta de seguridad y control con barrera automática y teclado de código PIN
 * - Valla perimetral de seguridad con postes metálicos y reflectores
 */

export function generateStorageFacilityLuau({
  name = "SafeVault_Storage",
  position = [0, 0, 0],
  rows = 2,
  unitsPerRow = 6,
  rotationY = 0,
  includeOffice = true,
  includeFence = true,
  doorColorStyle = "orange", // "orange", "blue", "red", "mixed"
  hasSecretLabUnit = true,
  parent = "City/Industrial",
}) {
  const [posX, posY, posZ] = [snapVal(position[0], 4), snapVal(position[1], 4), snapVal(position[2], 4)];
  const numRows = Math.max(1, Math.min(5, Math.floor(rows)));
  const numUnits = Math.max(4, Math.min(12, Math.floor(unitsPerRow)));
  const rotY = typeof rotationY === "number" ? rotationY : 0;

  const unitW = 12.0; // Ancho de cada persiana
  const unitD = 14.0; // Profundidad de cada trastero
  const unitH = 10.0;
  const aisleW = 18.0; // Anchura del pasillo de conducción para vehículos

  const buildingW = numUnits * unitW;
  const totalFacilityW = buildingW + (includeOffice ? 24 : 12);
  const totalFacilityD = numRows * unitD + (numRows + 1) * aisleW;

  return `
local CollectionService = game:GetService("CollectionService")

local function buildStorageFacility()
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
    local numRows = ${numRows}
    local numUnits = ${numUnits}
    local unitW = ${unitW}
    local unitD = ${unitD}
    local unitH = ${unitH}
    local aisleW = ${aisleW}
    local bW = ${buildingW}
    local totalW = ${totalFacilityW}
    local totalD = ${totalFacilityD}
    local doorStyle = "${doorColorStyle}"

    local colDoorOrange = Color3.fromRGB(225, 95, 25)
    local colDoorBlue = Color3.fromRGB(35, 85, 165)
    local colDoorRed = Color3.fromRGB(195, 40, 35)

    local function getDoorColor(unitIdx)
        if doorStyle == "blue" then return colDoorBlue
        elseif doorStyle == "red" then return colDoorRed
        elseif doorStyle == "mixed" then
            local palette = {colDoorOrange, colDoorBlue, colDoorRed}
            return palette[(unitIdx % 3) + 1]
        else return colDoorOrange end
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
        w.CFrame = originCF * relCF
        w.Color = col
        w.Material = mat or Enum.Material.Metal
        return w
    end

    -- 1. EXPLANADA DE HORMIGÓN DEL COMPLEJO
    makePart("Facility_Slab", Vector3.new(totalW, 1.2, totalD), CFrame.new(0, 0.6, 0), Color3.fromRGB(150, 154, 160), Enum.Material.Concrete, true)

    -- 2. FILAS DE EDIFICIOS DE TRASTEROS
    local startRowZ = -totalD / 2 + aisleW + unitD / 2

    for r = 1, numRows do
        local rowZ = startRowZ + (r - 1) * (unitD + aisleW)
        local bCF = CFrame.new(-totalW / 2 + bW / 2 + 6, 1.2 + unitH / 2, rowZ)

        -- Estructura del bloque de trasteros (ahuecado si contiene el laboratorio secreto)
        if r == 1 and ${hasSecretLabUnit ? "true" : "false"} then
            local leftW = 2 * unitW
            local rightW = (numUnits - 3) * unitW
            local secretX = -totalW / 2 + 6 + 2.5 * unitW
            if leftW > 0 then
                makePart("Building_Row_1_Left", Vector3.new(leftW, unitH, unitD), CFrame.new(-totalW / 2 + 6 + leftW / 2, 1.2 + unitH / 2, rowZ), Color3.fromRGB(220, 218, 212), Enum.Material.Concrete, true)
            end
            if rightW > 0 then
                makePart("Building_Row_1_Right", Vector3.new(rightW, unitH, unitD), CFrame.new(-totalW / 2 + 6 + 3 * unitW + rightW / 2, 1.2 + unitH / 2, rowZ), Color3.fromRGB(220, 218, 212), Enum.Material.Concrete, true)
            end
            -- Pared trasera del trastero secreto
            makePart("Secret_Back_Wall", Vector3.new(unitW, unitH, 1.0), CFrame.new(secretX, 1.2 + unitH / 2, rowZ - unitD / 2 + 0.5), Color3.fromRGB(220, 218, 212), Enum.Material.Concrete, true)
            -- Techo del trastero secreto
            makePart("Secret_Ceiling", Vector3.new(unitW, 0.8, unitD), CFrame.new(secretX, 1.2 + unitH - 0.4, rowZ), Color3.fromRGB(220, 218, 212), Enum.Material.Concrete, true)
        else
            makePart("Building_Row_" .. r, Vector3.new(bW, unitH, unitD), bCF, Color3.fromRGB(220, 218, 212), Enum.Material.Concrete, true)
        end

        -- Tejadillo metálico a un agua
        local roofH = 2.4
        local roofCF = CFrame.new(-totalW / 2 + bW / 2 + 6, 1.2 + unitH + roofH / 2, rowZ)
        makeWedge("Roof_Slope_" .. r, Vector3.new(bW + 1.2, roofH, unitD + 1.2), roofCF, Color3.fromRGB(70, 75, 82), Enum.Material.Metal)

        -- Persianas individuales de cada trastero
        local faceZ = rowZ + unitD / 2 + 0.14
        for u = 1, numUnits do
            local uX = -totalW / 2 + 6 + (u - 0.5) * unitW
            local doorW, doorH = unitW - 1.6, unitH - 1.4
            local dCol = getDoorColor(u)
            local unitCode = string.char(64 + r) .. "-" .. string.format("%02d", u)

            local isSecretUnit = ${hasSecretLabUnit ? "true" : "false"} and (r == 1 and u == 3)

            if not isSecretUnit then
                -- Persiana cerrada con ranuras (grosor 0.2, despejado del muro)
                local doorCF = CFrame.new(uX, 1.2 + doorH / 2 + 0.2, faceZ)
                makePart("RollDoor_" .. unitCode, Vector3.new(doorW, doorH, 0.2), doorCF, dCol, Enum.Material.DiamondPlate, true)
                -- Cerrojo / Candado metálico inferior
                makePart("Padlock_" .. unitCode, Vector3.new(0.6, 0.8, 0.3), doorCF * CFrame.new(0, -doorH / 2 + 1.0, 0.15), Color3.fromRGB(215, 185, 45), Enum.Material.Metal, false, true)
            else
                -- 3. UNIDAD SECRETA ACCESIBLE (LABORATORIO / ZONA FRANCA CLANDESTINA)
                -- Puerta enrollable abierta a media altura (3 studs abierta)
                local openH = doorH - 4.5
                local doorOpenCF = CFrame.new(uX, 1.2 + openH / 2 + 4.5, faceZ)
                makePart("Secret_RollDoor", Vector3.new(doorW, openH, 0.2), doorOpenCF, dCol, Enum.Material.DiamondPlate, true)

                -- Interior del trastero: hueco transitable despejado
                -- Mesa de trabajo / pesaje
                makePart("Lab_Workbench", Vector3.new(6.5, 3.2, 3.0), CFrame.new(uX, 1.2 + 1.6, rowZ - 2), Color3.fromRGB(115, 80, 50), Enum.Material.WoodPlanks, true)
                -- Báscula digital y maletín de billetes
                makePart("Digital_Scale", Vector3.new(1.2, 0.3, 1.2), CFrame.new(uX - 1.8, 1.2 + 3.35, rowZ - 2), Color3.fromRGB(40, 44, 50), Enum.Material.SmoothPlastic, false, true)
                makePart("Cash_Briefcase", Vector3.new(2.4, 0.6, 1.8), CFrame.new(uX + 1.5, 1.2 + 3.5, rowZ - 2), Color3.fromRGB(30, 32, 35), Enum.Material.Metal, true)

                -- Bidón químico de plástico azul
                local chemDrum = makePart("Chemical_Barrel", Vector3.new(2.6, 3.6, 2.6), CFrame.new(uX + 3.2, 1.2 + 1.8, rowZ + 2), Color3.fromRGB(25, 95, 180), Enum.Material.SmoothPlastic, true)
                chemDrum.Shape = Enum.PartType.Cylinder
                chemDrum.CFrame = CFrame.new(uX + 3.2, 1.2 + 1.8, rowZ + 2) * CFrame.Angles(0, 0, math.rad(90))

                -- Luz fluorescente de techo en el trastero secreto
                local stripLight = makePart("Secret_Fluorescent", Vector3.new(5.0, 0.3, 0.8), CFrame.new(uX, 1.2 + unitH - 0.5, rowZ), Color3.fromRGB(240, 255, 240), Enum.Material.Neon, false, true)
                local sLight = Instance.new("PointLight", stripLight)
                sLight.Color = Color3.fromRGB(235, 255, 235)
                sLight.Range = 16
                sLight.Brightness = 1.4
            end

            -- Cartelito con el número de trastero sobre la persiana
            makePart("Sign_Num_" .. unitCode, Vector3.new(2.2, 0.8, 0.1), CFrame.new(uX, 1.2 + unitH - 0.6, faceZ + 0.12), Color3.fromRGB(35, 38, 44), Enum.Material.SmoothPlastic, false, true)

            -- Foco exterior nocturno entre persianas
            if u % 2 == 1 then
                local lampP = makePart("Unit_Lamp_" .. unitCode, Vector3.new(0.6, 0.6, 0.5), CFrame.new(uX, 1.2 + unitH - 0.2, faceZ + 0.35), Color3.fromRGB(255, 235, 180), Enum.Material.Neon, false, true)
                local uLight = Instance.new("PointLight", lampP)
                uLight.Color = Color3.fromRGB(255, 225, 160)
                uLight.Range = 14
                uLight.Brightness = 0.9
            end
        end
    end

    ${
      includeOffice
        ? `
    -- 4. CASETA DE SEGURIDAD Y ACCESO CON CONTROL DE BARRERA
    local offW, offD, offH = 16, 14, 9.5
    local offX = totalW / 2 - offW / 2 - 4
    local offZ = totalD / 2 - offD / 2 - 4
    makePart("Office_Cabin", Vector3.new(offW, offH, offD), CFrame.new(offX, 1.2 + offH / 2, offZ), Color3.fromRGB(230, 232, 238), Enum.Material.Concrete, true)

    -- Ventanal de control con respaldo opaco y cristal desfasado
    local offFrontZ = offZ - offD / 2
    makePart("Office_Window_Backing", Vector3.new(offW - 2, 4.5, 0.04), CFrame.new(offX, 1.2 + 5.5, offFrontZ - 0.03), Color3.fromRGB(22, 25, 30), Enum.Material.SmoothPlastic, false, true)
    local offGlass = makePart("Office_Window", Vector3.new(offW - 2, 4.5, 0.06), CFrame.new(offX, 1.2 + 5.5, offFrontZ - 0.10), Color3.fromRGB(170, 210, 240), Enum.Material.Glass, false, true)
    offGlass.Transparency = 0.35

    -- Teclado de código PIN para entrar en el complejo
    local keypadStand = makePart("Keypad_Pedestal", Vector3.new(0.6, 4.2, 0.6), CFrame.new(offX - offW / 2 - 4, 1.2 + 2.1, offZ), Color3.fromRGB(50, 54, 60), Enum.Material.Metal, true)
    makePart("Keypad_Screen", Vector3.new(0.8, 1.0, 0.8), CFrame.new(offX - offW / 2 - 4, 1.2 + 4.2, offZ), Color3.fromRGB(0, 255, 100), Enum.Material.Neon, false, true)

    -- Barrera levadiza automática con franjas rojas y blancas
    local barrierArm = makePart("Gate_Boom_Barrier", Vector3.new(12, 0.4, 0.4), CFrame.new(offX - offW / 2 - 6, 1.2 + 3.4, offZ - 4), Color3.fromRGB(225, 45, 40), Enum.Material.SmoothPlastic, true)
    `
        : ""
    }

    ${
      includeFence
        ? `
    -- 5. VALLA PERIMETRAL DE SEGURIDAD (Chain-link Fence)
    local fenceH = 7.0
    local colFence = Color3.fromRGB(140, 145, 150)
    local fY = 1.2 + fenceH / 2

    makePart("Fence_North", Vector3.new(totalW, fenceH, 0.3), CFrame.new(0, fY, -totalD / 2 + 0.2), colFence, Enum.Material.DiamondPlate, true)
    makePart("Fence_West", Vector3.new(0.3, fenceH, totalD), CFrame.new(-totalW / 2 + 0.2, fY, 0), colFence, Enum.Material.DiamondPlate, true)
    makePart("Fence_East", Vector3.new(0.3, fenceH, totalD), CFrame.new(totalW / 2 - 0.2, fY, 0), colFence, Enum.Material.DiamondPlate, true)
    -- Valla frontal con hueco de acceso
    local gateOpening = 22
    local frontSegW = (totalW - gateOpening) / 2
    makePart("Fence_Front_L", Vector3.new(frontSegW, fenceH, 0.3), CFrame.new(-totalW / 2 + frontSegW / 2, fY, totalD / 2 - 0.2), colFence, Enum.Material.DiamondPlate, true)
    makePart("Fence_Front_R", Vector3.new(frontSegW, fenceH, 0.3), CFrame.new(totalW / 2 - frontSegW / 2, fY, totalD / 2 - 0.2), colFence, Enum.Material.DiamondPlate, true)
    `
        : ""
    }

    print(string.format("[StorageEngine] ✅ Complejo de trasteros '%s' (%d filas, %d unidades) generado en '%s'.", "${name}", numRows, numRows * numUnits, "${parent}"))
end

buildStorageFacility()
`;
}
