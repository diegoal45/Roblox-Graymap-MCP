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

import { generateRoomLuau } from "./generators/room.js";
import { generateStairsLuau } from "./generators/stairs.js";
import { generateCoverLuau } from "./generators/cover.js";
import { generateArenaLuau } from "./generators/arena.js";
import { METRICS } from "./generators/palette.js";

// Iniciar el servidor local HTTP que escucha a Roblox Studio
startBridge();

const server = new Server(
  {
    name: "roblox-graybox-mcp",
    version: "1.0.0",
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
        name: "create_room",
        description: "Construye una habitación graybox con piso, 4 paredes y vanos de puertas transitables opcionales.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", default: "Room", description: "Nombre del modelo en el explorador" },
            x: { type: "number", description: "Posición central X" },
            y: { type: "number", description: "Altura base Y del suelo", default: 0 },
            z: { type: "number", description: "Posición central Z" },
            width: { type: "number", description: "Ancho en el eje X (studs)", default: 30 },
            length: { type: "number", description: "Largo en el eje Z (studs)", default: 30 },
            height: { type: "number", description: "Altura de las paredes (studs)", default: 12 },
            wallThickness: { type: "number", description: "Grosor de paredes (studs)", default: 1 },
            hasCeiling: { type: "boolean", description: "Si debe incluir techo", default: false },
            doors: {
              type: "array",
              description: "Puertas con vano transitable en paredes específicas",
              items: {
                type: "object",
                properties: {
                  wall: { type: "string", enum: ["North", "South", "East", "West"] },
                  width: { type: "number", default: 6, description: "Ancho del vano (mínimo 4)" },
                  height: { type: "number", default: 8.5, description: "Alto del vano (mínimo 7)" },
                  offset: { type: "number", default: 0, description: "Desplazamiento desde el centro" },
                },
                required: ["wall"],
              },
            },
          },
          required: ["x", "y", "z"],
        },
      },
      {
        name: "create_stairs",
        description: "Construye escaleras transitables por el avatar de Roblox (altura de peldaño calibrada <= 1.1 studs).",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", default: "Stairs" },
            startX: { type: "number" },
            startY: { type: "number" },
            startZ: { type: "number" },
            width: { type: "number", default: 6, description: "Ancho de la escalera" },
            totalHeight: { type: "number", default: 10, description: "Altura total a subir" },
            stepDepth: { type: "number", default: 2.0, description: "Profundidad de cada huella de escalón" },
            direction: { type: "string", enum: ["+Z", "-Z", "+X", "-X"], default: "+Z" },
            includeTopPlatform: { type: "boolean", default: true, description: "Incluir descanso en la cima" },
            topPlatformLength: { type: "number", default: 6 },
          },
          required: ["startX", "startY", "startZ", "totalHeight"],
        },
      },
      {
        name: "place_cover",
        description: "Coloca coberturas tácticas calibradas para combate (baja 3 studs, alta 6.5 studs, esquinas en L o columnas).",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", default: "Cover" },
            x: { type: "number" },
            y: { type: "number" },
            z: { type: "number" },
            type: {
              type: "string",
              enum: ["low", "high", "l_shape", "pillar"],
              default: "low",
              description: "low = 3 studs (agachado), high = 6.5 studs (pie), l_shape = esquina, pillar = columna",
            },
            length: { type: "number", default: 8, description: "Largo de la cobertura" },
            thickness: { type: "number", default: 1.5 },
            rotationY: { type: "number", default: 0, description: "Rotación sobre eje Y en grados" },
          },
          required: ["x", "y", "z"],
        },
      },
      {
        name: "generate_arena",
        description: "Genera una arena táctica completa simétrica de 3 carriles con spawns, coberturas y plataforma central.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", default: "TacticalArena" },
            centerX: { type: "number", default: 0 },
            centerY: { type: "number", default: 0 },
            centerZ: { type: "number", default: 0 },
            sizeX: { type: "number", default: 80, description: "Dimensión X (ancho)" },
            sizeZ: { type: "number", default: 80, description: "Dimensión Z (largo)" },
            wallHeight: { type: "number", default: 14 },
            includeCentralPlatform: { type: "boolean", default: true },
          },
        },
      },
      {
        name: "clear_graybox",
        description: "Elimina la carpeta Workspace.Graybox y todo su contenido en Roblox Studio.",
        inputSchema: {
          type: "object",
          properties: {},
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
              text: `🟢 Roblox Studio está CONECTADO y respondiendo (último ping hace ${status.lastHeartbeatSecondsAgo}s). Puedes generar graybox.`,
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
                "Pasos para conectar:\n" +
                "1. Abre Roblox Studio.\n" +
                "2. Asegúrate de activar 'Allow HTTP Requests' en Game Settings > Security.\n" +
                "3. Instala y activa el plugin 'GrayboxBridge.server.luau'.",
            },
          ],
        };
      }
    }

    if (name === "clear_graybox") {
      const luau = `
        local g = workspace:FindFirstChild("Graybox")
        if g then
            g:Destroy()
            print("[Graybox] Carpeta Graybox eliminada.")
        end
      `;
      await sendToRoblox(luau, "Clear Graybox");
      return {
        content: [{ type: "text", text: "✅ Carpeta Workspace.Graybox eliminada exitosamente en Roblox Studio." }],
      };
    }

    if (name === "create_room") {
      const luau = generateRoomLuau(args);
      await sendToRoblox(luau, `Create Room ${args.name || "Room"}`);
      return {
        content: [
          {
            type: "text",
            text: `✅ Habitación '${args.name || "Room"}' (${args.width || 30}x${args.length || 30}x${args.height || 12} studs) construida en (${args.x}, ${args.y || 0}, ${args.z}) con ${args.doors ? args.doors.length : 0} vanos de puerta.`,
          },
        ],
      };
    }

    if (name === "create_stairs") {
      const luau = generateStairsLuau(args);
      await sendToRoblox(luau, `Create Stairs ${args.name || "Stairs"}`);
      return {
        content: [
          {
            type: "text",
            text: `✅ Escalera construida desde (${args.startX}, ${args.startY}, ${args.startZ}) subiendo ${args.totalHeight} studs en dirección ${args.direction || "+Z"}. Los escalones están calibrados para ser transitables sin salto.`,
          },
        ],
      };
    }

    if (name === "place_cover") {
      const luau = generateCoverLuau(args);
      await sendToRoblox(luau, `Place Cover ${args.type || "low"}`);
      return {
        content: [
          {
            type: "text",
            text: `✅ Cobertura tipo '${args.type || "low"}' colocada en (${args.x}, ${args.y}, ${args.z}).`,
          },
        ],
      };
    }

    if (name === "generate_arena") {
      const luau = generateArenaLuau(args);
      await sendToRoblox(luau, `Generate Arena ${args.name || "TacticalArena"}`);
      return {
        content: [
          {
            type: "text",
            text: `✅ Arena táctica '${args.name || "TacticalArena"}' (${args.sizeX || 80}x${args.sizeZ || 80} studs) generada con éxito: perímetro, zonas de spawn Norte/Sur, plataforma central elevada con rampas y carriles de flanqueo con coberturas.`,
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
            text: `✅ Código Luau ejecutado exitosamente en Roblox Studio bajo la acción '${args.actionName || "Raw Luau Execution"}'.`,
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
