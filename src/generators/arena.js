import { PALETTE, METRICS } from "./palette.js";

/**
 * Genera el script Luau para una arena táctica completa de combate (3 carriles con simetría).
 */
export function generateArenaLuau({
  name = "TacticalArena",
  centerX = 0,
  centerY = 0,
  centerZ = 0,
  sizeX = 80,
  sizeZ = 80,
  wallHeight = 14,
  includeCentralPlatform = true,
}) {
  const halfX = sizeX / 2;
  const halfZ = sizeZ / 2;
  const wallThick = 1.5;

  return `
local function createArena()
    local graybox = workspace:FindFirstChild("Graybox") or Instance.new("Folder", workspace)
    graybox.Name = "Graybox"

    local arena = Instance.new("Model", graybox)
    arena.Name = "${name}"

    local function makePart(pName, size, cframe, color, parent)
        local p = Instance.new("Part", parent or arena)
        p.Name = pName
        p.Anchored = true
        p.CanCollide = true
        p.TopSurface = Enum.TopSurfaceType.Smooth
        p.BottomSurface = Enum.BottomSurfaceType.Smooth
        p.Material = Enum.Material.SmoothPlastic
        p.Color = color
        p.Size = size
        p.CFrame = cframe
        return p
    end

    -- 1. Suelo Principal
    makePart("ArenaFloor", Vector3.new(${sizeX}, 1, ${sizeZ}), CFrame.new(${centerX}, ${centerY} - 0.5, ${centerZ}), ${PALETTE.floor})

    -- 2. Paredes Perimetrales
    local halfH = ${wallHeight} / 2
    local wColor = ${PALETTE.wall}
    makePart("Perimeter_N", Vector3.new(${sizeX}, ${wallHeight}, ${wallThick}), CFrame.new(${centerX}, ${centerY} + halfH, ${centerZ} - ${halfZ} + ${wallThick}/2), wColor)
    makePart("Perimeter_S", Vector3.new(${sizeX}, ${wallHeight}, ${wallThick}), CFrame.new(${centerX}, ${centerY} + halfH, ${centerZ} + ${halfZ} - ${wallThick}/2), wColor)
    makePart("Perimeter_W", Vector3.new(${wallThick}, ${wallHeight}, ${sizeZ}), CFrame.new(${centerX} - ${halfX} + ${wallThick}/2, ${centerY} + halfH, ${centerZ}), wColor)
    makePart("Perimeter_E", Vector3.new(${wallThick}, ${wallHeight}, ${sizeZ}), CFrame.new(${centerX} + ${halfX} - ${wallThick}/2, ${centerY} + halfH, ${centerZ}), wColor)

    -- 3. Zonas de Spawn (Norte y Sur)
    local spawnSize = Vector3.new(16, 0.5, 8)
    local sN = makePart("SpawnZone_TeamA", spawnSize, CFrame.new(${centerX}, ${centerY} + 0.25, ${centerZ} - ${halfZ} + 10), ${PALETTE.spawnPoint})
    sN.Transparency = 0.3
    local sS = makePart("SpawnZone_TeamB", spawnSize, CFrame.new(${centerX}, ${centerY} + 0.25, ${centerZ} + ${halfZ} - 10), ${PALETTE.spawnPoint})
    sS.Transparency = 0.3

    -- 4. Plataforma Central / Objetivo
    ${
      includeCentralPlatform
        ? `
    local platH = 4
    local platSize = Vector3.new(20, platH, 20)
    makePart("CenterPlatform", platSize, CFrame.new(${centerX}, ${centerY} + platH/2, ${centerZ}), ${PALETTE.platform})

    -- Marcador de Objetivo en el centro
    local obj = makePart("ObjectiveFlag", Vector3.new(4, 1, 4), CFrame.new(${centerX}, ${centerY} + platH + 0.5, ${centerZ}), ${PALETTE.objective})

    -- Rampas de acceso a la plataforma (Norte y Sur)
    local rampDepth = 8
    local function makeRamp(rName, cf, rotY)
        local w = Instance.new("WedgePart", arena)
        w.Name = rName
        w.Anchored = true
        w.CanCollide = true
        w.Material = Enum.Material.SmoothPlastic
        w.Color = ${PALETTE.stairs}
        w.Size = Vector3.new(8, platH, rampDepth)
        w.CFrame = cf * CFrame.Angles(0, math.rad(rotY), 0)
    end
    makeRamp("Ramp_North", CFrame.new(${centerX}, ${centerY} + platH/2, ${centerZ} - 10 - rampDepth/2), 0)
    makeRamp("Ramp_South", CFrame.new(${centerX}, ${centerY} + platH/2, ${centerZ} + 10 + rampDepth/2), 180)
    `
        : ""
    }

    -- 5. Coberturas Tácticas en Carriles Laterales (Flanks)
    local lowH = ${METRICS.lowCoverHeight}
    local highH = ${METRICS.highCoverHeight}
    local lowC = ${PALETTE.lowCover}
    local highC = ${PALETTE.highCover}

    -- Flanco Oeste (Izquierda)
    makePart("HighCover_West", Vector3.new(1.5, highH, 12), CFrame.new(${centerX} - ${halfX} * 0.55, ${centerY} + highH/2, ${centerZ}), highC)
    makePart("LowCover_West_N", Vector3.new(8, lowH, 1.5), CFrame.new(${centerX} - ${halfX} * 0.45, ${centerY} + lowH/2, ${centerZ} - 16), lowC)
    makePart("LowCover_West_S", Vector3.new(8, lowH, 1.5), CFrame.new(${centerX} - ${halfX} * 0.45, ${centerY} + lowH/2, ${centerZ} + 16), lowC)

    -- Flanco Este (Derecha simétrico)
    makePart("HighCover_East", Vector3.new(1.5, highH, 12), CFrame.new(${centerX} + ${halfX} * 0.55, ${centerY} + highH/2, ${centerZ}), highC)
    makePart("LowCover_East_N", Vector3.new(8, lowH, 1.5), CFrame.new(${centerX} + ${halfX} * 0.45, ${centerY} + lowH/2, ${centerZ} - 16), lowC)
    makePart("LowCover_East_S", Vector3.new(8, lowH, 1.5), CFrame.new(${centerX} + ${halfX} * 0.45, ${centerY} + lowH/2, ${centerZ} + 16), lowC)

    -- 6. Pilares de Línea de Visión (Evitar disparos directos spawn-a-spawn)
    makePart("Pillar_TeamA_L", Vector3.new(4, ${wallHeight} * 0.7, 4), CFrame.new(${centerX} - 12, ${centerY} + (${wallHeight} * 0.7)/2, ${centerZ} - ${halfZ} + 24), ${PALETTE.wallTrim})
    makePart("Pillar_TeamA_R", Vector3.new(4, ${wallHeight} * 0.7, 4), CFrame.new(${centerX} + 12, ${centerY} + (${wallHeight} * 0.7)/2, ${centerZ} - ${halfZ} + 24), ${PALETTE.wallTrim})
    makePart("Pillar_TeamB_L", Vector3.new(4, ${wallHeight} * 0.7, 4), CFrame.new(${centerX} - 12, ${centerY} + (${wallHeight} * 0.7)/2, ${centerZ} + ${halfZ} - 24), ${PALETTE.wallTrim})
    makePart("Pillar_TeamB_R", Vector3.new(4, ${wallHeight} * 0.7, 4), CFrame.new(${centerX} + 12, ${centerY} + (${wallHeight} * 0.7)/2, ${centerZ} + ${halfZ} - 24), ${PALETTE.wallTrim})
end

createArena()
`;
}
