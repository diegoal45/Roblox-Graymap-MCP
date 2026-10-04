/**
 * Motor de Mecánicas e Interactividad de Juego para Roblox Studio.
 * Inyecta controladores en ServerScriptService para puertas interactivas
 * con TweenService, ciclo día/noche en farolas y puntos de spawn tácticos.
 */

export function generateInteractiveSystemsLuau({
  enableDoorController = true,
  enableDayNightLighting = true,
  enableTeamSpawns = true,
  teamA_Position = [0, 5, 200],  // Base Sur
  teamB_Position = [0, 80, -800], // Base Norte (Montaña)
}) {
  const [ax, ay, az] = teamA_Position;
  const [bx, by, bz] = teamB_Position;

  return `
local ServerScriptService = game:GetService("ServerScriptService")
local CollectionService = game:GetService("CollectionService")
local TweenService = game:GetService("TweenService")
local Lighting = game:GetService("Lighting")

-- 1. CONTROLADOR DE PUERTAS INTERACTIVAS (TweenService + ProximityPrompt)
${
  enableDoorController
    ? `
local doorScriptName = "InteractiveDoorController"
local existingDoorScript = ServerScriptService:FindFirstChild(doorScriptName)
if not existingDoorScript then
    local doorScript = Instance.new("Script")
    doorScript.Name = doorScriptName
    doorScript.Source = [==[
local CollectionService = game:GetService("CollectionService")
local TweenService = game:GetService("TweenService")

local function setupDoor(door)
    local prompt = door:FindFirstChildOfClass("ProximityPrompt")
    if not prompt then return end

    local isOpen = door:GetAttribute("IsOpen") or false
    local originCF = door:GetAttribute("OriginCFrame") or door.CFrame
    door:SetAttribute("OriginCFrame", originCF)

    prompt.Triggered:Connect(function(player)
        isOpen = not isOpen
        door:SetAttribute("IsOpen", isOpen)

        local targetCF = originCF
        if isOpen then
            targetCF = originCF * CFrame.Angles(0, math.rad(90), 0) * CFrame.new(door.Size.X / 2, 0, -door.Size.X / 2)
        end

        local tweenInfo = TweenInfo.new(0.35, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
        local tween = TweenService:Create(door, tweenInfo, { CFrame = targetCF })
        tween:Play()
    end)
end

for _, door in ipairs(CollectionService:GetTagged("InteractiveDoor")) do
    task.spawn(setupDoor, door)
end

CollectionService:GetInstanceAddedSignal("InteractiveDoor"):Connect(setupDoor)
print("[GameMechanics] 🚪 Controlador de puertas interactivas iniciado.")
]==]
    doorScript.Parent = ServerScriptService
end
`
    : ""
}

-- 2. CONTROLADOR DÍA / NOCHE PARA FAROLAS Y VENTANAS
${
  enableDayNightLighting
    ? `
local lightScriptName = "DayNightLightingController"
local existingLightScript = ServerScriptService:FindFirstChild(lightScriptName)
if not existingLightScript then
    local lightScript = Instance.new("Script")
    lightScript.Name = lightScriptName
    lightScript.Source = [==[
local Lighting = game:GetService("Lighting")
local CollectionService = game:GetService("CollectionService")

local function updateLightingState()
    local clock = Lighting.ClockTime
    local isNight = clock >= 18.0 or clock <= 6.2

    for _, light in ipairs(workspace:GetDescendants()) do
        if light:IsA("PointLight") or light:IsA("SpotLight") then
            local parent = light.Parent
            if parent and (parent.Name:find("Lamp") or parent.Name:find("Win") or parent.Name:find("Beacon")) then
                light.Enabled = isNight
                if parent.Material == Enum.Material.Neon then
                    parent.Transparency = isNight and 0.0 or 0.7
                end
            end
        end
    end
end

Lighting:GetPropertyChangedSignal("ClockTime"):Connect(updateLightingState)
task.spawn(updateLightingState)
print("[GameMechanics] 💡 Controlador de alumbrado público día/noche iniciado.")
]==]
    lightScript.Parent = ServerScriptService
end
`
    : ""
}

-- 3. PUNTOS DE SPAWN TÁCTICOS Y ZONAS DE EQUIPO
${
  enableTeamSpawns
    ? `
local spawnFolder = workspace:FindFirstChild("GameSpawns")
if not spawnFolder then
    spawnFolder = Instance.new("Folder", workspace)
    spawnFolder.Name = "GameSpawns"
end

local function makeSpawn(name, cf, col, teamName)
    local sp = Instance.new("SpawnLocation", spawnFolder)
    sp.Name = name
    sp.Size = Vector3.new(12, 1.2, 12)
    sp.CFrame = cf
    sp.Anchored = true
    sp.CanCollide = true
    sp.Material = Enum.Material.DiamondPlate
    sp.Color = col
    sp.Duration = 3 -- 3 segundos de invulnerabilidad
    sp.Neutral = false
    sp.TeamColor = BrickColor.new(col)

    local halo = Instance.new("SelectionBox", sp)
    halo.Adornee = sp
    halo.Color3 = col
    halo.LineThickness = 0.06

    print(string.format("[GameMechanics] 🚩 Spawn '%s' (%s) creado en (%d, %d, %d).", name, teamName, cf.Position.X, cf.Position.Y, cf.Position.Z))
end

makeSpawn("Spawn_Team_Alpha", CFrame.new(${ax}, ${ay} + 0.6, ${az}), Color3.fromRGB(45, 120, 240), "Blue_Team")
makeSpawn("Spawn_Team_Bravo", CFrame.new(${bx}, ${by} + 0.6, ${bz}), Color3.fromRGB(240, 60, 45), "Red_Team")
`
    : ""
}

print("[GameMechanics] ✅ Todos los sistemas interactivos y de juego inyectados exitosamente.")
`;
}
