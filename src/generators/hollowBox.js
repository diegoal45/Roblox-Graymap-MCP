import { PALETTE } from "./palette.js";
import { snapPosition, snapSize } from "./grid.js";

/**
 * Genera una caja hueca completa (suelo, techo y 4 paredes) en una sola operación paramétrica.
 * Ideal para interiores de edificios urbanos (Banco, Taller, Comisaría, Tiendas).
 */
export function generateHollowBoxLuau({
  name = "Building_Interior",
  position = [0, 0, 0],
  size = [40, 16, 40], // [width (X), height (Y), length (Z)]
  wallThickness = 1.5,
  hasFloor = true,
  hasCeiling = true,
  doors = [], // ej: [{ wall: "North", width: 6, height: 9, offset: 0, tag: "Heist_Entrance" }]
  parent = "Graybox/Downtown/Bank",
  tags = [],
  attributes = {},
  floorColor = [75, 75, 80],
  wallColor = [185, 185, 190],
  ceilingColor = [120, 120, 125],
  material = "SmoothPlastic",
  snapGrid = 4,
}) {
  let [cx, cy, cz] = position;
  let [w, h, l] = size;

  if (snapGrid && snapGrid > 0) {
    [cx, cy, cz] = snapPosition([cx, cy, cz], snapGrid, false);
    w = snapSize(w, snapGrid, 4);
    l = snapSize(l, snapGrid, 4);
  }

  const halfW = w / 2;
  const halfH = h / 2;
  const halfL = l / 2;

  const doorMap = { North: null, South: null, East: null, West: null };
  if (Array.isArray(doors)) {
    for (const d of doors) {
      if (doorMap.hasOwnProperty(d.wall)) {
        doorMap[d.wall] = {
          width: d.width || 6,
          height: d.height || 9,
          offset: d.offset || 0,
          tag: d.tag || null,
        };
      }
    }
  }

  const tagsJson = JSON.stringify(tags || []);
  const attrJson = JSON.stringify(attributes || {});

  return `
local CollectionService = game:GetService("CollectionService")

local function buildHollowBox()
    -- Resolver jerarquía de carpetas
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

    -- Asignar tags al modelo principal
    for _, t in ipairs(${tagsJson}) do
        CollectionService:AddTag(model, t)
    end
    for k, v in pairs(${attrJson}) do
        model:SetAttribute(k, v)
    end

    local function makePart(pName, pSize, pCFrame, colorRgb, pMaterial)
        local p = Instance.new("Part", model)
        p.Name = pName
        p.Anchored = true
        p.CanCollide = true
        p.TopSurface = Enum.TopSurfaceType.Smooth
        p.BottomSurface = Enum.BottomSurfaceType.Smooth
        p.Size = pSize
        p.CFrame = pCFrame
        p.Color = Color3.fromRGB(colorRgb[1], colorRgb[2], colorRgb[3])
        pcall(function()
            p.Material = Enum.Material[pMaterial or "${material}"] or Enum.Material.SmoothPlastic
        end)
        return p
    end

    local fCol = {${floorColor.join(",")}}
    local wCol = {${wallColor.join(",")}}
    local cCol = {${ceilingColor.join(",")}}

    -- 1. Suelo
    ${
      hasFloor
        ? `makePart("Floor", Vector3.new(${w}, 1, ${l}), CFrame.new(${cx}, ${cy} - 0.5, ${cz}), fCol, "${material}")`
        : ""
    }

    -- 2. Techo
    ${
      hasCeiling
        ? `makePart("Ceiling", Vector3.new(${w}, 1, ${l}), CFrame.new(${cx}, ${cy} + ${h} + 0.5, ${cz}), cCol, "${material}")`
        : ""
    }

    -- 3. Paredes eje Z (North / South)
    local function buildWallZ(wallName, centerZ, door)
        if not door then
            makePart(wallName, Vector3.new(${w}, ${h}, ${wallThickness}), CFrame.new(${cx}, ${cy} + ${halfH}, centerZ), wCol)
        else
            local dW = math.clamp(door.width, 4, ${w} - 4)
            local dH = math.clamp(door.height, 6, ${h} - 1)
            local off = math.clamp(door.offset, -(${w} - dW)/2 + 2, (${w} - dW)/2 - 2)

            local leftW = (${w} / 2) + off - (dW / 2)
            local leftX = ${cx} - ${halfW} + (leftW / 2)
            if leftW > 0.5 then
                makePart(wallName .. "_Left", Vector3.new(leftW, ${h}, ${wallThickness}), CFrame.new(leftX, ${cy} + ${halfH}, centerZ), wCol)
            end

            local rightW = (${w} / 2) - off - (dW / 2)
            local rightX = ${cx} + ${halfW} - (rightW / 2)
            if rightW > 0.5 then
                makePart(wallName .. "_Right", Vector3.new(rightW, ${h}, ${wallThickness}), CFrame.new(rightX, ${cy} + ${halfH}, centerZ), wCol)
            end

            local lintelH = ${h} - dH
            local lintelY = ${cy} + dH + (lintelH / 2)
            local lintel = makePart(wallName .. "_Lintel", Vector3.new(dW, lintelH, ${wallThickness}), CFrame.new(${cx} + off, lintelY, centerZ), cCol)
            if door.tag then
                CollectionService:AddTag(lintel, door.tag)
            end
        end
    end

    -- 4. Paredes eje X (West / East)
    local function buildWallX(wallName, centerX, door)
        if not door then
            makePart(wallName, Vector3.new(${wallThickness}, ${h}, ${l}), CFrame.new(centerX, ${cy} + ${halfH}, ${cz}), wCol)
        else
            local dW = math.clamp(door.width, 4, ${l} - 4)
            local dH = math.clamp(door.height, 6, ${h} - 1)
            local off = math.clamp(door.offset, -(${l} - dW)/2 + 2, (${l} - dW)/2 - 2)

            local seg1L = (${l} / 2) + off - (dW / 2)
            local seg1Z = ${cz} - ${halfL} + (seg1L / 2)
            if seg1L > 0.5 then
                makePart(wallName .. "_Seg1", Vector3.new(${wallThickness}, ${h}, seg1L), CFrame.new(centerX, ${cy} + ${halfH}, seg1Z), wCol)
            end

            local seg2L = (${l} / 2) - off - (dW / 2)
            local seg2Z = ${cz} + ${halfL} - (seg2L / 2)
            if seg2L > 0.5 then
                makePart(wallName .. "_Seg2", Vector3.new(${wallThickness}, ${h}, seg2L), CFrame.new(centerX, ${cy} + ${halfH}, seg2Z), wCol)
            end

            local lintelH = ${h} - dH
            local lintelY = ${cy} + dH + (lintelH / 2)
            local lintel = makePart(wallName .. "_Lintel", Vector3.new(${wallThickness}, lintelH, dW), CFrame.new(centerX, lintelY, ${cz} + off), cCol)
            if door.tag then
                CollectionService:AddTag(lintel, door.tag)
            end
        end
    end

    buildWallZ("Wall_North", ${cz} - ${halfL} + ${wallThickness}/2, ${doorMap.North ? JSON.stringify(doorMap.North) : "nil"})
    buildWallZ("Wall_South", ${cz} + ${halfL} - ${wallThickness}/2, ${doorMap.South ? JSON.stringify(doorMap.South) : "nil"})
    buildWallX("Wall_West", ${cx} - ${halfW} + ${wallThickness}/2, ${doorMap.West ? JSON.stringify(doorMap.West) : "nil"})
    buildWallX("Wall_East", ${cx} + ${halfW} - ${wallThickness}/2, ${doorMap.East ? JSON.stringify(doorMap.East) : "nil"})
end

buildHollowBox()
`;
}
