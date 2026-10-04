import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import {
  startBridge,
  sendToRoblox,
  isStudioConnected,
  getStudioStatusInfo,
} from "./bridge.js";

import { generateBatchLuau } from "./generators/batch.js";
import { generateHollowBoxLuau } from "./generators/hollowBox.js";
import { generateWedgeLuau, generateTrussLuau } from "./generators/geometry.js";
import { generateRoomLuau } from "./generators/room.js";
import { generateStairsLuau } from "./generators/stairs.js";
import { generateCoverLuau } from "./generators/cover.js";
import { generateArenaLuau } from "./generators/arena.js";

// Iniciar servidor local HTTP que conecta con Roblox Studio
startBridge();

const server = new Server(
  {
    name: "roblox-graybox-mcp",
    version: "2.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "check_studio_connection",
        description: "Comprueba si Roblox Studio está abierto y si el plugin GrayboxBridge está conectado al MCP.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "get_workspace_layout",
        description:
          "FEEDBACK LOOP: Lee la jerarquía, bounding boxes, posiciones y tags de objetos existentes en Workspace o en una subcarpeta (ej. 'Graybox/Downtown' o 'Favela'). Permite saber qué hay construido antes de generar nuevas partes para evitar solapamientos.",
        inputSchema: {
          type: "object",
          properties: {
            folder_path: {
              type: "string",
              description: "Ruta en Workspace a inspeccionar (ej: 'Graybox', 'Graybox/Downtown', 'Favela', o vacío para Workspace completo)",
              default: "Graybox",
            },
            max_depth: {
              type: "number",
              description: "Profundidad máxima de recursión en el árbol de instancias",
              default: 3,
            },
          },
        },
      },
      {
        name: "build_structure",
        description:
          "BATCHING MASIVO: Instancia un lote completo de decenas o cientos de objetos (Bloques, Cuñas, Truss, Cilindros) en un solo mensaje de red con jerarquías (parent), ajuste a rejilla (snap to grid), tags de CollectionService y atributos de juego.",
        inputSchema: {
          type: "object",
          properties: {
            action_name: { type: "string", default: "Build City District Batch" },
            default_parent: {
              type: "string",
              description: "Carpeta jerárquica por defecto en Workspace (ej: 'City/Downtown/District_A' o 'Favela/Sector_1')",
              default: "Graybox/City",
            },
            snap_grid: {
              type: "number",
              description: "Forzar posiciones y dimensiones X/Z a múltiplos de 4 u 8 studs (estándar Roblox)",
              default: 4,
            },
            parts_list: {
              type: "array",
              description: "Lista de objetos a construir en lote",
              items: {
                type: "object",
                properties: {
                  shape: {
                    type: "string",
                    enum: ["Block", "Wedge", "CornerWedge", "Truss", "Cylinder", "Sphere"],
                    default: "Block",
                  },
                  name: { type: "string", default: "Building_Part" },
                  position: {
                    type: "array",
                    items: { type: "number" },
                    description: "[X, Y, Z] en studs",
                  },
                  size: {
                    type: "array",
                    items: { type: "number" },
                    description: "[ancho X, alto Y, largo Z] en studs",
                  },
                  rotation: {
                    type: "array",
                    items: { type: "number" },
                    description: "[RotX, RotY, RotZ] en grados",
                  },
                  color: {
                    type: "array",
                    items: { type: "number" },
                    description: "[R, G, B] entre 0 y 255",
                  },
                  material: {
                    type: "string",
                    enum: ["SmoothPlastic", "Concrete", "Brick", "Metal", "CorrugatedMetal", "WoodPlanks", "Cobblestone", "Neon"],
                    default: "SmoothPlastic",
                  },
                  transparency: { type: "number", default: 0 },
                  canCollide: { type: "boolean", default: true },
                  anchored: { type: "boolean", default: true },
                  parent: {
                    type: "string",
                    description: "Ruta de carpeta relativa o absoluta (ej: 'Favela_Territory_A/House_01')",
                  },
                  tags: {
                    type: "array",
                    items: { type: "string" },
                    description: "Etiquetas de CollectionService (ej: ['Spawn_Coche', 'Zona_Captura', 'No_Escalable', 'Heist_Target'])",
                  },
                  attributes: {
                    type: "object",
                    description: "Diccionario de atributos de juego (ej: {'Territory': 'Ballas', 'Health': 500})",
                  },
                },
                required: ["position", "size"],
              },
            },
          },
          required: ["parts_list"],
        },
      },
      {
        name: "set_hollow_box",
        description:
          "EDIFICIO / HABITACIÓN HUECA: Crea automáticamente una estructura completa (suelo, techo y 4 paredes) en un solo comando paramétrico para interiores de Bancos, Talleres, Comisarías o Tiendas.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", default: "Bank_Building" },
            position: {
              type: "array",
              items: { type: "number" },
              description: "[X, Y, Z] del centro del suelo",
            },
            size: {
              type: "array",
              items: { type: "number" },
              description: "[ancho X, alto Y, largo Z] en studs",
              default: [40, 16, 40],
            },
            wall_thickness: { type: "number", default: 1.5 },
            has_floor: { type: "boolean", default: true },
            has_ceiling: { type: "boolean", default: true },
            parent: {
              type: "string",
              description: "Carpeta jerárquica (ej: 'Downtown/District_A/Bank')",
              default: "Graybox/Downtown/Bank",
            },
            doors: {
              type: "array",
              description: "Vanos de puerta con corte y dintel automático",
              items: {
                type: "object",
                properties: {
                  wall: { type: "string", enum: ["North", "South", "East", "West"] },
                  width: { type: "number", default: 6 },
                  height: { type: "number", default: 9 },
                  offset: { type: "number", default: 0 },
                  tag: { type: "string", description: "Tag para el vano (ej: 'Heist_Target' o 'Door_Front')" },
                },
                required: ["wall"],
              },
            },
            tags: {
              type: "array",
              items: { type: "string" },
              description: "Tags para el modelo del edificio",
            },
            attributes: {
              type: "object",
              description: "Atributos de juego (ej: {'Territory': 'Downtown', 'Robbable': true})",
            },
            snap_grid: { type: "number", default: 4 },
          },
          required: ["position", "size"],
        },
      },
      {
        name: "spawn_wedge",
        description:
          "RAMPAS Y CALLES EMPINADAS (WedgePart): Genera cuñas indispensables para rampas de autopistas, calles inclinadas de montaña y tejados.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", default: "Highway_Ramp" },
            position: { type: "array", items: { type: "number" }, description: "[X, Y, Z]" },
            size: { type: "array", items: { type: "number" }, description: "[ancho X, alto Y, largo Z]" },
            rotation: { type: "array", items: { type: "number" }, description: "[RotX, RotY, RotZ] en grados" },
            color: { type: "array", items: { type: "number" }, default: [100, 100, 105] },
            material: { type: "string", default: "Concrete" },
            parent: { type: "string", default: "Graybox/Highways" },
            tags: { type: "array", items: { type: "string" }, default: ["Road_Ramp"] },
            attributes: { type: "object" },
            snap_grid: { type: "number", default: 4 },
          },
          required: ["position", "size"],
        },
      },
      {
        name: "spawn_truss",
        description:
          "ESCALERAS TÉCNICAS (TrussPart): Genera andamios y escaleras verticales de cuadrícula escalables por el avatar de Roblox. Vitales para pasadizos rápidos de favela y salidas de emergencia.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", default: "Favela_Ladder" },
            position: { type: "array", items: { type: "number" }, description: "[X, Y, Z]" },
            height: { type: "number", default: 16, description: "Altura vertical del truss" },
            rotation_y: { type: "number", default: 0 },
            parent: { type: "string", default: "Graybox/Favela/Scaffolds" },
            tags: { type: "array", items: { type: "string" }, default: ["Climbable_Truss"] },
            attributes: { type: "object" },
            snap_grid: { type: "number", default: 4 },
          },
          required: ["position"],
        },
      },
      {
        name: "add_tags_and_attributes",
        description:
          "ETIQUETADO EN MASA: Asigna tags de CollectionService y atributos de juego a instancias ya existentes en Roblox Studio por nombre o ruta de carpeta.",
        inputSchema: {
          type: "object",
          properties: {
            target_path: { type: "string", description: "Ruta en Workspace (ej: 'Favela_Territory_A' o 'Downtown/Bank')" },
            tags: { type: "array", items: { type: "string" }, description: "Tags a añadir" },
            attributes: { type: "object", description: "Atributos a asignar" },
            recursive: { type: "boolean", default: true, description: "Si debe aplicarse a todos los hijos y partes dentro" },
          },
          required: ["target_path"],
        },
      },
      {
        name: "clear_folder",
        description: "Elimina una carpeta específica de Workspace (ej: 'Graybox/Favela') o todo 'Graybox'.",
        inputSchema: {
          type: "object",
          properties: {
            folder_path: { type: "string", default: "Graybox", description: "Ruta de la carpeta a eliminar" },
          },
        },
      },
      {
        name: "create_stairs",
        description: "Construye escaleras transitables por el avatar de Roblox (altura de peldaño <= 1.1 studs).",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", default: "Stairs" },
            startX: { type: "number" },
            startY: { type: "number" },
            startZ: { type: "number" },
            width: { type: "number", default: 6 },
            totalHeight: { type: "number", default: 10 },
            stepDepth: { type: "number", default: 2.0 },
            direction: { type: "string", enum: ["+Z", "-Z", "+X", "-X"], default: "+Z" },
            includeTopPlatform: { type: "boolean", default: true },
            topPlatformLength: { type: "number", default: 6 },
          },
          required: ["startX", "startY", "startZ", "totalHeight"],
        },
      },
      {
        name: "execute_raw_luau",
        description: "Ejecuta cualquier código Luau arbitrario en Roblox Studio con soporte Undo/Redo (Ctrl+Z).",
        inputSchema: {
          type: "object",
          properties: {
            code: { type: "string", description: "Código Luau a ejecutar" },
            actionName: { type: "string", default: "Custom Luau Execution" },
          },
          required: ["code"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  try {
    if (name === "check_studio_connection") {
      const status = getStudioStatusInfo();
      if (status.connected) {
        return {
          content: [
            {
              type: "text",
              text: `🟢 Roblox Studio está CONECTADO y respondiendo (último ping hace ${status.lastHeartbeatSecondsAgo}s).`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: "text",
              text:
                "🔴 Roblox Studio NO está conectado al bridge actualmente.\n" +
                "1. Abre Roblox Studio.\n" +
                "2. Confirma que el plugin 'Graybox City MCP' esté activo.\n" +
                "3. Asegúrate de tener 'Allow HTTP Requests' en Game Settings > Security.",
            },
          ],
        };
      }
    }

    if (name === "get_workspace_layout") {
      const folderPath = args.folder_path || "Graybox";
      const maxDepth = args.max_depth || 3;

      const result = await sendToRoblox(
        "",
        "Inspect Workspace Layout",
        {
          type: "get_layout",
          folder_path: folderPath,
          max_depth: maxDepth,
        },
        20000
      );

      const layoutData = result.data || {};
      return {
        content: [
          {
            type: "text",
            text: `📋 Layout de Workspace obtenido para '${folderPath}':\n\n\`\`\`json\n${JSON.stringify(layoutData, null, 2)}\n\`\`\``,
          },
        ],
      };
    }

    if (name === "build_structure") {
      const partsList = args.parts_list || [];
      const snapGrid = args.snap_grid ?? 4;
      const defaultParent = args.default_parent || "Graybox/City";
      const actionName = args.action_name || `Build Batch (${partsList.length} parts)`;

      const luau = generateBatchLuau({
        parts_list: partsList,
        defaultParent,
        snapGrid,
      });

      await sendToRoblox(luau, actionName, {}, 30000);

      return {
        content: [
          {
            type: "text",
            text: `✅ Lote de ${partsList.length} objetos instanciado con éxito en Roblox Studio.\n- Jerarquía destino: '${defaultParent}'\n- Rejilla (Snap): ${snapGrid > 0 ? snapGrid + " studs" : "Desactivado"}\n- Soporte Ctrl+Z registrado como '${actionName}'.`,
          },
        ],
      };
    }

    if (name === "set_hollow_box") {
      const luau = generateHollowBoxLuau({
        name: args.name || "Building_Interior",
        position: args.position,
        size: args.size,
        wallThickness: args.wall_thickness ?? 1.5,
        hasFloor: args.has_floor ?? true,
        hasCeiling: args.has_ceiling ?? true,
        doors: args.doors || [],
        parent: args.parent || "Graybox/Downtown/Bank",
        tags: args.tags || [],
        attributes: args.attributes || {},
        snapGrid: args.snap_grid ?? 4,
      });

      await sendToRoblox(luau, `Set Hollow Box ${args.name || "Building"}`);

      return {
        content: [
          {
            type: "text",
            text: `✅ Edificio hueco '${args.name || "Building"}' (${args.size ? args.size.join("x") : ""} studs) construido en '${args.parent || "Graybox"}' con suelo, techo, paredes y ${args.doors ? args.doors.length : 0} vanos de puerta.`,
          },
        ],
      };
    }

    if (name === "spawn_wedge") {
      const luau = generateWedgeLuau({
        name: args.name || "Highway_Ramp",
        position: args.position,
        size: args.size,
        rotation: args.rotation || [0, 0, 0],
        color: args.color || [100, 100, 105],
        material: args.material || "Concrete",
        parent: args.parent || "Graybox/Highways",
        tags: args.tags || ["Road_Ramp"],
        attributes: args.attributes || {},
        snapGrid: args.snap_grid ?? 4,
      });

      await sendToRoblox(luau, `Spawn Wedge ${args.name || "Ramp"}`);

      return {
        content: [
          {
            type: "text",
            text: `✅ Cuña/Rampa (WedgePart) '${args.name || "Highway_Ramp"}' generada en '${args.parent || "Graybox/Highways"}'.`,
          },
        ],
      };
    }

    if (name === "spawn_truss") {
      const luau = generateTrussLuau({
        name: args.name || "Favela_Ladder",
        position: args.position,
        height: args.height ?? 16,
        rotationY: args.rotation_y ?? 0,
        parent: args.parent || "Graybox/Favela/Scaffolds",
        tags: args.tags || ["Climbable_Truss"],
        attributes: args.attributes || {},
        snapGrid: args.snap_grid ?? 4,
      });

      await sendToRoblox(luau, `Spawn Truss ${args.name || "Ladder"}`);

      return {
        content: [
          {
            type: "text",
            text: `✅ Escalera técnica (TrussPart) de ${args.height ?? 16} studs generada en '${args.parent || "Graybox/Favela"}'.`,
          },
        ],
      };
    }

    if (name === "add_tags_and_attributes") {
      const targetPath = args.target_path;
      const tagsJson = JSON.stringify(args.tags || []);
      const attrJson = JSON.stringify(args.attributes || {});
      const recursive = args.recursive ?? true;

      const luau = `
        local CollectionService = game:GetService("CollectionService")
        local segments = string.split("${targetPath}", "/")
        local current = workspace
        for _, s in ipairs(segments) do
            if s ~= "" then
                current = current:FindFirstChild(s)
                if not current then break end
            end
        end

        if current then
            local function apply(inst)
                for _, t in ipairs(${tagsJson}) do
                    CollectionService:AddTag(inst, t)
                end
                for k, v in pairs(${attrJson}) do
                    inst:SetAttribute(k, v)
                end
            end

            apply(current)
            if ${recursive} then
                for _, desc in ipairs(current:GetDescendants()) do
                    apply(desc)
                end
            end
        else
            error("No se encontró el objetivo '${targetPath}' en Workspace.")
        end
      `;

      await sendToRoblox(luau, `Tag and Attribute ${targetPath}`);

      return {
        content: [
          {
            type: "text",
            text: `✅ Tags [${(args.tags || []).join(", ")}] y atributos asignados a '${targetPath}' exitosamente.`,
          },
        ],
      };
    }

    if (name === "clear_folder") {
      const folderPath = args.folder_path || "Graybox";
      const luau = `
        local segments = string.split("${folderPath}", "/")
        local current = workspace
        for _, s in ipairs(segments) do
            if s ~= "" then
                current = current:FindFirstChild(s)
                if not current then break end
            end
        end
        if current and current ~= workspace then
            current:Destroy()
            print("[Graybox] Eliminada carpeta: ${folderPath}")
        end
      `;
      await sendToRoblox(luau, `Clear Folder ${folderPath}`);
      return {
        content: [{ type: "text", text: `✅ Carpeta '${folderPath}' eliminada exitosamente en Workspace.` }],
      };
    }

    if (name === "create_stairs") {
      const luau = generateStairsLuau(args);
      await sendToRoblox(luau, `Create Stairs ${args.name || "Stairs"}`);
      return {
        content: [
          {
            type: "text",
            text: `✅ Escalera construida desde (${args.startX}, ${args.startY}, ${args.startZ}) subiendo ${args.totalHeight} studs en dirección ${args.direction || "+Z"}.`,
          },
        ],
      };
    }

    if (name === "execute_raw_luau") {
      await sendToRoblox(args.code, args.actionName || "Raw Luau Execution");
      return {
        content: [
          {
            type: "text",
            text: `✅ Código Luau ejecutado exitosamente en Roblox Studio bajo '${args.actionName || "Raw Luau Execution"}'.`,
          },
        ],
      };
    }

    throw new Error(`Herramienta no reconocida: ${name}`);
  } catch (err) {
    return {
      isError: true,
      content: [{ type: "text", text: `❌ Error: ${err.message}` }],
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
