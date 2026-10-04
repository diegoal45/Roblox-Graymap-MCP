import { snapVal } from "./grid.js";

/**
 * Mapeo y validación de materiales de terreno nativos de Roblox.
 */
export const TERRAIN_MATERIALS = {
  Grass: "Enum.Material.Grass",
  LeafyGrass: "Enum.Material.LeafyGrass",
  Dirt: "Enum.Material.Dirt",
  Ground: "Enum.Material.Ground",
  Mud: "Enum.Material.Mud",
  Rock: "Enum.Material.Rock",
  Slate: "Enum.Material.Slate",
  Sand: "Enum.Material.Sand",
  Sandstone: "Enum.Material.Sandstone",
  Snow: "Enum.Material.Snow",
  Glacier: "Enum.Material.Glacier",
  Ice: "Enum.Material.Ice",
  WoodPlanks: "Enum.Material.WoodPlanks",
  Brick: "Enum.Material.Brick",
  Concrete: "Enum.Material.Concrete",
  Pavement: "Enum.Material.Pavement",
  Cobblestone: "Enum.Material.Cobblestone",
  Basalt: "Enum.Material.Basalt",
  CrackedLava: "Enum.Material.CrackedLava",
  Asphalt: "Enum.Material.Asphalt",
  Salt: "Enum.Material.Salt",
  Limestone: "Enum.Material.Limestone",
  Water: "Enum.Material.Water",
  Air: "Enum.Material.Air",
};

export function resolveMaterialEnum(matName, defaultEnum = "Enum.Material.Grass") {
  if (!matName) return defaultEnum;
  const match = Object.keys(TERRAIN_MATERIALS).find(
    (k) => k.toLowerCase() === matName.toLowerCase()
  );
  return match ? TERRAIN_MATERIALS[match] : defaultEnum;
}

/**
 * 1. GENERADOR DE PAISAJES PROCEDURALES (generate_terrain)
 * Soporta biomas: mountains, hills, canyon, plains, dunes, island, river_valley, plateau.
 */
export function generateProceduralTerrainLuau({
  center = [0, 0],
  size = [400, 400],
  biome = "hills",
  baseHeight = 0,
  heightAmplitude = 60,
  seed = 12345,
  scale = 140,
  octaves = 3,
  waterLevel = null, // altura Y para agua (ej: -4 o 0)
  resolution = 8, // studs por voxel (8 = balance ideal velocidad/detalle; 4 = máxima precisión)
  clearBeforeGenerate = false,
  steepSlopeMaterial = "Rock",
  flatMaterial = "Grass",
  underMaterial = "Ground",
  beachMaterial = "Sand",
  snowCapHeight = null,
}) {
  const [cx, cz] = [snapVal(center[0], 4), snapVal(center[1] || center[2] || 0, 4)];
  const [width, length] = [Math.max(32, snapVal(size[0], 4)), Math.max(32, snapVal(size[1] || size[2] || 400, 4))];
  const step = Math.max(4, Math.min(16, snapVal(resolution, 4)));
  const effectiveSeed = typeof seed === "number" ? seed : 12345;
  const effectiveAmp = Math.max(4, heightAmplitude);
  const effectiveBase = baseHeight;
  const effectiveWater = waterLevel !== null && waterLevel !== undefined ? Number(waterLevel) : null;
  const effectiveSnow = snowCapHeight !== null && snowCapHeight !== undefined ? Number(snowCapHeight) : effectiveBase + effectiveAmp * 0.78;

  const steepEnum = resolveMaterialEnum(steepSlopeMaterial, "Enum.Material.Rock");
  const flatEnum = resolveMaterialEnum(flatMaterial, "Enum.Material.Grass");
  const underEnum = resolveMaterialEnum(underMaterial, "Enum.Material.Ground");
  const beachEnum = resolveMaterialEnum(beachMaterial, "Enum.Material.Sand");

  return `
local Terrain = workspace.Terrain
local step = ${step}
local cx = ${cx}
local cz = ${cz}
local halfW = ${Math.floor(width / 2)}
local halfL = ${Math.floor(length / 2)}
local minX = cx - halfW
local maxX = cx + halfW
local minZ = cz - halfL
local maxZ = cz + halfL

local baseHeight = ${effectiveBase}
local amplitude = ${effectiveAmp}
local seed = ${effectiveSeed}
local scale = ${scale}
local octaves = ${octaves}
local biome = "${biome.toLowerCase()}"
local hasWater = ${effectiveWater !== null}
local waterY = ${effectiveWater !== null ? effectiveWater : -9999}
local snowY = ${effectiveSnow}

local matSteep = ${steepEnum}
local matFlat = ${flatEnum}
local matUnder = ${underEnum}
local matBeach = ${beachEnum}

${
  clearBeforeGenerate
    ? `
-- Limpiar caja previa de terreno
local clearCF = CFrame.new(cx, baseHeight + amplitude / 2, cz)
local clearSize = Vector3.new(halfW * 2 + 16, amplitude * 2 + 100, halfL * 2 + 16)
Terrain:FillBlock(clearCF, clearSize, Enum.Material.Air)
`
    : ""
}

-- Función Perlin Fractal Multi-Octava (FBM)
local function fbm(x, z, s)
    local total = 0
    local freq = 1 / scale
    local amp = 1
    local maxVal = 0
    for i = 1, octaves do
        local n = math.noise((x + s * 13.37) * freq, (z + s * 29.11) * freq, 0.5)
        total = total + (n * amp)
        maxVal = maxVal + amp
        amp = amp * 0.5
        freq = freq * 2.0
    end
    return total / maxVal
end

-- Relleno de cimientos masivos subterráneos (base sólida instantánea)
local foundationDepth = 24
local subCF = CFrame.new(cx, baseHeight - foundationDepth / 2, cz)
local subSize = Vector3.new(halfW * 2, foundationDepth, halfL * 2)
Terrain:FillBlock(subCF, subSize, matUnder)

-- Generación por columnas voxel de alta eficiencia
local count = 0
local totalCols = math.floor((maxX - minX) / step) * math.floor((maxZ - minZ) / step)

for x = minX, maxX - step, step do
    for z = minZ, maxZ - step, step do
        local rawN = fbm(x, z, seed)
        local normN = math.clamp(rawN + 0.5, 0, 1)
        local h = 0

        if biome == "mountains" then
            -- Picos escarpados con acentuación no lineal
            local ridge = 1 - math.abs(rawN * 2)
            h = (normN ^ 1.5) * amplitude * 0.7 + (ridge ^ 2) * amplitude * 0.5
        elseif biome == "canyon" then
            -- Mesetas y terrazas escalonadas de arenisca
            local stepped = math.floor(normN * 4) / 4 + ((normN * 4) % 1)^2.5 * 0.25
            h = stepped * amplitude
        elseif biome == "plains" then
            -- Llanuras suaves con microondulaciones
            h = normN * (amplitude * 0.3)
        elseif biome == "dunes" then
            -- Ondas de dunas orientadas por seno y ruido
            local wave = math.sin((x * 0.04) + rawN * 3.5)
            h = ((wave * 0.5 + 0.5) ^ 1.4) * amplitude * 0.7
        elseif biome == "island" then
            -- Máscara radial para descenso natural hacia el océano
            local dist = math.sqrt((x - cx)^2 + (z - cz)^2)
            local maxR = math.min(halfW, halfL) * 0.95
            local radialFalloff = math.clamp(1 - (dist / maxR)^1.8, 0, 1)
            h = (normN * amplitude) * radialFalloff
        elseif biome == "river_valley" then
            -- Valle con río serpenteante en el centro
            local riverCenterZ = cz + math.sin((x - cx) * 0.02) * (halfL * 0.35)
            local distToRiver = math.abs(z - riverCenterZ)
            local riverProfile = math.clamp(distToRiver / 36, 0, 1)
            h = (normN * amplitude * 0.8 + 4) * (riverProfile ^ 0.7)
            if distToRiver < 18 then
                h = math.max(-6, h - 8)
            end
        elseif biome == "plateau" then
            -- Meseta plana en la cumbre con laderas empinadas
            local plateauCap = amplitude * 0.75
            h = math.min(plateauCap, (normN ^ 1.2) * amplitude * 1.4)
        else -- hills (defecto)
            h = (normN ^ 1.1) * amplitude
        end

        local surfaceY = baseHeight + h

        -- Cálculo de pendiente mediante muestra vecina
        local sampleNeighbor = fbm(x + step, z, seed)
        local slope = math.abs(sampleNeighbor - rawN) * (amplitude / step)

        -- Selección inteligente de material según altura y pendiente
        local colMaterial = matFlat
        if slope > 0.45 or biome == "canyon" then
            colMaterial = matSteep
        elseif surfaceY >= snowY and biome == "mountains" then
            colMaterial = Enum.Material.Snow
        elseif hasWater and surfaceY <= waterY + 4 and surfaceY >= waterY - 8 then
            colMaterial = matBeach
        end

        -- Relleno de la columna de terreno
        if surfaceY > baseHeight then
            local colHeight = surfaceY - baseHeight
            local midY = baseHeight + colHeight / 2
            local cf = CFrame.new(x + step / 2, midY, z + step / 2)
            local sz = Vector3.new(step, colHeight, step)
            Terrain:FillBlock(cf, sz, colMaterial)
        elseif surfaceY < baseHeight then
            -- Depresión / excavación
            local holeHeight = baseHeight - surfaceY
            local midY = surfaceY + holeHeight / 2
            local cf = CFrame.new(x + step / 2, midY, z + step / 2)
            local sz = Vector3.new(step, holeHeight, step)
            Terrain:FillBlock(cf, sz, Enum.Material.Air)
        end

        -- Relleno de agua en depresiones
        if hasWater and surfaceY < waterY then
            local waterHeight = waterY - surfaceY
            local midWaterY = surfaceY + waterHeight / 2
            local wcf = CFrame.new(x + step / 2, midWaterY, z + step / 2)
            local wsz = Vector3.new(step, waterHeight, step)
            Terrain:FillBlock(wcf, wsz, Enum.Material.Water)
        end

        count = count + 1
        if count % 250 == 0 then
            task.wait() -- Evitar congelar Studio en áreas extensas
        end
    end
end

print(string.format("[Graybox Terrain] ✅ Bioma '%s' generado exitosamente (%d columnas, tamaño %dx%d).", biome, count, ${width}, ${length}))
`;
}

/**
 * 2. NIVELADO Y PREPARACIÓN DE PARCELAS / CIMENTACIONES (flatten_terrain_area)
 * Corta colinas con Air y rellena depresiones para asentar edificios y plazas.
 */
export function generateFlattenTerrainLuau({
  position = [0, 0, 0],
  size = [80, 80],
  material = "Concrete",
  foundationDepth = 16,
  clearHeight = 50,
  blendMargin = 8,
  retainingWall = false,
  wallMaterial = "Concrete",
}) {
  const [x, y, z] = [snapVal(position[0], 4), snapVal(position[1], 4), snapVal(position[2], 4)];
  const [w, d] = [snapVal(size[0], 4), snapVal(size[1] || size[2] || 80, 4)];
  const fDepth = Math.max(4, snapVal(foundationDepth, 4));
  const clHeight = Math.max(8, snapVal(clearHeight, 4));
  const matEnum = resolveMaterialEnum(material, "Enum.Material.Concrete");
  const wallMatEnum = resolveMaterialEnum(wallMaterial, "Enum.Material.Concrete");

  return `
local Terrain = workspace.Terrain

local plotX = ${x}
local targetY = ${y}
local plotZ = ${z}
local w = ${w}
local d = ${d}
local fDepth = ${fDepth}
local clHeight = ${clHeight}
local blend = ${blendMargin}

-- 1. Despeje aéreo (excavar tierra/rocas por encima de la cota)
local clearCF = CFrame.new(plotX, targetY + clHeight / 2, plotZ)
local clearSize = Vector3.new(w, clHeight, d)
Terrain:FillBlock(clearCF, clearSize, Enum.Material.Air)

-- 2. Cimentación sólida nivelada (rellenar huecos bajo la cota)
local padCF = CFrame.new(plotX, targetY - fDepth / 2, plotZ)
local padSize = Vector3.new(w, fDepth, d)
Terrain:FillBlock(padCF, padSize, ${matEnum})

${
  blendMargin > 0
    ? `
-- 3. Transición suavizada en los bordes perimetrales
local halfW = w / 2
local halfD = d / 2

-- Relleno escalonado de soporte en los 4 bordes
local marginThickness = math.min(blend, 12)
-- Norte (+Z)
Terrain:FillBlock(CFrame.new(plotX, targetY - fDepth / 2, plotZ + halfD + marginThickness / 2), Vector3.new(w, fDepth * 0.75, marginThickness), ${matEnum})
-- Sur (-Z)
Terrain:FillBlock(CFrame.new(plotX, targetY - fDepth / 2, plotZ - halfD - marginThickness / 2), Vector3.new(w, fDepth * 0.75, marginThickness), ${matEnum})
-- Este (+X)
Terrain:FillBlock(CFrame.new(plotX + halfW + marginThickness / 2, targetY - fDepth / 2, plotZ), Vector3.new(marginThickness, fDepth * 0.75, d), ${matEnum})
-- Oeste (-X)
Terrain:FillBlock(CFrame.new(plotX - halfW - marginThickness / 2, targetY - fDepth / 2, plotZ), Vector3.new(marginThickness, fDepth * 0.75, d), ${matEnum})
`
    : ""
}

${
  retainingWall
    ? `
-- 4. Muro de contención perimetral de hormigón
local wallHeight = math.min(clHeight * 0.4, 16)
local wallThick = 2
local wallY = targetY + wallHeight / 2
local halfW = w / 2
local halfD = d / 2

local function makeWallPart(cf, sz)
    local p = Instance.new("Part")
    p.Name = "RetainingWall"
    p.Anchored = true
    p.CanCollide = true
    p.Material = Enum.Material.Concrete
    p.Color = Color3.fromRGB(150, 150, 155)
    p.CFrame = cf
    p.Size = sz
    p.Parent = workspace:FindFirstChild("City") or workspace
end

makeWallPart(CFrame.new(plotX, wallY, plotZ + halfD), Vector3.new(w + wallThick * 2, wallHeight, wallThick))
makeWallPart(CFrame.new(plotX, wallY, plotZ - halfD), Vector3.new(w + wallThick * 2, wallHeight, wallThick))
makeWallPart(CFrame.new(plotX + halfW, wallY, plotZ), Vector3.new(wallThick, wallHeight, d))
makeWallPart(CFrame.new(plotX - halfW, wallY, plotZ), Vector3.new(wallThick, wallHeight, d))
`
    : ""
}

print(string.format("[Graybox Terrain] ✅ Parcela nivelada en (%.0f, %.0f, %.0f) de tamaño %dx%d con material %s.", plotX, targetY, plotZ, w, d, "${material}"))
`;
}

/**
 * 3. TRAZADO DE CARRETERAS, TÚNELES, CANALES Y RÍOS EN TERRENO (carve_terrain_path)
 */
export function generateCarvePathLuau({
  startPoint = [0, 0, 0],
  endPoint = [0, 0, 100],
  waypoints = [],
  width = 24,
  height = 18,
  mode = "road", // "road", "tunnel", "trench", "river"
  surfaceMaterial = "Pavement",
  wallMaterial = "Rock",
}) {
  const allPoints = [startPoint, ...(Array.isArray(waypoints) ? waypoints : []), endPoint];
  const matEnum = resolveMaterialEnum(surfaceMaterial, "Enum.Material.Pavement");
  const wallMatEnum = resolveMaterialEnum(wallMaterial, "Enum.Material.Rock");
  const pointsJson = JSON.stringify(allPoints);

  return `
local Terrain = workspace.Terrain
local points = game:GetService("HttpService"):JSONDecode([==[${pointsJson}]==])
local pathWidth = ${width}
local pathHeight = ${height}
local mode = "${mode.toLowerCase()}"
local surfMat = ${matEnum}
local wallMat = ${wallMatEnum}

local function v3(t)
    return Vector3.new(t[1] or 0, t[2] or 0, t[3] or 0)
end

for i = 1, #points - 1 do
    local p1 = v3(points[i])
    local p2 = v3(points[i + 1])
    local delta = p2 - p1
    local dist = delta.Magnitude

    if dist > 1 then
        local cf = CFrame.lookAt((p1 + p2) / 2, p2)
        local stepLen = 8
        local numSteps = math.max(1, math.floor(dist / stepLen))

        for s = 0, numSteps do
            local alpha = s / numSteps
            local curPos = p1:Lerp(p2, alpha)
            local segCF = CFrame.new(curPos, curPos + delta.Unit)

            if mode == "tunnel" then
                -- Perforación de túnel abovedado subterráneo (sin destruir el monte superior)
                -- 1. Despeje de paso con Air
                Terrain:FillCylinder(segCF * CFrame.Angles(0, math.rad(90), 0), stepLen + 2, pathWidth / 2, Enum.Material.Air)
                Terrain:FillBlock(segCF * CFrame.new(0, -pathHeight * 0.2, 0), Vector3.new(pathWidth, pathHeight * 0.6, stepLen + 2), Enum.Material.Air)
                -- 2. Calzada del túnel
                Terrain:FillBlock(segCF * CFrame.new(0, -pathHeight / 2 - 1, 0), Vector3.new(pathWidth, 2, stepLen + 2), surfMat)

            elseif mode == "river" then
                -- Canal de agua con lecho fluvial
                local trenchDepth = pathHeight * 0.6
                -- Excavar canal
                Terrain:FillBlock(segCF * CFrame.new(0, trenchDepth / 2, 0), Vector3.new(pathWidth, trenchDepth * 2, stepLen + 2), Enum.Material.Air)
                -- Rellenar lecho con arena/grava
                Terrain:FillBlock(segCF * CFrame.new(0, -trenchDepth - 1, 0), Vector3.new(pathWidth, 2, stepLen + 2), Enum.Material.Sand)
                -- Rellenar superficie con agua
                Terrain:FillBlock(segCF * CFrame.new(0, -trenchDepth / 2, 0), Vector3.new(pathWidth - 2, trenchDepth, stepLen + 2), Enum.Material.Water)

            elseif mode == "trench" then
                -- Trinchera abierta / desfiladero
                Terrain:FillBlock(segCF * CFrame.new(0, pathHeight, 0), Vector3.new(pathWidth, pathHeight * 2.5, stepLen + 2), Enum.Material.Air)
                Terrain:FillBlock(segCF * CFrame.new(0, -1, 0), Vector3.new(pathWidth, 2, stepLen + 2), surfMat)

            else -- "road" (defecto)
                -- 1. Despejar rocas y montes por encima de la carretera (corte a cielo abierto)
                Terrain:FillBlock(segCF * CFrame.new(0, pathHeight * 1.5, 0), Vector3.new(pathWidth, pathHeight * 3, stepLen + 2), Enum.Material.Air)
                -- 2. Asentar la calzada
                Terrain:FillBlock(segCF * CFrame.new(0, -1, 0), Vector3.new(pathWidth, 4, stepLen + 2), surfMat)
            end
        end
    end
end

print(string.format("[Graybox Terrain] ✅ Trazo '%s' completado a lo largo de %d puntos.", mode, #points))
`;
}

/**
 * 4. ESCULPIDO PARAMÉTRICO DE FORMAS EN TERRENO (shape_terrain)
 */
export function generateShapeTerrainLuau({
  shape = "Block", // "Block", "Ball", "Cylinder", "Wedge"
  operation = "add", // "add", "subtract"
  position = [0, 0, 0],
  size = [20, 20, 20],
  radius = 15,
  height = 20,
  rotation = [0, 0, 0],
  material = "Rock",
}) {
  const [x, y, z] = [snapVal(position[0], 4), snapVal(position[1], 4), snapVal(position[2], 4)];
  const [sx, sy, sz] = [snapVal(size[0], 4), snapVal(size[1] || size[2] || 20, 4), snapVal(size[2] || 20, 4)];
  const [rx, ry, rz] = rotation || [0, 0, 0];
  const isSub = operation.toLowerCase() === "subtract" || operation.toLowerCase() === "cut";
  const matEnum = isSub ? "Enum.Material.Air" : resolveMaterialEnum(material, "Enum.Material.Rock");

  return `
local Terrain = workspace.Terrain
local cf = CFrame.new(${x}, ${y}, ${z}) * CFrame.Angles(math.rad(${rx}), math.rad(${ry}), math.rad(${rz}))
local shape = "${shape}"
local mat = ${matEnum}

if shape == "Ball" or shape == "Sphere" then
    Terrain:FillBall(Vector3.new(${x}, ${y}, ${z}), ${radius}, mat)
elseif shape == "Cylinder" then
    Terrain:FillCylinder(cf, ${height}, ${radius}, mat)
elseif shape == "Wedge" then
    Terrain:FillWedge(cf, Vector3.new(${sx}, ${sy}, ${sz}), mat)
else -- Block
    Terrain:FillBlock(cf, Vector3.new(${sx}, ${sy}, ${sz}), mat)
end

print(string.format("[Graybox Terrain] ✅ Esculpido primitivo '%s' (%s) en (%.0f, %.0f, %.0f).", shape, "${operation}", ${x}, ${y}, ${z}))
`;
}

/**
 * 5. PINTURA Y REEMPLAZO DE MATERIALES EN TERRENO (paint_terrain_material)
 */
export function generatePaintTerrainLuau({
  mode = "replace", // "replace", "box", "sphere"
  center = [0, 0, 0],
  size = [40, 40, 40],
  radius = 20,
  targetMaterial = "Snow",
  sourceMaterial = "Grass",
  regionBounds = null, // { min: [x,y,z], max: [x,y,z] }
}) {
  const [x, y, z] = [snapVal(center[0], 4), snapVal(center[1], 4), snapVal(center[2], 4)];
  const [sx, sy, sz] = [snapVal(size[0], 4), snapVal(size[1] || 40, 4), snapVal(size[2] || 40, 4)];
  const targetEnum = resolveMaterialEnum(targetMaterial, "Enum.Material.Snow");
  const sourceEnum = resolveMaterialEnum(sourceMaterial, "Enum.Material.Grass");

  if (mode === "box") {
    return `
local Terrain = workspace.Terrain
local cf = CFrame.new(${x}, ${y}, ${z})
local sz = Vector3.new(${sx}, ${sy}, ${sz})
Terrain:FillBlock(cf, sz, ${targetEnum})
print("[Graybox Terrain] ✅ Caja de material ${targetMaterial} pintada en (${x}, ${y}, ${z}).")
`;
  }

  if (mode === "sphere" || mode === "ball") {
    return `
local Terrain = workspace.Terrain
Terrain:FillBall(Vector3.new(${x}, ${y}, ${z}), ${radius}, ${targetEnum})
print("[Graybox Terrain] ✅ Esfera de material ${targetMaterial} (r=${radius}) pintada en (${x}, ${y}, ${z}).")
`;
  }

  // mode === "replace" (Nativo ReplaceMaterial con Region3)
  const minV = regionBounds && regionBounds.min ? regionBounds.min : [x - sx / 2, y - sy / 2, z - sz / 2];
  const maxV = regionBounds && regionBounds.max ? regionBounds.max : [x + sx / 2, y + sy / 2, z + sz / 2];

  return `
local Terrain = workspace.Terrain
local minVec = Vector3.new(${minV[0]}, ${minV[1]}, ${minV[2]})
local maxVec = Vector3.new(${maxV[0]}, ${maxV[1]}, ${maxV[2]})
local region = Region3.new(minVec, maxVec):ExpandToGrid(4)

local success, err = pcall(function()
    Terrain:ReplaceMaterial(region, 4, ${sourceEnum}, ${targetEnum})
end)

if success then
    print(string.format("[Graybox Terrain] ✅ Reemplazado '%s' por '%s' en la región especificada.", "${sourceMaterial}", "${targetMaterial}"))
else
    warn("[Graybox Terrain] Error en ReplaceMaterial: " .. tostring(err))
end
`;
}

/**
 * 6. LIMPIEZA DE TERRENO (clear_terrain)
 */
export function generateClearTerrainLuau({
  all = false,
  regionBounds = null, // { min: [x,y,z], max: [x,y,z] }
}) {
  if (all) {
    return `
workspace.Terrain:Clear()
print("[Graybox Terrain] 🧹 Terreno limpiado completamente en Workspace.")
`;
  }

  const minV = regionBounds?.min || [-200, -50, -200];
  const maxV = regionBounds?.max || [200, 150, 200];

  return `
local Terrain = workspace.Terrain
local minVec = Vector3.new(${minV[0]}, ${minV[1]}, ${minV[2]})
local maxVec = Vector3.new(${maxV[0]}, ${maxV[1]}, ${maxV[2]})
local cf = CFrame.new((minVec + maxVec) / 2)
local sz = maxVec - minVec
Terrain:FillBlock(cf, sz, Enum.Material.Air)
print("[Graybox Terrain] 🧹 Región de terreno eliminada exitosamente.")
`;
}

/**
 * 7. CONFIGURACIÓN CINEMÁTICA DE AGUA EN TERRENO (configure_water)
 */
export function generateWaterConfigLuau({
  color = [40, 120, 160], // [R, G, B]
  reflectance = 0.5,
  transparency = 0.6,
  waveSize = 0.25,
  waveSpeed = 12,
}) {
  const [r, g, b] = color;
  return `
local Terrain = workspace.Terrain
Terrain.WaterColor = Color3.fromRGB(${r}, ${g}, ${b})
Terrain.WaterReflectance = ${Math.min(1, Math.max(0, reflectance))}
Terrain.WaterTransparency = ${Math.min(1, Math.max(0, transparency))}
Terrain.WaterWaveSize = ${Math.min(1, Math.max(0, waveSize))}
Terrain.WaterWaveSpeed = ${Math.max(0, waveSpeed)}
print(string.format("[Graybox Terrain] 🌊 Propiedades de agua actualizadas: Color(%d, %d, %d), Olas=%.2f.", ${r}, ${g}, ${b}, ${waveSize}))
`;
}
