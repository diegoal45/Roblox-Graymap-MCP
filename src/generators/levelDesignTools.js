import { snapVal } from "./grid.js";

/**
 * GENERADORES DE HERRAMIENTAS DE EDICIÓN, MANIPULACIÓN, MEDICIÓN Y OPTIMIZACIÓN EN ROBLOX STUDIO.
 * Luau scripts para nivel de diseño profesional, transformaciones, física y diagnósticos.
 */

// Helper para convertir arrays JS a tablas Luau {x, y, z}
function toLuauVec3(arr) {
  if (!Array.isArray(arr) || arr.length < 3) return "nil";
  return `{ ${Number(arr[0]) || 0}, ${Number(arr[1]) || 0}, ${Number(arr[2]) || 0} }`;
}

// Helper para resolver ruta en Luau
const RESOLVE_PATH_LUAU = `
local function resolveTarget(pathStr)
    if not pathStr or pathStr == "" or pathStr == "selected" or pathStr == "Selection" then
        local sel = game:GetService("Selection"):Get()
        return sel[1]
    end
    if pathStr == "Workspace" or pathStr == "workspace" then
        return workspace
    end
    local segments = string.split(pathStr, "/")
    local current = workspace
    for _, s in ipairs(segments) do
        if s ~= "" then
            current = current:FindFirstChild(s)
            if not current then return nil end
        end
    end
    return current
end
`;

/**
 * 1. Mover, Rotar y Escalar Objetos Existentes
 */
export function generateTransformObjectLuau({
  targetPath = "selected",
  position,
  offset,
  rotation,
  rotationOffset,
  snapGrid = 0,
}) {
  const absPos = toLuauVec3(position);
  const relOff = toLuauVec3(offset);
  const absRot = toLuauVec3(rotation);
  const relRot = toLuauVec3(rotationOffset);
  const grid = Number(snapGrid) || 0;
  const targetStr = targetPath || "selected";

  return `
${RESOLVE_PATH_LUAU}

local target = resolveTarget("${targetStr}")
if not target then
    error("No se encontró el objeto objetivo: '${targetStr}' (o no hay nada seleccionado).")
end

local function snapNum(val, step)
    if step and step > 0 then
        return math.floor(val / step + 0.5) * step
    end
    return val
end

local currentCF
if target:IsA("Model") then
    currentCF = target:GetPivot()
elseif target:IsA("BasePart") then
    currentCF = target.CFrame
else
    error("El objeto '" .. target.Name .. "' no es ni Model ni BasePart.")
end

local targetPos = currentCF.Position
local absPos = ${absPos}
local relOff = ${relOff}

if absPos then
    targetPos = Vector3.new(
        snapNum(absPos[1], ${grid}),
        snapNum(absPos[2], ${grid}),
        snapNum(absPos[3], ${grid})
    )
elseif relOff then
    targetPos = targetPos + Vector3.new(
        snapNum(relOff[1], ${grid}),
        snapNum(relOff[2], ${grid}),
        snapNum(relOff[3], ${grid})
    )
end

local targetRotCF = currentCF - currentCF.Position
local absRot = ${absRot}
local relRot = ${relRot}

if absRot then
    targetRotCF = CFrame.Angles(math.rad(absRot[1]), math.rad(absRot[2]), math.rad(absRot[3]))
elseif relRot then
    targetRotCF = targetRotCF * CFrame.Angles(math.rad(relRot[1]), math.rad(relRot[2]), math.rad(relRot[3]))
end

local finalCF = CFrame.new(targetPos) * targetRotCF

if target:IsA("Model") then
    target:PivotTo(finalCF)
elseif target:IsA("BasePart") then
    target.CFrame = finalCF
end

local resultPos = { math.round(finalCF.Position.X*10)/10, math.round(finalCF.Position.Y*10)/10, math.round(finalCF.Position.Z*10)/10 }
local rx, ry, rz = finalCF:ToEulerAnglesXYZ()
local resultRot = { math.round(math.deg(rx)*10)/10, math.round(math.deg(ry)*10)/10, math.round(math.deg(rz)*10)/10 }

return {
    success = true,
    targetName = target.Name,
    targetPath = target:GetFullName(),
    newPosition = resultPos,
    newRotation = resultRot
}
`;
}

/**
 * 2. Imán / Asentar al Suelo (Drop to Ground)
 */
export function generateAlignToSurfaceLuau({
  targetPath = "selected",
  offsetY = 0,
  alignNormal = false,
  raycastDistance = 250,
}) {
  const targetStr = targetPath || "selected";

  return `
${RESOLVE_PATH_LUAU}

local target = resolveTarget("${targetStr}")
if not target then
    error("No se encontró el objeto objetivo: '${targetStr}'.")
end

local currentCF, currentSize
if target:IsA("Model") then
    currentCF, currentSize = target:GetBoundingBox()
elseif target:IsA("BasePart") then
    currentCF = target.CFrame
    currentSize = target.Size
else
    error("El objeto no es Model ni BasePart.")
end

local halfHeight = currentSize.Y / 2
local rayOrigin = currentCF.Position + Vector3.new(0, 10, 0)
local rayDir = Vector3.new(0, -${Number(raycastDistance) || 250}, 0)

local params = RaycastParams.new()
params.FilterType = Enum.RaycastFilterType.Exclude
params.FilterDescendantsInstances = { target }

local hit = workspace:Raycast(rayOrigin, rayDir, params)
if not hit then
    return {
        grounded = false,
        message = "No se detectó suelo debajo del objeto en un rango de ${Number(raycastDistance) || 250} studs."
    }
end

local groundY = hit.Position.Y
local targetY = groundY + halfHeight + ${Number(offsetY) || 0}
local deltaY = targetY - currentCF.Position.Y

local newCF
if ${alignNormal === true} then
    local upVector = hit.Normal
    local forwardVector = currentCF.LookVector
    local rightVector = forwardVector:Cross(upVector)
    forwardVector = upVector:Cross(rightVector).Unit
    newCF = CFrame.fromMatrix(Vector3.new(currentCF.Position.X, targetY, currentCF.Position.Z), rightVector, upVector, -forwardVector)
else
    newCF = CFrame.new(currentCF.Position.X, targetY, currentCF.Position.Z) * (currentCF - currentCF.Position)
end

if target:IsA("Model") then
    target:PivotTo(newCF)
elseif target:IsA("BasePart") then
    target.CFrame = newCF
end

return {
    grounded = true,
    targetName = target.Name,
    hitMaterial = hit.Material.Name,
    surfaceY = math.round(groundY * 10) / 10,
    newCenterY = math.round(targetY * 10) / 10,
    verticalShift = math.round(deltaY * 10) / 10
}
`;
}

/**
 * 3. Duplicar y Repetir en Serie / Matriz (Clone & Array)
 */
export function generateDuplicateAndRepeatLuau({
  targetPath = "selected",
  count = 3,
  offsetStep = [0, 0, 40],
  rotationStep = [0, 0, 0],
  parent = "City/Props",
}) {
  const [dx, dy, dz] = offsetStep;
  const [rx, ry, rz] = rotationStep;
  const targetStr = targetPath || "selected";

  return `
${RESOLVE_PATH_LUAU}

local target = resolveTarget("${targetStr}")
if not target then
    error("No se encontró el objeto objetivo a duplicar: '${targetStr}'.")
end

local segments = string.split("${parent}", "/")
local destFolder = workspace
for _, s in ipairs(segments) do
    if s ~= "" then
        local nextF = destFolder:FindFirstChild(s)
        if not nextF then
            nextF = Instance.new("Folder")
            nextF.Name = s
            nextF.Parent = destFolder
        end
        destFolder = nextF
    end
end

local currentCF
if target:IsA("Model") then
    currentCF = target:GetPivot()
elseif target:IsA("BasePart") then
    currentCF = target.CFrame
end

local CollectionService = game:GetService("CollectionService")
local clonesCreated = {}

for i = 1, ${Math.max(1, Math.min(100, Number(count) || 1))} do
    local clone = target:Clone()
    clone.Name = target.Name .. "_Clone_" .. i
    
    local stepPos = Vector3.new(${dx} * i, ${dy} * i, ${dz} * i)
    local stepRot = CFrame.Angles(math.rad(${rx} * i), math.rad(${ry} * i), math.rad(${rz} * i))
    local newCF = currentCF * CFrame.new(stepPos) * stepRot
    
    if clone:IsA("Model") then
        clone:PivotTo(newCF)
    elseif clone:IsA("BasePart") then
        clone.CFrame = newCF
    end
    
    CollectionService:AddTag(clone, "ClonedInstance")
    clone.Parent = destFolder
    table.insert(clonesCreated, clone.Name)
end

return {
    success = true,
    source = target.Name,
    count = #clonesCreated,
    parent = destFolder:GetFullName(),
    clones = clonesCreated
}
`;
}

/**
 * 4. Medición Espacial de Level Design (Distancia, Desnivel y Línea de Visión)
 */
export function generateMeasureDistanceLuau({
  pointA,
  pointB,
  objectAPath = "",
  objectBPath = "",
  checkLineOfSight = true,
}) {
  const pA = toLuauVec3(pointA);
  const pB = toLuauVec3(pointB);
  const pathA = objectAPath ? `"${objectAPath}"` : '""';
  const pathB = objectBPath ? `"${objectBPath}"` : '""';

  return `
${RESOLVE_PATH_LUAU}

local posA, posB, nameA, nameB

local customA = ${pA}
local customB = ${pB}

if customA then
    posA = Vector3.new(customA[1], customA[2], customA[3])
    nameA = string.format("Punto A (%.1f, %.1f, %.1f)", posA.X, posA.Y, posA.Z)
elseif ${pathA} ~= "" then
    local objA = resolveTarget(${pathA})
    if objA then
        nameA = objA.Name
        posA = objA:IsA("Model") and objA:GetPivot().Position or objA.Position
    end
end

if customB then
    posB = Vector3.new(customB[1], customB[2], customB[3])
    nameB = string.format("Punto B (%.1f, %.1f, %.1f)", posB.X, posB.Y, posB.Z)
elseif ${pathB} ~= "" then
    local objB = resolveTarget(${pathB})
    if objB then
        nameB = objB.Name
        posB = objB:IsA("Model") and objB:GetPivot().Position or objB.Position
    end
end

if not posA or not posB then
    local sel = game:GetService("Selection"):Get()
    if #sel >= 2 then
        nameA = sel[1].Name
        posA = sel[1]:IsA("Model") and sel[1]:GetPivot().Position or sel[1].Position
        nameB = sel[2].Name
        posB = sel[2]:IsA("Model") and sel[2]:GetPivot().Position or sel[2].Position
    end
end

if not posA or not posB then
    error("Debes especificar dos puntos (pointA y pointB), dos objetos (objectAPath y objectBPath), o tener al menos 2 objetos seleccionados en Studio.")
end

local delta = posB - posA
local dist3D = delta.Magnitude
local horizDist = Vector3.new(delta.X, 0, delta.Z).Magnitude
local heightDelta = delta.Y
local slopeDeg = horizDist > 0.01 and math.deg(math.atan2(math.abs(heightDelta), horizDist)) or 90

local losResult = { clear = true }
if ${checkLineOfSight === true} and dist3D > 0.5 then
    local params = RaycastParams.new()
    params.FilterType = Enum.RaycastFilterType.Exclude
    params.FilterDescendantsInstances = {}
    local hit = workspace:Raycast(posA, delta, params)
    if hit and (hit.Position - posB).Magnitude > 1.0 then
        losResult = {
            clear = false,
            obstruction = hit.Instance.Name,
            obstructionPath = hit.Instance:GetFullName(),
            hitPoint = { math.round(hit.Position.X*10)/10, math.round(hit.Position.Y*10)/10, math.round(hit.Position.Z*10)/10 },
            distanceToObstruction = math.round((hit.Position - posA).Magnitude * 10) / 10
        }
    end
end

return {
    pointA = { name = nameA, position = { math.round(posA.X*10)/10, math.round(posA.Y*10)/10, math.round(posA.Z*10)/10 } },
    pointB = { name = nameB, position = { math.round(posB.X*10)/10, math.round(posB.Y*10)/10, math.round(posB.Z*10)/10 } },
    distance3D = math.round(dist3D * 10) / 10,
    horizontalDistance = math.round(horizDist * 10) / 10,
    verticalDelta = math.round(heightDelta * 10) / 10,
    slopeDegrees = math.round(slopeDeg * 10) / 10,
    lineOfSight = losResult
}
`;
}

/**
 * 5. Buscador y Filtro Avanzado de Workspace
 */
export function generateFindObjectsLuau({
  queryName = "",
  className = "",
  material = "",
  tag = "",
  scopePath = "Workspace",
  maxResults = 30,
}) {
  return `
${RESOLVE_PATH_LUAU}

local scope = resolveTarget("${scopePath}") or workspace
local results = {}
local qName = string.lower("${queryName || ""}")
local cName = "${className || ""}"
local matName = "${material || ""}"
local tagName = "${tag || ""}"
local limit = ${Number(maxResults) || 30}
local CollectionService = game:GetService("CollectionService")

for _, inst in ipairs(scope:GetDescendants()) do
    if #results >= limit then break end
    
    local match = true
    if qName ~= "" and not string.find(string.lower(inst.Name), qName, 1, true) then
        match = false
    end
    if match and cName ~= "" and not inst:IsA(cName) then
        match = false
    end
    if match and matName ~= "" then
        if not inst:IsA("BasePart") or inst.Material.Name ~= matName then
            match = false
        end
    end
    if match and tagName ~= "" and not CollectionService:HasTag(inst, tagName) then
        match = false
    end
    
    if match then
        local pos, sz
        if inst:IsA("Model") then
            local cf, s = inst:GetBoundingBox()
            pos = { math.round(cf.Position.X*10)/10, math.round(cf.Position.Y*10)/10, math.round(cf.Position.Z*10)/10 }
            sz = { math.round(s.X*10)/10, math.round(s.Y*10)/10, math.round(s.Z*10)/10 }
        elseif inst:IsA("BasePart") then
            pos = { math.round(inst.Position.X*10)/10, math.round(inst.Position.Y*10)/10, math.round(inst.Position.Z*10)/10 }
            sz = { math.round(inst.Size.X*10)/10, math.round(inst.Size.Y*10)/10, math.round(inst.Size.Z*10)/10 }
        end
        
        table.insert(results, {
            name = inst.Name,
            className = inst.ClassName,
            path = inst:GetFullName(),
            position = pos,
            size = sz,
            material = inst:IsA("BasePart") and inst.Material.Name or nil,
            tags = CollectionService:GetTags(inst)
        })
    end
end

return {
    scope = scope:GetFullName(),
    count = #results,
    matches = results
}
`;
}

/**
 * 6. Auditoría Forense de Rendimiento (Anti-Lag & Physics Shield)
 */
export function generateAuditPerformanceLuau({ targetPath = "Workspace" }) {
  return `
${RESOLVE_PATH_LUAU}

local scope = resolveTarget("${targetPath}") or workspace
local totalParts = 0
local totalModels = 0
local totalLights = 0
local unanchoredParts = {}
local unoptimizedCollisions = 0
local missingStreamingLOD = 0
local shadowLights = 0
local emptyContainers = 0
local geometryBreakdown = { Block = 0, Wedge = 0, Cylinder = 0, Sphere = 0, MeshPart = 0, Truss = 0, Other = 0 }

for _, inst in ipairs(scope:GetDescendants()) do
    if inst:IsA("BasePart") then
        totalParts = totalParts + 1
        if not inst.Anchored then
            if #unanchoredParts < 10 then
                table.insert(unanchoredParts, inst:GetFullName())
            end
        end
        
        local vol = inst.Size.X * inst.Size.Y * inst.Size.Z
        if vol < 4 and (inst.CanCollide or inst.CanTouch) then
            unoptimizedCollisions = unoptimizedCollisions + 1
        end
        
        if inst:IsA("MeshPart") then
            geometryBreakdown.MeshPart = geometryBreakdown.MeshPart + 1
        elseif inst:IsA("WedgePart") then
            geometryBreakdown.Wedge = geometryBreakdown.Wedge + 1
        elseif inst:IsA("TrussPart") then
            geometryBreakdown.Truss = geometryBreakdown.Truss + 1
        elseif inst:IsA("Part") then
            local shape = inst.Shape.Name
            if geometryBreakdown[shape] then
                geometryBreakdown[shape] = geometryBreakdown[shape] + 1
            else
                geometryBreakdown.Other = geometryBreakdown.Other + 1
            end
        else
            geometryBreakdown.Other = geometryBreakdown.Other + 1
        end
        
    elseif inst:IsA("Model") then
        totalModels = totalModels + 1
        local descCount = #inst:GetDescendants()
        if descCount == 0 then
            emptyContainers = emptyContainers + 1
        elseif descCount > 12 and inst.LevelOfDetail ~= Enum.ModelLevelOfDetail.StreamingMesh then
            missingStreamingLOD = missingStreamingLOD + 1
        end
        
    elseif inst:IsA("Folder") and #inst:GetChildren() == 0 then
        emptyContainers = emptyContainers + 1
        
    elseif inst:IsA("Light") then
        totalLights = totalLights + 1
        if inst.Shadows then
            shadowLights = shadowLights + 1
        end
    end
end

local riskRating = "Óptimo (Verde)"
if #unanchoredParts > 0 or totalParts > 10000 or missingStreamingLOD > 30 then
    riskRating = "Crítico (Riesgo de colapso de físicas o lag)"
elseif totalParts > 4000 or unoptimizedCollisions > 200 then
    riskRating = "Moderado (Optimizable con 1 clic)"
end

return {
    scope = scope:GetFullName(),
    totalParts = totalParts,
    totalModels = totalModels,
    totalLights = totalLights,
    unanchoredCount = #unanchoredParts,
    unanchoredSamples = unanchoredParts,
    unoptimizedCollisionsCount = unoptimizedCollisions,
    missingStreamingLODCount = missingStreamingLOD,
    shadowCastingLights = shadowLights,
    emptyContainersCount = emptyContainers,
    geometryDistribution = geometryBreakdown,
    riskRating = riskRating
}
`;
}

/**
 * 7. Optimizador Automático de Workspace (Performance Shield en 1 Clic)
 */
export function generateOptimizeWorkspaceLuau({
  targetPath = "Workspace",
  anchorStatic = true,
  optimizeCollisions = true,
  enableStreamingLOD = true,
  disableSmallShadows = true,
  cleanEmpty = true,
}) {
  return `
${RESOLVE_PATH_LUAU}

local scope = resolveTarget("${targetPath}") or workspace
local anchoredCount = 0
local collisionCleaned = 0
local lodEnabledCount = 0
local shadowsDisabled = 0
local emptyDeleted = 0

for _, inst in ipairs(scope:GetDescendants()) do
    if inst:IsA("BasePart") then
        if ${anchorStatic === true} and not inst.Anchored then
            inst.Anchored = true
            anchoredCount = anchoredCount + 1
        end
        
        local vol = inst.Size.X * inst.Size.Y * inst.Size.Z
        if ${optimizeCollisions === true} and vol < 3 then
            inst.CanTouch = false
            inst.CanQuery = false
            collisionCleaned = collisionCleaned + 1
        end
        
        if ${disableSmallShadows === true} and (inst.Size.X < 3 and inst.Size.Y < 3 and inst.Size.Z < 3) then
            if inst.CastShadow then
                inst.CastShadow = false
                shadowsDisabled = shadowsDisabled + 1
            end
        end
        
    elseif inst:IsA("Model") then
        if ${enableStreamingLOD === true} and #inst:GetDescendants() > 8 then
            pcall(function()
                inst.LevelOfDetail = Enum.ModelLevelOfDetail.StreamingMesh
                lodEnabledCount = lodEnabledCount + 1
            end)
        end
        
        if ${cleanEmpty === true} and #inst:GetChildren() == 0 then
            inst:Destroy()
            emptyDeleted = emptyDeleted + 1
        end
        
    elseif inst:IsA("Folder") and ${cleanEmpty === true} and #inst:GetChildren() == 0 then
        inst:Destroy()
        emptyDeleted = emptyDeleted + 1
    end
end

return {
    success = true,
    scope = scope:GetFullName(),
    partsAnchored = anchoredCount,
    collisionsOptimized = collisionCleaned,
    modelsWithLODStreaming = lodEnabledCount,
    shadowsDisabledOnSmallParts = shadowsDisabled,
    emptyContainersRemoved = emptyDeleted
}
`;
}

/**
 * 8. Cambiador en Lote de Materiales o Paletas de Color
 */
export function generateReplaceMaterialOrColorLuau({
  targetPath = "Workspace",
  sourceMaterial,
  targetMaterial,
  sourceColor,
  targetColor,
}) {
  const srcMat = sourceMaterial || "";
  const dstMat = targetMaterial || "";
  const srcCol = toLuauVec3(sourceColor);
  const dstCol = toLuauVec3(targetColor);

  return `
${RESOLVE_PATH_LUAU}

local scope = resolveTarget("${targetPath}") or workspace
local partsChanged = 0
local srcMatName = "${srcMat}"
local dstMatName = "${dstMat}"
local srcCol = ${srcCol}
local dstCol = ${dstCol}

local targetMatEnum = dstMatName ~= "" and Enum.Material[dstMatName] or nil
local targetColRGB = dstCol and Color3.fromRGB(dstCol[1], dstCol[2], dstCol[3]) or nil

for _, inst in ipairs(scope:GetDescendants()) do
    if inst:IsA("BasePart") then
        local changed = false
        
        if srcMatName ~= "" and targetMatEnum then
            if inst.Material.Name == srcMatName then
                inst.Material = targetMatEnum
                changed = true
            end
        elseif dstMatName ~= "" and targetMatEnum and srcMatName == "" then
            inst.Material = targetMatEnum
            changed = true
        end
        
        if targetColRGB then
            if srcCol then
                local currentCol = inst.Color
                local dr = math.abs(currentCol.R * 255 - srcCol[1])
                local dg = math.abs(currentCol.G * 255 - srcCol[2])
                local db = math.abs(currentCol.B * 255 - srcCol[3])
                if dr < 25 and dg < 25 and db < 25 then
                    inst.Color = targetColRGB
                    changed = true
                end
            else
                inst.Color = targetColRGB
                changed = true
            end
        end
        
        if changed then
            partsChanged = partsChanged + 1
        end
    end
end

return {
    success = true,
    scope = scope:GetFullName(),
    partsModified = partsChanged,
    sourceMaterial = srcMatName,
    targetMaterial = dstMatName
}
`;
}

/**
 * 9. Enfoque y Teletransporte de Cámara de Studio
 */
export function generateFocusCameraLuau({
  targetPath = "selected",
  position,
  viewMode = "perspective_overhead", // "perspective_overhead", "front", "top_down", "orbit"
  distance,
}) {
  const customPos = toLuauVec3(position);
  const targetStr = targetPath || "selected";

  return `
${RESOLVE_PATH_LUAU}

local targetPos = nil
local targetSize = Vector3.new(30, 20, 30)

local customPos = ${customPos}
if customPos then
    targetPos = Vector3.new(customPos[1], customPos[2], customPos[3])
else
    local target = resolveTarget("${targetStr}")
    if target then
        if target:IsA("Model") then
            local cf, s = target:GetBoundingBox()
            targetPos = cf.Position
            targetSize = s
        elseif target:IsA("BasePart") then
            targetPos = target.Position
            targetSize = target.Size
        end
    end
end

if not targetPos then
    error("No se pudo determinar el objetivo para la cámara (especifica targetPath o position).")
end

local maxDim = math.max(targetSize.X, targetSize.Y, targetSize.Z)
local dist = ${distance ? Number(distance) : "nil"} or math.max(25, maxDim * 1.6)

local camPos
local mode = "${viewMode || "perspective_overhead"}"

if mode == "top_down" then
    camPos = targetPos + Vector3.new(0, dist * 1.5, 0.1)
elseif mode == "front" then
    camPos = targetPos + Vector3.new(0, targetSize.Y * 0.3, dist)
elseif mode == "orbit" then
    camPos = targetPos + Vector3.new(dist * 0.7, dist * 0.5, dist * 0.7)
else -- perspective_overhead (defecto)
    camPos = targetPos + Vector3.new(dist * 0.8, dist * 0.9, dist * 0.8)
end

local camera = workspace.CurrentCamera
if camera then
    camera.CFrame = CFrame.lookAt(camPos, targetPos)
end

return {
    success = true,
    viewMode = mode,
    targetPosition = { math.round(targetPos.X*10)/10, math.round(targetPos.Y*10)/10, math.round(targetPos.Z*10)/10 },
    cameraPosition = { math.round(camPos.X*10)/10, math.round(camPos.Y*10)/10, math.round(camPos.Z*10)/10 },
    distance = math.round(dist * 10) / 10
}
`;
}

/**
 * 10. Ajustes de Iluminación y Cielo en Vivo
 */
export function generateAdjustLightingLuau({
  clockTime,
  exposure,
  brightness,
  outdoorAmbient,
  fogEnd,
  fogColor,
}) {
  const clockLuau = clockTime !== undefined ? `lighting.ClockTime = ${Number(clockTime)}` : "";
  const expLuau = exposure !== undefined ? `lighting.ExposureCompensation = ${Number(exposure)}` : "";
  const brightLuau = brightness !== undefined ? `lighting.Brightness = ${Number(brightness)}` : "";
  const outdoorLuau = Array.isArray(outdoorAmbient)
    ? `lighting.OutdoorAmbient = Color3.fromRGB(${Number(outdoorAmbient[0]) || 0}, ${Number(outdoorAmbient[1]) || 0}, ${Number(outdoorAmbient[2]) || 0})`
    : "";
  const fogEndLuau = fogEnd !== undefined ? `lighting.FogEnd = ${Number(fogEnd)}` : "";
  const fogColLuau = Array.isArray(fogColor)
    ? `lighting.FogColor = Color3.fromRGB(${Number(fogColor[0]) || 0}, ${Number(fogColor[1]) || 0}, ${Number(fogColor[2]) || 0})`
    : "";

  return `
local lighting = game:GetService("Lighting")

${clockLuau}
${expLuau}
${brightLuau}
${outdoorLuau}
${fogEndLuau}
${fogColLuau}

return {
    success = true,
    clockTime = lighting.ClockTime,
    brightness = lighting.Brightness,
    exposureCompensation = lighting.ExposureCompensation,
    outdoorAmbient = { math.round(lighting.OutdoorAmbient.R*255), math.round(lighting.OutdoorAmbient.G*255), math.round(lighting.OutdoorAmbient.B*255) }
}
`;
}
