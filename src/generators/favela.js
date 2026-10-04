import { snapVal } from "./grid.js";

/**
 * Generador Urbano Especializado en Favelas y Comunidades Orgánicas de Ladera.
 * Genera laderas aterrazadas con casas densamente apiladas, callejones peatonales
 * estrechos (vielas), escaleras empinadas transitables, pasarelas aéreas entre azoteas,
 * postes con maraña de cables eléctricos, tanques de agua azules (caixas d'água),
 * y tendales de ropa.
 */
export function generateFavelaDistrictLuau({
  name = "Favela_Hillside",
  center = [0, 50, -800], // [X, Y, Z]
  size = [180, 180],      // [widthX, depthZ]
  slopeDirection = "-Z",  // Dirección de subida de la montaña ("-Z", "+Z", "+X", "-X")
  elevationGain = 70,     // Desnivel que sube la favela en studs
  seed = 7771,
  density = "high",
  hasOverheadCables = true,
  hasFootbridges = true,
  parent = "City/Favela",
}) {
  const [cx, cy, cz] = [snapVal(center[0], 4), snapVal(center[1], 4), snapVal(center[2], 4)];
  const [w, d] = [Math.max(80, snapVal(size[0], 4)), Math.max(80, snapVal(size[1] || size[2] || 180, 4))];
  const elevGain = Math.max(20, snapVal(elevationGain, 4));
  const effectiveSeed = typeof seed === "number" ? seed : 7771;

  return `
local CollectionService = game:GetService("CollectionService")

local function buildFavela()
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
    local baseCy = ${cy}
    local cz = ${cz}
    local w = ${w}
    local d = ${d}
    local elevGain = ${elevGain}
    local seed = ${effectiveSeed}
    local isNegZ = "${slopeDirection}" == "-Z"

    local function makePart(pName, sz, cf, col, mat, canCol, isDecor)
        local p = Instance.new("Part", model)
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
        p.Material = mat or Enum.Material.Brick
        return p
    end

    local paletteBrick = {
        Color3.fromRGB(165, 75, 48),  -- Ladrillo rojizo
        Color3.fromRGB(145, 65, 40),  -- Ladrillo oscuro
        Color3.fromRGB(180, 85, 55),  -- Terracota vivo
        Color3.fromRGB(130, 60, 40),  -- Ladrillo quemado
    }
    local palettePlaster = {
        Color3.fromRGB(115, 140, 160), -- Azul cielo deslavado
        Color3.fromRGB(80, 130, 95),   -- Verde menta gastado
        Color3.fromRGB(180, 155, 115), -- Ocre arena
        Color3.fromRGB(145, 135, 125), -- Cemento crudo
        Color3.fromRGB(195, 110, 90),  -- Rosa terracota
    }

    local numTerraces = 5
    local terraceDepth = d / numTerraces
    local terraceStepY = elevGain / numTerraces

    local rooftopNodes = {} -- Para cables y pasarelas

    -- 1. CONSTRUCCIÓN DE TERRAZAS ESCALONADAS Y CALLEJONES
    for t = 1, numTerraces do
        local terraceZ = cz + (t - (numTerraces + 1) / 2) * terraceDepth
        if not isNegZ then
            terraceZ = cz - (t - (numTerraces + 1) / 2) * terraceDepth
        end
        local terraceY = baseCy + (t - 1) * terraceStepY

        -- Plataforma de suelo de la terraza (cemento/tierra)
        makePart("Terrace_Base_" .. t, Vector3.new(w + 4, 3, terraceDepth + 2),
            CFrame.new(cx, terraceY - 1.5, terraceZ), Color3.fromRGB(90, 85, 80), Enum.Material.Concrete, true)

        -- Callejón peatonal principal de la terraza (ancho: 6 studs)
        local alleyZ = terraceZ + terraceDepth * 0.35
        makePart("Alley_Walkway_" .. t, Vector3.new(w, 0.4, 6),
            CFrame.new(cx, terraceY + 0.2, alleyZ), Color3.fromRGB(110, 105, 100), Enum.Material.Cobblestone, true)

        -- 2. CASAS APILADAS Y VOLADIZOS A LO LARGO DE LA TERRAZA
        local numLots = math.floor(w / 18)
        local lotWidth = w / numLots

        for l = 1, numLots do
            local lotX = cx - w / 2 + (l - 0.5) * lotWidth
            local lotSeed = seed + t * 47 + l * 23
            local houseDepth = terraceDepth * 0.55
            local houseZ = terraceZ - terraceDepth * 0.15

            -- Altura de 2 a 3 plantas irregulares
            local houseFloors = 2 + (lotSeed % 2)
            local floorHeight = 9.5
            local currentHouseY = terraceY

            local houseCol = (lotSeed % 3 == 0)
                and paletteBrick[(lotSeed % #paletteBrick) + 1]
                or palettePlaster[(lotSeed % #palettePlaster) + 1]

            local houseMat = (lotSeed % 3 == 0) and Enum.Material.Brick or Enum.Material.Concrete

            for f = 1, houseFloors do
                local flY = currentHouseY + (f - 0.5) * floorHeight
                -- Voladizo: el segundo o tercer piso sobresale 1.5 studs hacia el callejón
                local overhang = (f > 1) and 1.5 or 0
                local flSize = Vector3.new(lotWidth - 1.5, floorHeight, houseDepth + overhang)
                local flCF = CFrame.new(lotX, flY, houseZ + overhang / 2)

                makePart("Favela_Room_" .. t .. "_" .. l .. "_" .. f, flSize, flCF, houseCol, houseMat, true)

                -- Puerta en planta baja hacia el callejón
                if f == 1 then
                    local doorCF = CFrame.new(lotX, currentHouseY + 4, houseZ + houseDepth / 2 + 0.1)
                    makePart("Door", Vector3.new(3.6, 7.5, 0.3), doorCF, Color3.fromRGB(60, 45, 35), Enum.Material.WoodPlanks, true)
                else
                    -- Ventana con reja o marco de madera
                    local winCF = CFrame.new(lotX, flY, houseZ + houseDepth / 2 + overhang + 0.1)
                    local win = makePart("Win", Vector3.new(3.2, 4, 0.2), winCF, Color3.fromRGB(200, 215, 230), Enum.Material.Glass, false, true)
                    win.Transparency = 0.4
                    -- Toldo improvisado de chapa ondulada sobre ventana
                    local awnCF = CFrame.new(lotX, flY + 2.6, houseZ + houseDepth / 2 + overhang + 1.2) * CFrame.Angles(math.rad(15), 0, 0)
                    makePart("Awning_Tin", Vector3.new(4.2, 0.3, 2.5), awnCF, Color3.fromRGB(140, 145, 150), Enum.Material.CorrugatedMetal, false, true)
                end
            end

            -- Azotea de la casa
            local roofY = currentHouseY + houseFloors * floorHeight
            local roofCF = CFrame.new(lotX, roofY, houseZ)
            table.insert(rooftopNodes, { x = lotX, y = roofY, z = houseZ })

            -- Techo de chapa con piedras de sujeción (típico favela)
            makePart("Roof_Tin", Vector3.new(lotWidth - 1, 0.4, houseDepth + 1),
                CFrame.new(lotX, roofY + 0.2, houseZ), Color3.fromRGB(150, 155, 160), Enum.Material.CorrugatedMetal, true)

            -- Caixa d'água azul cilíndrica de 1000L
            if (lotSeed % 10) < 8 then
                local tankPos = CFrame.new(lotX + (lotWidth / 4), roofY + 2.5, houseZ) * CFrame.Angles(0, 0, math.rad(90))
                local tank = makePart("WaterTank_Blue", Vector3.new(4, 4, 4), tankPos, Color3.fromRGB(25, 95, 195), Enum.Material.SmoothPlastic, true)
                tank.Shape = Enum.PartType.Cylinder
            end

            -- Pilares de varilla de acero que sobresalen del techo (esperando futura planta)
            makePart("Rebar_1", Vector3.new(0.3, 4, 0.3), CFrame.new(lotX - lotWidth / 2 + 1, roofY + 2, houseZ - houseDepth / 2 + 1), Color3.fromRGB(80, 50, 35), Enum.Material.Metal, false, true)
            makePart("Rebar_2", Vector3.new(0.3, 4, 0.3), CFrame.new(lotX + lotWidth / 2 - 1, roofY + 2, houseZ - houseDepth / 2 + 1), Color3.fromRGB(80, 50, 35), Enum.Material.Metal, false, true)
        end

        -- 3. ESCALERAS TRANSITABLES CONECTANDO TERRAZAS
        if t < numTerraces then
            local stairWidth = 5
            local stairCount = math.max(1, math.floor(w / 45))
            for s = 1, stairCount do
                local sX = cx - w / 2 + s * (w / (stairCount + 1))
                local sStartY = terraceY
                local sStartZ = alleyZ
                local nextTerraceZ = alleyZ + (isNegZ and -terraceDepth or terraceDepth)
                local sDeltaZ = nextTerraceZ - sStartZ
                local steps = math.floor(terraceStepY / 0.8)

                for step = 1, steps do
                    local alpha = step / steps
                    local stepY = sStartY + alpha * terraceStepY
                    local stepZ = sStartZ + alpha * sDeltaZ
                    makePart("Stair_Step_" .. t .. "_" .. s .. "_" .. step,
                        Vector3.new(stairWidth, 0.8, math.abs(sDeltaZ / steps) + 0.2),
                        CFrame.new(sX, stepY - 0.4, stepZ), Color3.fromRGB(110, 105, 100), Enum.Material.Concrete, true)
                end
            end
        end
    end

    ${
      hasFootbridges
        ? `
    -- 4. PASARELAS AÉREAS ENTRE AZOTEAS (Footbridges de madera y chapa)
    if #rooftopNodes >= 4 then
        for i = 1, #rooftopNodes - 2, 3 do
            local n1 = rooftopNodes[i]
            local n2 = rooftopNodes[i + 1]
            if n1 and n2 then
                local p1 = Vector3.new(n1.x, n1.y + 0.4, n1.z)
                local p2 = Vector3.new(n2.x, n2.y + 0.4, n2.z)
                local dist = (p2 - p1).Magnitude
                if dist > 6 and dist < 32 then
                    local bridgeCF = CFrame.lookAt((p1 + p2) / 2, p2)
                    makePart("Footbridge_Planks", Vector3.new(3.6, 0.4, dist), bridgeCF, Color3.fromRGB(115, 80, 55), Enum.Material.WoodPlanks, true)
                    -- Barandilla metálica de seguridad
                    makePart("Railing_L", Vector3.new(0.3, 3, dist), bridgeCF * CFrame.new(-1.7, 1.5, 0), Color3.fromRGB(60, 65, 70), Enum.Material.Metal, true)
                    makePart("Railing_R", Vector3.new(0.3, 3, dist), bridgeCF * CFrame.new(1.7, 1.5, 0), Color3.fromRGB(60, 65, 70), Enum.Material.Metal, true)
                end
            end
        end
    end
    `
        : ""
    }

    ${
      hasOverheadCables
        ? `
    -- 5. POSTES DE LUZ Y MARAÑA DE CABLES ELÉCTRICOS (Gatos de luz)
    local poleStep = 40
    local poleNodes = {}
    for px = cx - w / 2 + 10, cx + w / 2 - 10, poleStep do
        for pzIdx = 1, numTerraces, 2 do
            local pz = cz + (pzIdx - (numTerraces + 1) / 2) * terraceDepth
            local py = baseCy + (pzIdx - 1) * terraceStepY
            local poleCF = CFrame.new(px, py + 9, pz)
            -- Poste de madera
            makePart("Utility_Pole", Vector3.new(0.9, 18, 0.9), poleCF, Color3.fromRGB(75, 55, 40), Enum.Material.WoodPlanks, true)
            -- Travesaño con bombilla
            makePart("Crossbar", Vector3.new(3.5, 0.4, 0.4), poleCF * CFrame.new(0, 8.5, 0), Color3.fromRGB(50, 52, 55), Enum.Material.Metal, false)
            local bulb = makePart("Street_Bulb", Vector3.new(0.6, 0.6, 0.6), poleCF * CFrame.new(0, 7.8, 0), Color3.fromRGB(255, 230, 160), Enum.Material.Neon, false)
            local pL = Instance.new("PointLight", bulb)
            pL.Color = Color3.fromRGB(255, 220, 150)
            pL.Range = 22
            pL.Brightness = 1.2
            pL.Shadows = true

            table.insert(poleNodes, Vector3.new(px, py + 17.5, pz))
        end
    end

    -- Cables tensados entre postes
    for i = 1, #poleNodes - 1 do
        local p1 = poleNodes[i]
        local p2 = poleNodes[i + 1]
        local wireDist = (p2 - p1).Magnitude
        if wireDist < 60 then
            local wireCF = CFrame.lookAt((p1 + p2) / 2, p2)
            makePart("Power_Cable_" .. i, Vector3.new(0.12, 0.12, wireDist), wireCF, Color3.fromRGB(20, 22, 25), Enum.Material.SmoothPlastic, false, true)
        end
    end
    `
        : ""
    }

    print(string.format("[FavelaEngine] ✅ Favela de ladera '%s' generada con éxito (%dx%d studs, desnivel %d studs).", "${name}", w, d, elevGain))
end

buildFavela()
`;
}
