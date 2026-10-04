import { PALETTE } from "./palette.js";

/**
 * Genera el script Luau para construir una habitación graybox con puertas opcionales.
 */
export function generateRoomLuau({
  name = "Room",
  x = 0,
  y = 0,
  z = 0,
  width = 30,
  length = 30,
  height = 12,
  wallThickness = 1,
  doors = [], // ej: [{ wall: "North", width: 6, height: 8.5, offset: 0 }]
  hasCeiling = false,
}) {
  const halfW = width / 2;
  const halfL = length / 2;
  const halfH = height / 2;

  // Normalizar puertas por pared
  const doorMap = { North: null, South: null, East: null, West: null };
  if (Array.isArray(doors)) {
    for (const d of doors) {
      if (doorMap.hasOwnProperty(d.wall)) {
        doorMap[d.wall] = {
          width: d.width || 6,
          height: d.height || 8.5,
          offset: d.offset || 0, // Desplazamiento respecto al centro de la pared
        };
      }
    }
  }

  return `
local function createRoom()
    local graybox = workspace:FindFirstChild("Graybox") or Instance.new("Folder", workspace)
    graybox.Name = "Graybox"

    local model = Instance.new("Model", graybox)
    model.Name = "${name}"

    local function makePart(pName, size, cframe, color)
        local p = Instance.new("Part", model)
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

    local floorColor = ${PALETTE.floor}
    local wallColor = ${PALETTE.wall}
    local trimColor = ${PALETTE.wallTrim}

    -- 1. Piso
    makePart("Floor", Vector3.new(${width}, 1, ${length}), CFrame.new(${x}, ${y} - 0.5, ${z}), floorColor)

    -- 2. Pared con vano de puerta o sólida (Eje X: North / South)
    local function buildWallZ(wallName, centerZ, door)
        if not door then
            makePart(wallName, Vector3.new(${width}, ${height}, ${wallThickness}), CFrame.new(${x}, ${y} + ${halfH}, centerZ), wallColor)
        else
            local dW = math.clamp(door.width, 4, ${width} - 4)
            local dH = math.clamp(door.height, 7, ${height} - 2)
            local off = math.clamp(door.offset, -(${width} - dW)/2 + 2, (${width} - dW)/2 - 2)

            -- Segmento izquierdo
            local leftW = (${width} / 2) + off - (dW / 2)
            local leftX = ${x} - ${halfW} + (leftW / 2)
            if leftW > 0.5 then
                makePart(wallName .. "_Left", Vector3.new(leftW, ${height}, ${wallThickness}), CFrame.new(leftX, ${y} + ${halfH}, centerZ), wallColor)
            end

            -- Segmento derecho
            local rightW = (${width} / 2) - off - (dW / 2)
            local rightX = ${x} + ${halfW} - (rightW / 2)
            if rightW > 0.5 then
                makePart(wallName .. "_Right", Vector3.new(rightW, ${height}, ${wallThickness}), CFrame.new(rightX, ${y} + ${halfH}, centerZ), wallColor)
            end

            -- Dintel superior sobre la puerta
            local lintelH = ${height} - dH
            local lintelY = ${y} + dH + (lintelH / 2)
            makePart(wallName .. "_Lintel", Vector3.new(dW, lintelH, ${wallThickness}), CFrame.new(${x} + off, lintelY, centerZ), trimColor)
        end
    end

    -- 3. Pared con vano de puerta o sólida (Eje Z: West / East)
    local function buildWallX(wallName, centerX, door)
        if not door then
            makePart(wallName, Vector3.new(${wallThickness}, ${height}, ${length}), CFrame.new(centerX, ${y} + ${halfH}, ${z}), wallColor)
        else
            local dW = math.clamp(door.width, 4, ${length} - 4)
            local dH = math.clamp(door.height, 7, ${height} - 2)
            local off = math.clamp(door.offset, -(${length} - dW)/2 + 2, (${length} - dW)/2 - 2)

            -- Segmento frontal/trasero
            local seg1L = (${length} / 2) + off - (dW / 2)
            local seg1Z = ${z} - ${halfL} + (seg1L / 2)
            if seg1L > 0.5 then
                makePart(wallName .. "_Seg1", Vector3.new(${wallThickness}, ${height}, seg1L), CFrame.new(centerX, ${y} + ${halfH}, seg1Z), wallColor)
            end

            local seg2L = (${length} / 2) - off - (dW / 2)
            local seg2Z = ${z} + ${halfL} - (seg2L / 2)
            if seg2L > 0.5 then
                makePart(wallName .. "_Seg2", Vector3.new(${wallThickness}, ${height}, seg2L), CFrame.new(centerX, ${y} + ${halfH}, seg2Z), wallColor)
            end

            -- Dintel superior sobre la puerta
            local lintelH = ${height} - dH
            local lintelY = ${y} + dH + (lintelH / 2)
            makePart(wallName .. "_Lintel", Vector3.new(${wallThickness}, lintelH, dW), CFrame.new(centerX, lintelY, ${z} + off), trimColor)
        end
    end

    -- Construir las 4 paredes
    buildWallZ("Wall_North", ${z} - ${halfL} + ${wallThickness}/2, ${doorMap.North ? JSON.stringify(doorMap.North) : "nil"})
    buildWallZ("Wall_South", ${z} + ${halfL} - ${wallThickness}/2, ${doorMap.South ? JSON.stringify(doorMap.South) : "nil"})
    buildWallX("Wall_West", ${x} - ${halfW} + ${wallThickness}/2, ${doorMap.West ? JSON.stringify(doorMap.West) : "nil"})
    buildWallX("Wall_East", ${x} + ${halfW} - ${wallThickness}/2, ${doorMap.East ? JSON.stringify(doorMap.East) : "nil"})

    ${
      hasCeiling
        ? `makePart("Ceiling", Vector3.new(${width}, 1, ${length}), CFrame.new(${x}, ${y} + ${height} + 0.5, ${z}), floorColor)`
        : ""
    }
end

createRoom()
`;
}
