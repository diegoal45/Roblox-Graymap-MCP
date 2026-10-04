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
import { generatePropLuau } from "./generators/props.js";
import { generateStreetLuau } from "./generators/street.js";
import {
  generateProceduralTerrainLuau,
  generateFlattenTerrainLuau,
  generateCarvePathLuau,
  generateShapeTerrainLuau,
  generatePaintTerrainLuau,
  generateClearTerrainLuau,
  generateWaterConfigLuau,
} from "./generators/terrain.js";
import { generateDetailedBuildingLuau } from "./generators/detailedBuilding.js";
import { generateDistrictLuau } from "./generators/district.js";
import { generateStreetFurnitureLuau } from "./generators/streetFurniture.js";
import { generateEnvironmentLuau } from "./generators/environment.js";
import { generateFavelaDistrictLuau } from "./generators/favela.js";
import { generatePlayableInteriorLuau } from "./generators/interior.js";
import { generateCurvedRoadLuau, generateIntersectionLuau } from "./generators/roadNetwork.js";
import { generateFoliageScatterLuau } from "./generators/scatter.js";
import { generateInteractiveSystemsLuau } from "./generators/interactive.js";
import { logEvent } from "./utils/logger.js";

// Iniciar servidor local HTTP que conecta con Roblox Studio
startBridge();

const server = new Server(
  {
    name: "roblox-graybox-mcp",
    version: "3.0.0",
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
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "inspect_area",
        description:
          "CONCIENCIA ESPACIAL: Consulta qué objetos o modelos existen alrededor de un punto (X, Y, Z) en un radio específico. Devuelve nombres, distancias y dimensiones de los edificios vecinos para saber cuánto espacio libre queda antes de construir.",
        inputSchema: {
          type: "object",
          properties: {
            position: {
              type: "array",
              items: { type: "number" },
              description: "[X, Y, Z] centro de la búsqueda",
            },
            radius: {
              type: "number",
              default: 50,
              description: "Radio de búsqueda en studs",
            },
            max_results: {
              type: "number",
              default: 15,
              description: "Cantidad máxima de objetos cercanos a reportar",
            },
          },
          required: ["position"],
        },
      },
      {
        name: "raycast_query",
        description:
          "DETECCIÓN DE SUELO (RAYCAST): Dispara un rayo desde un origen hacia una dirección para consultar '¿Qué hay debajo o delante de este punto?'. Devuelve la altura exacta del suelo, material y normal de la superficie para asegurar que los edificios toquen el terreno sin flotar ni enterrarse.",
        inputSchema: {
          type: "object",
          properties: {
            origin: {
              type: "array",
              items: { type: "number" },
              description: "[X, Y, Z] punto de origen del rayo",
            },
            direction: {
              type: "array",
              items: { type: "number" },
              default: [0, -1, 0],
              description: "[DX, DY, DZ] vector unitario de dirección (defecto hacia abajo [0, -1, 0])",
            },
            distance: {
              type: "number",
              default: 150,
              description: "Distancia máxima de alcance del rayo en studs",
            },
          },
          required: ["origin"],
        },
      },
      {
        name: "get_workspace_layout",
        description:
          "FEEDBACK LOOP: Lee la jerarquía, bounding boxes, posiciones y tags de objetos existentes en Workspace o en una subcarpeta (ej. 'City/Downtown').",
        inputSchema: {
          type: "object",
          properties: {
            folder_path: {
              type: "string",
              description: "Ruta en Workspace a inspeccionar (ej: 'City/Downtown' o 'Graybox')",
              default: "City",
            },
            max_depth: {
              type: "number",
              default: 3,
            },
          },
        },
      },
      {
        name: "build_structure",
        description:
          "BATCHING MASIVO + PERFORMANCE SHIELD: Instancia un lote completo de decenas o cientos de objetos con poda automática de colisiones (CanTouch = false) y LOD StreamingMesh para 50+ jugadores sin lag.",
        inputSchema: {
          type: "object",
          properties: {
            action_name: { type: "string", default: "Build City District Batch" },
            default_parent: { type: "string", default: "City/Downtown" },
            snap_grid: { type: "number", default: 4 },
            auto_optimize: { type: "boolean", default: true },
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
                  name: { type: "string", default: "Part" },
                  position: { type: "array", items: { type: "number" } },
                  size: { type: "array", items: { type: "number" } },
                  rotation: { type: "array", items: { type: "number" } },
                  color: { type: "array", items: { type: "number" } },
                  material: { type: "string", default: "SmoothPlastic" },
                  transparency: { type: "number", default: 0 },
                  canCollide: { type: "boolean", default: true },
                  anchored: { type: "boolean", default: true },
                  parent: { type: "string" },
                  tags: { type: "array", items: { type: "string" } },
                  attributes: { type: "object" },
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
          "EDIFICIO PROFESIONAL CON DETALLES: Crea una estructura hueca completa con cornisas de tejado (parapeto 1.5 studs), zócalos exteriores, luz interior automática (PointLight cálida) y vanos de puerta transitables con dintel.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", default: "Building" },
            position: { type: "array", items: { type: "number" } },
            size: { type: "array", items: { type: "number" }, default: [40, 16, 40] },
            wall_thickness: { type: "number", default: 1.5 },
            has_floor: { type: "boolean", default: true },
            has_ceiling: { type: "boolean", default: true },
            include_parapet: { type: "boolean", default: true, description: "Cornisa de tejado (1.5 studs) para cobertura en azotea" },
            include_lighting: { type: "boolean", default: true, description: "Luz PointLight suave en el techo" },
            include_baseboard: { type: "boolean", default: true, description: "Rodapié exterior de 0.6 studs" },
            parent: { type: "string", default: "City/Downtown" },
            doors: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  wall: { type: "string", enum: ["North", "South", "East", "West"] },
                  width: { type: "number", default: 6 },
                  height: { type: "number", default: 9 },
                  offset: { type: "number", default: 0 },
                  tag: { type: "string" },
                },
                required: ["wall"],
              },
            },
            tags: { type: "array", items: { type: "string" } },
            attributes: { type: "object" },
            snap_grid: { type: "number", default: 4 },
          },
          required: ["position", "size"],
        },
      },
      {
        name: "create_street",
        description:
          "VÍA URBANA COMPLETA: Genera una calle o avenida con asfalto rebajado, aceras peatonales elevadas a los costados, líneas viales centrales amarillas y farolas de calle (Street Lamps) con iluminación real.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", default: "Main_Avenue" },
            start_position: { type: "array", items: { type: "number" }, description: "[X, Y, Z] inicio" },
            end_position: { type: "array", items: { type: "number" }, description: "[X, Y, Z] fin" },
            road_width: { type: "number", default: 24, description: "Ancho de calzada (24 studs = 2 carriles)" },
            sidewalk_width: { type: "number", default: 6, description: "Ancho de acera a cada lado" },
            has_lanes: { type: "boolean", default: true, description: "Líneas amarillas divisorias" },
            has_sidewalks: { type: "boolean", default: true, description: "Aceras elevadas a los costados" },
            has_lamps: { type: "boolean", default: true, description: "Farolas de calle con luces activas" },
            lamp_interval: { type: "number", default: 48, description: "Separación en studs entre farolas" },
            parent: { type: "string", default: "City/Streets" },
          },
          required: ["start_position", "end_position"],
        },
      },
      {
        name: "spawn_prop",
        description:
          "MOBILIARIO Y PROPS TÁCTICOS LOWPOLY: Genera muebles y atrezzo funcional para interiores de bancos, talleres y calles (counter, desk, shelf, dumpster, barrier, street_lamp, dummy).",
        inputSchema: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["counter", "desk", "shelf", "dumpster", "barrier", "street_lamp", "dummy"],
              description: "counter = mostrador recepción/tienda (3 studs), desk = escritorio oficina, shelf = estantería almacén (8 studs), dumpster = contenedor basura, barrier = barrera jersey concreto, street_lamp = farola calle, dummy = maniquí escala humana R15 (5 studs)",
            },
            name: { type: "string" },
            position: { type: "array", items: { type: "number" } },
            rotation_y: { type: "number", default: 0 },
            length: { type: "number", default: 8, description: "Longitud para mostradores, estanterías o barreras" },
            parent: { type: "string", default: "City/Props" },
            tags: { type: "array", items: { type: "string" } },
            attributes: { type: "object" },
            snap_grid: { type: "number", default: 4 },
          },
          required: ["type", "position"],
        },
      },
      {
        name: "spawn_wedge",
        description:
          "RAMPAS Y CALLES EMPINADAS (WedgePart): Genera cuñas para rampas de autopistas, calles inclinadas y tejados.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", default: "Highway_Ramp" },
            position: { type: "array", items: { type: "number" } },
            size: { type: "array", items: { type: "number" } },
            rotation: { type: "array", items: { type: "number" } },
            color: { type: "array", items: { type: "number" }, default: [100, 100, 105] },
            material: { type: "string", default: "Concrete" },
            parent: { type: "string", default: "City/Highways" },
            tags: { type: "array", items: { type: "string" } },
            attributes: { type: "object" },
            snap_grid: { type: "number", default: 4 },
          },
          required: ["position", "size"],
        },
      },
      {
        name: "spawn_truss",
        description:
          "ESCALERAS TÉCNICAS (TrussPart): Genera escaleras verticales escalables por el avatar.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", default: "Favela_Ladder" },
            position: { type: "array", items: { type: "number" } },
            height: { type: "number", default: 16 },
            rotation_y: { type: "number", default: 0 },
            parent: { type: "string", default: "City/Favela" },
            tags: { type: "array", items: { type: "string" } },
            attributes: { type: "object" },
            snap_grid: { type: "number", default: 4 },
          },
          required: ["position"],
        },
      },
      {
        name: "create_stairs",
        description: "Construye escaleras peatonales transitables (<= 1.1 studs por peldaño).",
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
        name: "add_tags_and_attributes",
        description: "Asigna tags de CollectionService y atributos a partes o modelos existentes en Studio.",
        inputSchema: {
          type: "object",
          properties: {
            target_path: { type: "string" },
            tags: { type: "array", items: { type: "string" } },
            attributes: { type: "object" },
            recursive: { type: "boolean", default: true },
          },
          required: ["target_path"],
        },
      },
      {
        name: "clear_folder",
        description: "Elimina una carpeta específica de Workspace o todo 'City' / 'Graybox'.",
        inputSchema: {
          type: "object",
          properties: {
            folder_path: { type: "string", default: "City" },
          },
        },
      },
      {
        name: "generate_terrain",
        description:
          "GENERADOR DE PAISAJES PROCEDURALES (ROBLOX SMOOTH TERRAIN): Genera paisajes naturales y biomas de alta fidelidad (montañas nevadas, colinas, cañones escalonados, llanuras, dunas desérticas, islas tropicales, valles fluviales, mesetas) con cálculo de pendientes, estratos geológicos y cuerpos de agua usando el motor nativo de voxeles de Roblox.",
        inputSchema: {
          type: "object",
          properties: {
            center: {
              type: "array",
              items: { type: "number" },
              default: [0, 0],
              description: "[X, Z] centro geográfico del terreno",
            },
            size: {
              type: "array",
              items: { type: "number" },
              default: [400, 400],
              description: "[ancho X, largo Z] dimensiones en studs",
            },
            biome: {
              type: "string",
              enum: [
                "mountains",
                "hills",
                "canyon",
                "plains",
                "dunes",
                "island",
                "river_valley",
                "plateau",
              ],
              default: "hills",
              description: "Tipo de bioma y perfil geomorfológico",
            },
            base_height: {
              type: "number",
              default: 0,
              description: "Cota de altura base (Y)",
            },
            height_amplitude: {
              type: "number",
              default: 60,
              description: "Elevación máxima en studs sobre base_height",
            },
            seed: {
              type: "number",
              default: 12345,
              description: "Semilla numérica determinista para reproducibilidad",
            },
            scale: {
              type: "number",
              default: 140,
              description: "Escala / frecuencia del relieve (studs por ciclo)",
            },
            octaves: {
              type: "number",
              default: 3,
              description: "Capas de ruido fractal (detalle de relieve)",
            },
            water_level: {
              type: "number",
              description: "Cota Y de agua (ej: 0 o -4). Las depresiones por debajo se llenan de agua y orillas de arena.",
            },
            resolution: {
              type: "number",
              default: 8,
              description: "Paso de voxel en studs (8 = óptimo rendimiento/detalle, 4 = hiperpreciso)",
            },
            clear_before_generate: {
              type: "boolean",
              default: false,
              description: "Si es true, limpia el volumen aéreo y terreno previo en el área antes de generar",
            },
            steep_slope_material: {
              type: "string",
              default: "Rock",
              description: "Material para laderas empinadas (Rock, Slate, Basalt)",
            },
            flat_material: {
              type: "string",
              default: "Grass",
              description: "Material para zonas llanas (Grass, LeafyGrass, Sand, Snow)",
            },
            under_material: {
              type: "string",
              default: "Ground",
              description: "Material de base subterránea",
            },
            beach_material: {
              type: "string",
              default: "Sand",
              description: "Material en bordes costeros de agua",
            },
            snow_cap_height: {
              type: "number",
              description: "Altura Y a partir de la cual las cimas se cubren de nieve (Snow)",
            },
          },
        },
      },
      {
        name: "flatten_terrain_area",
        description:
          "NIVELADO DE PARCELAS / CIMENTACIONES: Aplana y prepara el terreno con precisión milimétrica para asentar edificios, distritos, carreteras o plazas. Despeja el relieve superior con Air y rellena las depresiones inferiores con cimientos sólidos nivelados y taludes/muros perimetrales opcionales.",
        inputSchema: {
          type: "object",
          properties: {
            position: {
              type: "array",
              items: { type: "number" },
              description: "[X, Y, Z] centro de la explanada (Y es la cota exacta de suelo)",
            },
            size: {
              type: "array",
              items: { type: "number" },
              default: [80, 80],
              description: "[ancho X, fondo Z] dimensiones de la parcela",
            },
            material: {
              type: "string",
              default: "Concrete",
              description: "Material del suelo nivelado (Concrete, Pavement, Cobblestone, Grass, Dirt, Ground)",
            },
            foundation_depth: {
              type: "number",
              default: 16,
              description: "Profundidad de cimientos sólidos hacia abajo en studs",
            },
            clear_height: {
              type: "number",
              default: 50,
              description: "Altura libre despejada hacia arriba con Air",
            },
            blend_margin: {
              type: "number",
              default: 8,
              description: "Margen perimetral con talud de transición para evitar cortes abruptos",
            },
            retaining_wall: {
              type: "boolean",
              default: false,
              description: "Si es true, genera muros de contención de hormigón alrededor de los cortes",
            },
            wall_material: {
              type: "string",
              default: "Concrete",
            },
          },
          required: ["position"],
        },
      },
      {
        name: "carve_terrain_path",
        description:
          "TRAZADO DE CARRETERAS, TÚNELES, CANALES Y RÍOS: Abre rutas a través de montañas y valles en el terreno. Soporta 'road' (carretera a cielo abierto con despeje aéreo), 'tunnel' (túnel subterráneo abovedado que conserva la montaña superior intacta), 'river' (canal fluvial con lecho y agua) y 'trench' (trinchera/desfiladero).",
        inputSchema: {
          type: "object",
          properties: {
            start_point: {
              type: "array",
              items: { type: "number" },
              description: "[X, Y, Z] punto inicial",
            },
            end_point: {
              type: "array",
              items: { type: "number" },
              description: "[X, Y, Z] punto final",
            },
            waypoints: {
              type: "array",
              items: { type: "array", items: { type: "number" } },
              description: "Puntos intermedios para trazar curvas complejas",
            },
            width: {
              type: "number",
              default: 24,
              description: "Ancho del trazado en studs",
            },
            height: {
              type: "number",
              default: 18,
              description: "Altura libre vertical (túnel o despeje)",
            },
            mode: {
              type: "string",
              enum: ["road", "tunnel", "trench", "river"],
              default: "road",
              description: "Modo de trazado (road = carretera a cielo abierto, tunnel = subterráneo, river = río navegable, trench = desfiladero)",
            },
            surface_material: {
              type: "string",
              default: "Pavement",
              description: "Material de calzada o suelo (Pavement, Asphalt, Cobblestone, Water, Dirt)",
            },
            wall_material: {
              type: "string",
              default: "Rock",
              description: "Material para paredes laterales",
            },
          },
          required: ["start_point", "end_point"],
        },
      },
      {
        name: "shape_terrain",
        description:
          "ESCULPIDO PARAMÉTRICO DE TERRENO: Inserta o excava primitivas 3D (Block, Ball/Sphere, Cylinder, Wedge) directamente en el terreno de Roblox con cualquier material o excavación con Air.",
        inputSchema: {
          type: "object",
          properties: {
            shape: {
              type: "string",
              enum: ["Block", "Ball", "Cylinder", "Wedge"],
              default: "Block",
              description: "Primitiva geométrica de voxel",
            },
            operation: {
              type: "string",
              enum: ["add", "subtract"],
              default: "add",
              description: "add = depositar material, subtract = excavar / tallar con Air",
            },
            position: {
              type: "array",
              items: { type: "number" },
              description: "[X, Y, Z] posición central",
            },
            size: {
              type: "array",
              items: { type: "number" },
              description: "[X, Y, Z] dimensiones para Block y Wedge",
            },
            radius: {
              type: "number",
              default: 15,
              description: "Radio para Ball y Cylinder",
            },
            height: {
              type: "number",
              default: 20,
              description: "Longitud/altura para Cylinder",
            },
            rotation: {
              type: "array",
              items: { type: "number" },
              default: [0, 0, 0],
              description: "[RX, RY, RZ] rotación en grados",
            },
            material: {
              type: "string",
              default: "Rock",
              description: "Material de terreno (Grass, Rock, Sand, Snow, etc. - ignorado si subtract)",
            },
          },
          required: ["position"],
        },
      },
      {
        name: "paint_terrain_material",
        description:
          "PINTURA Y REEMPLAZO DE MATERIALES DE TERRENO: Modifica materiales de terreno en un volumen o sustituye un material por otro globalmente o por región usando la API nativa de Roblox Terrain:ReplaceMaterial.",
        inputSchema: {
          type: "object",
          properties: {
            mode: {
              type: "string",
              enum: ["replace", "box", "sphere"],
              default: "replace",
              description: "replace = sustitución nativa ReplaceMaterial, box = pintar caja, sphere = pintar esfera",
            },
            center: {
              type: "array",
              items: { type: "number" },
              default: [0, 0, 0],
              description: "[X, Y, Z] centro",
            },
            size: {
              type: "array",
              items: { type: "number" },
              default: [40, 40, 40],
              description: "[SX, SY, SZ] para caja o límites de región",
            },
            radius: {
              type: "number",
              default: 20,
              description: "Radio para modo sphere",
            },
            target_material: {
              type: "string",
              default: "Snow",
              description: "Material a pintar o material resultante",
            },
            source_material: {
              type: "string",
              default: "Grass",
              description: "Material a buscar y reemplazar (solo en modo replace)",
            },
            region_bounds: {
              type: "object",
              properties: {
                min: { type: "array", items: { type: "number" } },
                max: { type: "array", items: { type: "number" } },
              },
              description: "Límites manuales opcionales de Region3",
            },
          },
        },
      },
      {
        name: "clear_terrain",
        description:
          "LIMPIEZA DE TERRENO: Elimina todo el terreno del Workspace o una región específica con soporte completo para Deshacer (Ctrl + Z).",
        inputSchema: {
          type: "object",
          properties: {
            all: {
              type: "boolean",
              default: false,
              description: "Si es true, ejecuta Terrain:Clear() vaciando todo el terreno del mundo",
            },
            region_bounds: {
              type: "object",
              properties: {
                min: { type: "array", items: { type: "number" } },
                max: { type: "array", items: { type: "number" } },
              },
              description: "Bounding box { min: [X,Y,Z], max: [X,Y,Z] } para despejar solo una zona",
            },
          },
        },
      },
      {
        name: "configure_water",
        description:
          "CONFIGURACIÓN CINEMÁTICA DEL AGUA EN TERRENO: Ajusta las propiedades visuales y físicas del agua en workspace.Terrain (color RGB, reflectancia, transparencia, tamaño y velocidad de olas).",
        inputSchema: {
          type: "object",
          properties: {
            color: {
              type: "array",
              items: { type: "number" },
              default: [40, 120, 160],
              description: "[R, G, B] color del agua",
            },
            reflectance: {
              type: "number",
              default: 0.5,
              description: "Reflectancia de la superficie (0.0 a 1.0)",
            },
            transparency: {
              type: "number",
              default: 0.6,
              description: "Transparencia del agua (0.0 a 1.0)",
            },
            wave_size: {
              type: "number",
              default: 0.25,
              description: "Altura / tamaño de las olas (0.0 a 1.0)",
            },
            wave_speed: {
              type: "number",
              default: 12,
              description: "Velocidad de movimiento del oleaje",
            },
          },
        },
      },
      {
        name: "generate_district",
        description:
          "GENERADOR URBANO MACRO AAA: Genera una ciudad o distrito completo con calzadas de asfalto, bordillos de granito, pasos de cebra, aceras peatonales elevadas, subdivisión de manzanas en parcelas densas (sin huecos aleatorios), rascacielos/edificios multinivel con fachadas en relieve 3D, escaparates comerciales con toldos, mobiliario urbano (farolas con sombras, árboles en alcorques, bocas de incendio) y nivelado automático de terreno.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", default: "Downtown_District" },
            center: {
              type: "array",
              items: { type: "number" },
              default: [0, 0],
              description: "[X, Z] centro de la manzana/distrito",
            },
            size: {
              type: "array",
              items: { type: "number" },
              default: [240, 240],
              description: "[ancho X, largo Z] dimensiones en studs",
            },
            style: {
              type: "string",
              enum: [
                "modern_downtown",
                "classic_brick",
                "cyberpunk",
                "commercial_avenue",
                "industrial",
                "favela",
              ],
              default: "modern_downtown",
              description: "Estilo arquitectónico PBR y paleta visual AAA",
            },
            density: {
              type: "string",
              enum: ["high", "medium", "low", "mixed"],
              default: "high",
              description: "Densidad y altura de los edificios (high: 8-18 pisos, medium: 4-8 pisos, low: 2-4 pisos, mixed: rascacielos con casas)",
            },
            street_width: {
              type: "number",
              default: 28,
              description: "Ancho de las calzadas en studs",
            },
            sidewalk_width: {
              type: "number",
              default: 8,
              description: "Ancho de acera peatonal en studs",
            },
            seed: {
              type: "number",
              default: 54321,
              description: "Semilla determinista para variar colores de fachadas, toldos y alturas",
            },
            has_furniture: {
              type: "boolean",
              default: true,
              description: "Incluir farolas con sombras, árboles en alcorques, bancos y bocas de incendio",
            },
            has_plaza: {
              type: "boolean",
              default: true,
              description: "En manzanas 3x3, convierte la parcela central en una plaza peatonal monumental con fuente de agua",
            },
            align_to_terrain: {
              type: "boolean",
              default: true,
              description: "Nivela y cimenta automáticamente el terreno bajo el distrito para evitar que flote",
            },
              description: "Nivela y cimenta automáticamente el terreno bajo el distrito para evitar que flote",
            },
            parent: {
              type: "string",
              default: "City/Districts",
              description: "Carpeta de destino en Workspace",
            },
          },
        },
      },
      {
        name: "build_detailed_structure",
        description:
          "EDIFICIO ARQUITECTÓNICO MULTINIVEL AAA: Construye un edificio de alta fidelidad con zócalo plinto antisuspensión, planta baja comercial (escaparates de suelo a techo, portal remetido, toldos a 45° con WedgePart, rótulos comerciales iluminados), pisos superiores con cornisas divisorias, pilastras en relieve 3D, ventanas modulares con alféizar e iluminación interior realista, y azotea habitable con parapeto táctico, caseta de ascensor, HVAC, tanque de agua cilíndrico y antena con baliza roja.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", default: "Detailed_Building" },
            position: {
              type: "array",
              items: { type: "number" },
              description: "[X, Y, Z] posición central del edificio en la base",
            },
            footprint: {
              type: "array",
              items: { type: "number" },
              default: [40, 40],
              description: "[ancho X, fondo Z] huella en studs",
            },
            floors: {
              type: "number",
              default: 5,
              description: "Cantidad de pisos (cada piso añade 10 studs de altura)",
            },
            style: {
              type: "string",
              enum: [
                "modern_downtown",
                "classic_brick",
                "cyberpunk",
                "commercial_avenue",
                "industrial",
                "favela",
              ],
              default: "modern_downtown",
            },
            seed: {
              type: "number",
              default: 1234,
              description: "Semilla para alternar colores de fachada, toldos y ventanas iluminadas",
            },
            has_roof_props: {
              type: "boolean",
              default: true,
              description: "Incluir caseta de ascensor, HVAC doble ventilador, tanque de agua cilíndrico y antena con baliza roja",
            },
            has_balconies: {
              type: "boolean",
              default: true,
              description: "Incluir balcones en voladizo con barandillas en pisos superiores",
            },
            has_fire_escapes: {
              type: "boolean",
              description: "Incluir escalera de incendios exterior de acero tipo Manhattan (por defecto según estilo)",
            },
            has_sidewalk_dining: {
              type: "boolean",
              default: true,
              description: "Incluir mesas de velador, sillas de forja y jardineras en la acera frente al comercio",
            },
            has_setbacks: {
              type: "boolean",
              default: true,
              description: "Activar retranqueos volumétricos (setbacks) escalonados con terrazas en edificios de 6+ pisos",
            },
            parent: {
              type: "string",
              default: "City/Downtown",
            },
          },
          required: ["position"],
        },
      },
      {
        name: "setup_environment",
        description:
          "ATMÓSFERA Y POST-PROCESADO CINEMÁTICO: Configura iluminación de última generación Future Lighting, sombras globales suaves, atmósfera volumétrica (Atmosphere con densidad y niebla de color), efectos de post-procesamiento (BloomEffect, ColorCorrectionEffect, SunRaysEffect) y hora del día para transformar la estética del mapa a calidad AAA.",
        inputSchema: {
          type: "object",
          properties: {
            preset: {
              type: "string",
              enum: [
                "cyberpunk_night",
                "golden_hour",
                "overcast_fog",
                "sunny_noon",
                "rainy_noir",
              ],
              default: "golden_hour",
              description: "Preset atmosférico cinemático",
            },
            clock_time: {
              type: "number",
              description: "Hora del día en Roblox (0 a 24). Si se omite, usa la hora óptima del preset.",
            },
            enable_future_lighting: {
              type: "boolean",
              default: true,
              description: "Activa Technology = Future para sombras en tiempo real",
            },
            shadow_softness: {
              type: "number",
              default: 0.2,
              description: "Suavizado de sombras proyectadas",
            },
          },
        },
      },
      {
        name: "populate_street_furniture",
        description:
          "DRESSING Y MOBILIARIO URBANO DE ACERAS: Puebla las aceras de una calle o avenida con farolas metálicas con iluminación real y sombras, árboles frondosos en alcorques de fundición, bocas de incendio, bancos públicos peatonales y papeleras de calle.",
        inputSchema: {
          type: "object",
          properties: {
            center: {
              type: "array",
              items: { type: "number" },
              description: "[X, Y, Z] centro del tramo",
            },
            length: {
              type: "number",
              default: 120,
              description: "Longitud del tramo en studs",
            },
            orientation: {
              type: "string",
              enum: ["Z", "X"],
              default: "Z",
              description: "Orientación del eje de la calle ('Z' para calle Norte-Sur, 'X' para Este-Oeste)",
            },
            sidewalk_offset: {
              type: "number",
              default: 16,
              description: "Distancia desde el eje central de la calle hasta las aceras",
            },
            interval: {
              type: "number",
              default: 40,
              description: "Separación entre elementos de mobiliario en studs",
            },
            include_trees: { type: "boolean", default: true },
            include_lamps: { type: "boolean", default: true },
            include_benches: { type: "boolean", default: true },
            include_hydrants: { type: "boolean", default: true },
            parent: { type: "string", default: "City/Props" },
          },
          required: ["center"],
        },
      },
      {
        name: "generate_favela",
        description:
          "GENERADOR ORGÁNICO DE FAVELA / COMUNIDAD DE LADERA: Construye una favela densa y realista sobre la ladera de la montaña con terrazas escalonadas, callejones peatonales estrechos (vielas), escaleras transitables entre niveles, casas apiladas con voladizos de ladrillo y revoques de colores, caixas d'água azules, pasarelas aéreas de tablas entre azoteas, y postes con maraña de cables eléctricos.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", default: "Favela_Hillside" },
            center: {
              type: "array",
              items: { type: "number" },
              default: [0, 50, -800],
              description: "[X, Y, Z] posición base de la favela en la ladera",
            },
            size: {
              type: "array",
              items: { type: "number" },
              default: [180, 180],
              description: "[ancho X, profundidad Z] área de la comunidad",
            },
            slope_direction: {
              type: "string",
              enum: ["-Z", "+Z", "+X", "-X"],
              default: "-Z",
              description: "Dirección en la que asciende la montaña ('-Z' = hacia el Norte)",
            },
            elevation_gain: {
              type: "number",
              default: 70,
              description: "Desnivel vertical que escala la favela en studs",
            },
            seed: { type: "number", default: 7771 },
            has_overhead_cables: { type: "boolean", default: true, description: "Postes con maraña de cables aéreos" },
            has_footbridges: { type: "boolean", default: true, description: "Pasarelas de tablas entre azoteas" },
            parent: { type: "string", default: "City/Favela" },
          },
        },
      },
      {
        name: "create_playable_interior",
        description:
          "GENERADOR DE INTERIORES JUGABLES Y TRANSITABLES: Equipa edificios con cajas de escaleras continuas (stairwells) con hueco en el forjado para caminar de planta baja a azotea sin saltar, pasillos centrales, tabiques de habitaciones, puertas interactivas animadas con ProximityPrompt ('E') y TweenService, e iluminación y mobiliario temático (oficina, residencial, tienda o banco).",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", default: "Playable_Interior" },
            center: {
              type: "array",
              items: { type: "number" },
              description: "[X, Y, Z] centro de la base del edificio",
            },
            size: {
              type: "array",
              items: { type: "number" },
              default: [40, 10, 40],
              description: "[ancho X, altura por piso, fondo Z] en studs",
            },
            floors: {
              type: "number",
              default: 3,
              description: "Cantidad de pisos a amueblar y conectar con escaleras",
            },
            theme: {
              type: "string",
              enum: ["office", "residential", "store", "bank"],
              default: "office",
              description: "Temática y mobiliario interior",
            },
            has_stairs: { type: "boolean", default: true, description: "Caja de escaleras continua" },
            interactive_doors: { type: "boolean", default: true, description: "Puertas interactivas con tecla E" },
            parent: { type: "string", default: "City/Interiors" },
          },
          required: ["center"],
        },
      },
      {
        name: "create_curved_road",
        description:
          "TRAZADOR DE CARRETERAS CURVAS BÉZIER: Genera carreteras y autopistas que serpentean orgánicamente por montañas y llanuras mediante waypoints o curvas Bézier, con calzada de asfalto, líneas viales continuas o discontinuas, aceras elevadas y farolas con iluminación real.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", default: "Curved_Highway" },
            waypoints: {
              type: "array",
              items: { type: "array", items: { type: "number" } },
              description: "Lista de puntos [X, Y, Z] que definen la trayectoria curva",
            },
            road_width: { type: "number", default: 24, description: "Ancho de la calzada" },
            sidewalk_width: { type: "number", default: 6 },
            has_sidewalks: { type: "boolean", default: true },
            has_lamps: { type: "boolean", default: true },
            parent: { type: "string", default: "City/Roads" },
          },
          required: ["waypoints"],
        },
      },
      {
        name: "create_intersection",
        description:
          "GENERADOR DE INTERSECCIONES URBANAS (ROTONDAS Y CRUCES): Genera nodos de tráfico complejos como rotondas circulares con jardín central monumental o cruces de 4 vías y cruces en T con semáforos automáticos (luces roja, ámbar y verde) y pasos de peatones.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", default: "Intersection_Node" },
            center: {
              type: "array",
              items: { type: "number" },
              description: "[X, Y, Z] centro de la intersección",
            },
            type: {
              type: "string",
              enum: ["roundabout", "cross_4way", "t_junction"],
              default: "roundabout",
              description: "Tipo de intersección (rotonda circular, cruce de 4 vías o cruce en T)",
            },
            road_width: { type: "number", default: 24 },
            radius: { type: "number", default: 32, description: "Radio exterior para rotondas" },
            arm_length: { type: "number", default: 40, description: "Longitud de los accesos" },
            has_traffic_lights: { type: "boolean", default: true },
            parent: { type: "string", default: "City/Roads" },
          },
          required: ["center"],
        },
      },
      {
        name: "scatter_foliage_and_clutter",
        description:
          "MOTOR DE SCATTER MASIVO (VEGETACIÓN Y ATREZZO): Distribuye de forma orgánica cientos de árboles (pinos alpinos, robles frondosos), rocas escarpadas, arbustos o atrezzo urbano (contenedores de basura, palets, bidones) con detección de suelo mediante Raycast y filtro de pendiente para evitar acantilados verticales.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", default: "Nature_Scatter" },
            center: {
              type: "array",
              items: { type: "number" },
              description: "[X, Y, Z] centro de dispersión",
            },
            radius: { type: "number", default: 150, description: "Radio de dispersión en studs" },
            biome: {
              type: "string",
              enum: ["forest", "mountain_rocks", "desert", "urban_clutter"],
              default: "forest",
            },
            count: { type: "number", default: 60, description: "Cantidad de elementos a dispersar" },
            seed: { type: "number", default: 8831 },
            parent: { type: "string", default: "City/Nature" },
          },
          required: ["center"],
        },
      },
      {
        name: "inject_game_mechanics",
        description:
          "SISTEMAS E INTERACTIVIDAD DE JUEGO: Instala en ServerScriptService controladores para puertas interactivas animadas con TweenService al presionar 'E', alumbrado público automático día/noche según ClockTime, y puntos de Spawn tácticos de equipo con campos de fuerza.",
        inputSchema: {
          type: "object",
          properties: {
            enable_door_controller: { type: "boolean", default: true },
            enable_day_night_lighting: { type: "boolean", default: true },
            enable_team_spawns: { type: "boolean", default: true },
            team_a_position: {
              type: "array",
              items: { type: "number" },
              default: [0, 5, 200],
              description: "[X, Y, Z] posición base Equipo Azul",
            },
            team_b_position: {
              type: "array",
              items: { type: "number" },
              default: [0, 80, -800],
              description: "[X, Y, Z] posición base Equipo Rojo (Montaña)",
            },
          },
        },
      },
      {
        name: "execute_raw_luau",
        description: "Ejecuta cualquier código Luau arbitrario con soporte Undo/Redo (Ctrl+Z).",
        inputSchema: {
          type: "object",
          properties: {
            code: { type: "string" },
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
  const startTime = Date.now();
  let success = true;
  let stats = {};
  let errorObj = null;

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
              text: "🔴 Roblox Studio NO está conectado al bridge actualmente en 127.0.0.1:30250.",
            },
          ],
        };
      }
    }

    if (name === "inspect_area") {
      const result = await sendToRoblox(
        "",
        "Inspect Area Query",
        {
          type: "inspect_area",
          position: args.position,
          radius: args.radius || 50,
          max_results: args.max_results || 15,
        },
        20000
      );

      return {
        content: [
          {
            type: "text",
            text: `🔍 Inspección espacial en radio ${args.radius || 50} studs:\n\n\`\`\`json\n${JSON.stringify(result.data || {}, null, 2)}\n\`\`\``,
          },
        ],
      };
    }

    if (name === "raycast_query") {
      const result = await sendToRoblox(
        "",
        "Raycast Surface Query",
        {
          type: "raycast_query",
          origin: args.origin,
          direction: args.direction || [0, -1, 0],
          distance: args.distance || 150,
        },
        20000
      );

      return {
        content: [
          {
            type: "text",
            text: `⚡ Resultado de Raycast:\n\n\`\`\`json\n${JSON.stringify(result.data || {}, null, 2)}\n\`\`\``,
          },
        ],
      };
    }

    if (name === "get_workspace_layout") {
      const folderPath = args.folder_path || "City";
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

      return {
        content: [
          {
            type: "text",
            text: `📋 Layout de Workspace obtenido para '${folderPath}':\n\n\`\`\`json\n${JSON.stringify(result.data || {}, null, 2)}\n\`\`\``,
          },
        ],
      };
    }

    if (name === "create_street") {
      const luau = generateStreetLuau({
        name: args.name || "Main_Avenue",
        startPosition: args.start_position,
        endPosition: args.end_position,
        roadWidth: args.road_width ?? 24,
        sidewalkWidth: args.sidewalk_width ?? 6,
        hasLanes: args.has_lanes ?? true,
        hasSidewalks: args.has_sidewalks ?? true,
        hasLamps: args.has_lamps ?? true,
        lampInterval: args.lamp_interval ?? 48,
        parent: args.parent || "City/Streets",
      });

      await sendToRoblox(luau, `Create Street ${args.name || "Avenue"}`);

      return {
        content: [
          {
            type: "text",
            text: `✅ Calle/Avenida '${args.name || "Main_Avenue"}' construida con asfalto, aceras elevadas, líneas viales y farolas automáticas.`,
          },
        ],
      };
    }

    if (name === "spawn_prop") {
      const luau = generatePropLuau({
        type: args.type,
        name: args.name,
        position: args.position,
        rotationY: args.rotation_y ?? 0,
        length: args.length ?? 8,
        parent: args.parent || "City/Props",
        tags: args.tags || [],
        attributes: args.attributes || {},
        snapGrid: args.snap_grid ?? 4,
      });

      await sendToRoblox(luau, `Spawn Prop ${args.type}`);

      return {
        content: [
          {
            type: "text",
            text: `✅ Prop táctico '${args.type}' colocado en (${args.position.join(", ")}) en '${args.parent || "City/Props"}'.`,
          },
        ],
      };
    }

    if (name === "build_structure") {
      const partsList = args.parts_list || [];
      const snapGrid = args.snap_grid ?? 4;
      const defaultParent = args.default_parent || "City/Downtown";
      const actionName = args.action_name || `Build Batch (${partsList.length} parts)`;
      const autoOptimize = args.auto_optimize ?? true;

      const luau = generateBatchLuau({
        parts_list: partsList,
        defaultParent,
        snapGrid,
        autoOptimize,
      });

      await sendToRoblox(luau, actionName, {}, 35000);
      stats = { partsCreated: partsList.length, parent: defaultParent, autoOptimize };

      return {
        content: [
          {
            type: "text",
            text: `✅ Lote de ${partsList.length} objetos instanciado con éxito en Roblox Studio (Performance Shield y LOD activos).\n- Destino: '${defaultParent}'\n- Rejilla: ${snapGrid > 0 ? snapGrid + " studs" : "Desactivado"}.`,
          },
        ],
      };
    }

    if (name === "set_hollow_box") {
      const luau = generateHollowBoxLuau({
        name: args.name || "Building",
        position: args.position,
        size: args.size,
        wallThickness: args.wall_thickness ?? 1.5,
        hasFloor: args.has_floor ?? true,
        hasCeiling: args.has_ceiling ?? true,
        includeParapet: args.include_parapet ?? true,
        includeLighting: args.include_lighting ?? true,
        includeBaseboard: args.include_baseboard ?? true,
        doors: args.doors || [],
        parent: args.parent || "City/Downtown",
        tags: args.tags || [],
        attributes: args.attributes || {},
        snapGrid: args.snap_grid ?? 4,
      });

      await sendToRoblox(luau, `Set Hollow Box ${args.name || "Building"}`);
      stats = { partsCreated: 6, parent: args.parent || "City/Downtown" };

      return {
        content: [
          {
            type: "text",
            text: `✅ Edificio '${args.name || "Building"}' (${args.size ? args.size.join("x") : ""} studs) construido en '${args.parent || "City"}' con cornisas de azotea, luz interior en el techo, zócalo y vanos de puerta transitables.`,
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
        parent: args.parent || "City/Highways",
        tags: args.tags || ["Road_Ramp"],
        attributes: args.attributes || {},
        snapGrid: args.snap_grid ?? 4,
      });

      await sendToRoblox(luau, `Spawn Wedge ${args.name || "Ramp"}`);

      return {
        content: [
          {
            type: "text",
            text: `✅ Cuña/Rampa (WedgePart) '${args.name || "Highway_Ramp"}' generada en '${args.parent || "City/Highways"}'.`,
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
        parent: args.parent || "City/Favela",
        tags: args.tags || ["Climbable_Truss"],
        attributes: args.attributes || {},
        snapGrid: args.snap_grid ?? 4,
      });

      await sendToRoblox(luau, `Spawn Truss ${args.name || "Ladder"}`);

      return {
        content: [
          {
            type: "text",
            text: `✅ Escalera técnica (TrussPart) de ${args.height ?? 16} studs generada en '${args.parent || "City/Favela"}'.`,
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
            error("No se encontró '${targetPath}' en Workspace.")
        end
      `;

      await sendToRoblox(luau, `Tag and Attribute ${targetPath}`);

      return {
        content: [
          {
            type: "text",
            text: `✅ Tags y atributos asignados a '${targetPath}' exitosamente.`,
          },
        ],
      };
    }

    if (name === "clear_folder") {
      const folderPath = args.folder_path || "City";
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

    if (name === "generate_terrain") {
      const luau = generateProceduralTerrainLuau({
        center: args.center || [0, 0],
        size: args.size || [400, 400],
        biome: args.biome || "hills",
        baseHeight: args.base_height ?? 0,
        heightAmplitude: args.height_amplitude ?? 60,
        seed: args.seed ?? 12345,
        scale: args.scale ?? 140,
        octaves: args.octaves ?? 3,
        waterLevel: args.water_level,
        resolution: args.resolution ?? 8,
        clearBeforeGenerate: args.clear_before_generate ?? false,
        steepSlopeMaterial: args.steep_slope_material || "Rock",
        flatMaterial: args.flat_material || "Grass",
        underMaterial: args.under_material || "Ground",
        beachMaterial: args.beach_material || "Sand",
        snowCapHeight: args.snow_cap_height,
      });

      await sendToRoblox(luau, `Generate Procedural Terrain (${args.biome || "hills"})`, {}, 45000);
      stats = { biome: args.biome || "hills", size: args.size || [400, 400] };

      return {
        content: [
          {
            type: "text",
            text: `🏔️ Terreno procedural generado exitosamente:\n- Bioma: ${args.biome || "hills"}\n- Dimensiones: ${args.size ? args.size.join("x") : "400x400"} studs en centro [${(args.center || [0, 0]).join(", ")}]\n- Altura base: ${args.base_height ?? 0} studs (Amplitud: ${args.height_amplitude ?? 60} studs)\n- Resolución: ${args.resolution ?? 8} studs\n- Agua: ${args.water_level !== undefined ? "Y = " + args.water_level : "Sin agua"}\n- Deshacer disponible con Ctrl + Z en Roblox Studio.`,
          },
        ],
      };
    }

    if (name === "flatten_terrain_area") {
      const luau = generateFlattenTerrainLuau({
        position: args.position,
        size: args.size || [80, 80],
        material: args.material || "Concrete",
        foundationDepth: args.foundation_depth ?? 16,
        clearHeight: args.clear_height ?? 50,
        blendMargin: args.blend_margin ?? 8,
        retainingWall: args.retaining_wall ?? false,
        wallMaterial: args.wall_material || "Concrete",
      });

      await sendToRoblox(luau, `Flatten Terrain Area (${args.material || "Concrete"})`, {}, 25000);
      stats = { position: args.position, size: args.size || [80, 80], material: args.material || "Concrete" };

      return {
        content: [
          {
            type: "text",
            text: `🚜 Parcela de terreno nivelada exitosamente:\n- Centro: [${args.position.join(", ")}]\n- Tamaño: ${args.size ? args.size.join("x") : "80x80"} studs\n- Material de superficie: ${args.material || "Concrete"}\n- Cimentación: ${args.foundation_depth ?? 16} studs | Despeje aéreo: ${args.clear_height ?? 50} studs\n- Muros de contención: ${args.retaining_wall ? "Sí" : "No"}.`,
          },
        ],
      };
    }

    if (name === "carve_terrain_path") {
      const luau = generateCarvePathLuau({
        startPoint: args.start_point,
        endPoint: args.end_point,
        waypoints: args.waypoints || [],
        width: args.width ?? 24,
        height: args.height ?? 18,
        mode: args.mode || "road",
        surfaceMaterial: args.surface_material || "Pavement",
        wallMaterial: args.wall_material || "Rock",
      });

      await sendToRoblox(luau, `Carve Terrain Path (${args.mode || "road"})`, {}, 30000);
      stats = { mode: args.mode || "road", from: args.start_point, to: args.end_point };

      return {
        content: [
          {
            type: "text",
            text: `🛣️ Trazo de terreno '${args.mode || "road"}' excavado exitosamente:\n- Tramo: [${args.start_point.join(", ")}] ➔ [${args.end_point.join(", ")}]\n- Ancho: ${args.width ?? 24} studs | Altura libre: ${args.height ?? 18} studs\n- Material: ${args.surface_material || "Pavement"}.`,
          },
        ],
      };
    }

    if (name === "shape_terrain") {
      const luau = generateShapeTerrainLuau({
        shape: args.shape || "Block",
        operation: args.operation || "add",
        position: args.position,
        size: args.size || [20, 20, 20],
        radius: args.radius ?? 15,
        height: args.height ?? 20,
        rotation: args.rotation || [0, 0, 0],
        material: args.material || "Rock",
      });

      await sendToRoblox(luau, `Shape Terrain (${args.shape || "Block"} ${args.operation || "add"})`, {}, 20000);
      stats = { shape: args.shape || "Block", op: args.operation || "add", pos: args.position };

      return {
        content: [
          {
            type: "text",
            text: `🗿 Primitiva de terreno '${args.shape || "Block"}' aplicada con éxito (${args.operation === "subtract" ? "Sustracción / Excavación" : "Adición de " + (args.material || "Rock")}) en [${args.position.join(", ")}].`,
          },
        ],
      };
    }

    if (name === "paint_terrain_material") {
      const luau = generatePaintTerrainLuau({
        mode: args.mode || "replace",
        center: args.center || [0, 0, 0],
        size: args.size || [40, 40, 40],
        radius: args.radius ?? 20,
        targetMaterial: args.target_material || "Snow",
        sourceMaterial: args.source_material || "Grass",
        regionBounds: args.region_bounds,
      });

      await sendToRoblox(luau, `Paint Terrain Material (${args.target_material || "Material"})`, {}, 25000);
      stats = { targetMaterial: args.target_material || "Snow", mode: args.mode || "replace" };

      return {
        content: [
          {
            type: "text",
            text: `🎨 Material de terreno actualizado con éxito:\n- Modo: ${args.mode || "replace"}\n- Material destino: ${args.target_material || "Snow"} ${args.mode === "replace" ? "(reemplazando " + (args.source_material || "Grass") + ")" : ""}.`,
          },
        ],
      };
    }

    if (name === "clear_terrain") {
      const luau = generateClearTerrainLuau({
        all: args.all ?? false,
        regionBounds: args.region_bounds,
      });

      await sendToRoblox(luau, "Clear Terrain", {}, 20000);
      stats = { clearAll: args.all ?? false };

      return {
        content: [
          {
            type: "text",
            text: args.all
              ? `🧹 Todo el terreno de Roblox Studio ha sido eliminado completamente (deshacer con Ctrl + Z).`
              : `🧹 Región de terreno eliminada exitosamente.`,
          },
        ],
      };
    }

    if (name === "configure_water") {
      const luau = generateWaterConfigLuau({
        color: args.color || [40, 120, 160],
        reflectance: args.reflectance ?? 0.5,
        transparency: args.transparency ?? 0.6,
        waveSize: args.wave_size ?? 0.25,
        waveSpeed: args.wave_speed ?? 12,
      });

      await sendToRoblox(luau, "Configure Water Properties", {}, 15000);
      stats = { waterColor: args.color || [40, 120, 160] };

      return {
        content: [
          {
            type: "text",
            text: `🌊 Propiedades cinemáticas de agua configuradas:\n- Color: RGB(${(args.color || [40, 120, 160]).join(", ")})\n- Olas: tamaño ${args.wave_size ?? 0.25}, velocidad ${args.wave_speed ?? 12}\n- Reflectancia: ${args.reflectance ?? 0.5} | Transparencia: ${args.transparency ?? 0.6}.`,
          },
        ],
      };
    }

    if (name === "generate_district") {
      const luau = generateDistrictLuau({
        name: args.name || "Downtown_District",
        center: args.center || [0, 0],
        size: args.size || [240, 240],
        style: args.style || "modern_downtown",
        density: args.density || "high",
        streetWidth: args.street_width ?? 28,
        sidewalkWidth: args.sidewalk_width ?? 8,
        seed: args.seed ?? 54321,
        hasFurniture: args.has_furniture ?? true,
        alignToTerrain: args.align_to_terrain ?? true,
        hasPlaza: args.has_plaza ?? true,
        parent: args.parent || "City/Districts",
      });

      await sendToRoblox(luau, `Generate AAA District (${args.name || "Downtown"})`, {}, 60000);
      stats = { district: args.name || "Downtown_District", style: args.style || "modern_downtown", size: args.size || [240, 240] };

      return {
        content: [
          {
            type: "text",
            text: `🏙️ Distrito Urbano AAA '${args.name || "Downtown_District"}' generado exitosamente:\n- Estilo: ${args.style || "modern_downtown"} (Densidad: ${args.density || "high"})\n- Dimensiones: ${args.size ? args.size.join("x") : "240x240"} studs en centro [${(args.center || [0, 0]).join(", ")}]\n- Calzadas con asfalto oscuro, bordillos de granito, imbornales y pasos de cebra peatonales.\n- Orientación correcta de fachadas: los edificios miran a su calle perimetral correspondiente.\n- Portales con puertas reales, marcos y manillas en cada edificio comercial.\n- Callejones de servicio interiores equipados con contenedores de basura, palets y puertas de servicio.\n- Plaza central peatonal con fuente monumental activa: ${args.has_plaza !== false ? "Activada" : "Desactivada"}.\n- Mobiliario urbano desplegado: ${args.has_furniture !== false ? "Farolas con sombras, árboles, bancos y bocas de incendio" : "Desactivado"}.\n- Terreno nivelado automáticamente: ${args.align_to_terrain !== false ? "Sí" : "No"}.`,
          },
        ],
      };
    }

    if (name === "build_detailed_structure") {
      const luau = generateDetailedBuildingLuau({
        name: args.name || "Detailed_Building",
        position: args.position,
        footprint: args.footprint || [40, 40],
        floors: args.floors ?? 5,
        style: args.style || "modern_downtown",
        seed: args.seed ?? 1234,
        hasRoofProps: args.has_roof_props ?? true,
        hasBalconies: args.has_balconies ?? true,
        hasFireEscapes: args.has_fire_escapes ?? null,
        hasSidewalkDining: args.has_sidewalk_dining ?? true,
        hasSetbacks: args.has_setbacks ?? true,
        parent: args.parent || "City/Downtown",
      });

      await sendToRoblox(luau, `Build Detailed Structure (${args.name || "Building"})`, {}, 30000);
      stats = { building: args.name || "Detailed_Building", floors: args.floors ?? 5, style: args.style || "modern_downtown" };

      return {
        content: [
          {
            type: "text",
            text: `🏛️ Edificio Arquitectónico AAA '${args.name || "Detailed_Building"}' construido exitosamente:\n- Ubicación: [${args.position.join(", ")}]\n- Huella: ${args.footprint ? args.footprint.join("x") : "40x40"} studs | Pisos: ${args.floors ?? 5} niveles\n- Estilo: ${args.style || "modern_downtown"}\n- Fachadas articuladas en 3D en las 4 direcciones (sin muros planos ciegos).\n- Portal monumental remetido con doble puerta batiente, manillones metálicos, espejo y marquesina suspendida con focos LED.\n- Puerta trasera de servicio con farol de seguridad.\n- Escaparates con zócalos, toldos a 45°, rótulos comerciales 3D retroiluminados y veladores de cafetería.\n- Pisos superiores con ventanas 3D con alféizar, dintel, parteluces e iluminación interior multinivel (LED/tungsteno).\n- Balcones en voladizo con barandillas y retranqueos volumétricos (setbacks).\n- Azotea habitable con caseta de ascensor transitable, HVAC doble ventilador, tanque de agua cilíndrico sobre zancos y antena con baliza roja.`,
          },
        ],
      };
    }

    if (name === "setup_environment") {
      const luau = generateEnvironmentLuau({
        preset: args.preset || "golden_hour",
        clockTime: args.clock_time,
        enableFutureLighting: args.enable_future_lighting ?? true,
        shadowSoftness: args.shadow_softness ?? 0.2,
      });

      await sendToRoblox(luau, `Setup Environment (${args.preset || "golden_hour"})`, {}, 15000);
      stats = { preset: args.preset || "golden_hour" };

      return {
        content: [
          {
            type: "text",
            text: `🌅 Atmósfera Cinemática y Post-Procesado aplicado exitosamente:\n- Preset: ${args.preset || "golden_hour"}\n- Iluminación: Future Lighting con sombras suaves (Softness: ${args.shadow_softness ?? 0.2})\n- Efectos inyectados: Atmosphere volumétrica, BloomEffect, ColorCorrectionEffect y SunRaysEffect.`,
          },
        ],
      };
    }

    if (name === "populate_street_furniture") {
      const luau = generateStreetFurnitureLuau({
        center: args.center,
        length: args.length ?? 120,
        orientation: args.orientation || "Z",
        sidewalkOffset: args.sidewalk_offset ?? 16,
        interval: args.interval ?? 40,
        includeTrees: args.include_trees ?? true,
        includeLamps: args.include_lamps ?? true,
        includeBenches: args.include_benches ?? true,
        includeHydrants: args.include_hydrants ?? true,
        parent: args.parent || "City/Props",
      });

      await sendToRoblox(luau, "Populate Street Furniture", {}, 25000);
      stats = { length: args.length ?? 120, orientation: args.orientation || "Z" };

      return {
        content: [
          {
            type: "text",
            text: `🌳 Mobiliario urbano desplegado a lo largo de ${args.length ?? 120} studs en eje ${args.orientation || "Z"}:\n- Farolas con sombras y luz real\n- Árboles en alcorques de fundición\n- Bancos públicos, papeleras y bocas de incendio.`,
          },
        ],
      };
    }

    if (name === "generate_favela") {
      const luau = generateFavelaDistrictLuau({
        name: args.name || "Favela_Hillside",
        center: args.center || [0, 50, -800],
        size: args.size || [180, 180],
        slopeDirection: args.slope_direction || "-Z",
        elevationGain: args.elevation_gain ?? 70,
        seed: args.seed ?? 7771,
        density: args.density || "high",
        hasOverheadCables: args.has_overhead_cables ?? true,
        hasFootbridges: args.has_footbridges ?? true,
        parent: args.parent || "City/Favela",
      });

      await sendToRoblox(luau, `Generate Favela (${args.name || "Favela"})`, {}, 60000);
      stats = { favela: args.name || "Favela_Hillside", size: args.size || [180, 180], elevGain: args.elevation_gain ?? 70 };

      return {
        content: [
          {
            type: "text",
            text: `🏘️ Comunidad de Favela Orgánica '${args.name || "Favela_Hillside"}' generada con éxito:\n- Ubicación: ladera en [${(args.center || [0, 50, -800]).join(", ")}], desnivel ${args.elevation_gain ?? 70} studs subiendo en ${args.slope_direction || "-Z"}.\n- Terrazas escalonadas, casas apiladas con voladizos de ladrillo y revoques de colores.\n- Callejones peatonales estrechos y escaleras transitables conectando niveles.\n- Caixas d'água azules, pasarelas de madera entre azoteas y postes con maraña de cables eléctricos.`,
          },
        ],
      };
    }

    if (name === "create_playable_interior") {
      const luau = generatePlayableInteriorLuau({
        name: args.name || "Playable_Interior",
        center: args.center,
        size: args.size || [40, 10, 40],
        floors: args.floors ?? 3,
        theme: args.theme || "office",
        hasStairs: args.has_stairs ?? true,
        interactiveDoors: args.interactive_doors ?? true,
        parent: args.parent || "City/Interiors",
      });

      await sendToRoblox(luau, `Create Playable Interior (${args.theme || "office"})`, {}, 35000);
      stats = { theme: args.theme || "office", floors: args.floors ?? 3 };

      return {
        content: [
          {
            type: "text",
            text: `🚪 Interior jugable y transitable generado en [${args.position ? args.position.join(", ") : args.center.join(", ")}]:\n- Temática: ${args.theme || "office"} (${args.floors ?? 3} pisos transitables)\n- Caja de escaleras continua (stairwell) con huecos de forjado para subir sin saltar.\n- Pasillo central, tabiques de habitaciones y puertas interactivas animadas con ProximityPrompt ('E').\n- Iluminación de techo y mobiliario temático completo.`,
          },
        ],
      };
    }

    if (name === "create_curved_road") {
      const luau = generateCurvedRoadLuau({
        name: args.name || "Curved_Highway",
        waypoints: args.waypoints,
        roadWidth: args.road_width ?? 24,
        sidewalkWidth: args.sidewalk_width ?? 6,
        hasSidewalks: args.has_sidewalks ?? true,
        hasLamps: args.has_lamps ?? true,
        parent: args.parent || "City/Roads",
      });

      await sendToRoblox(luau, `Create Curved Road (${args.name || "Highway"})`, {}, 30000);
      stats = { waypointsCount: args.waypoints?.length || 0, roadWidth: args.road_width ?? 24 };

      return {
        content: [
          {
            type: "text",
            text: `🛣️ Carretera curva Bézier '${args.name || "Curved_Highway"}' generada exitosamente:\n- Trazado suave a lo largo de ${args.waypoints?.length || 3} puntos con calzada de asfalto y líneas viales.\n- Aceras peatonales elevadas y farolas con iluminación real a lo largo de la curva.`,
          },
        ],
      };
    }

    if (name === "create_intersection") {
      const luau = generateIntersectionLuau({
        name: args.name || "Intersection_Node",
        center: args.center,
        type: args.type || "roundabout",
        roadWidth: args.road_width ?? 24,
        radius: args.radius ?? 32,
        armLength: args.arm_length ?? 40,
        hasTrafficLights: args.has_traffic_lights ?? true,
        parent: args.parent || "City/Roads",
      });

      await sendToRoblox(luau, `Create Intersection (${args.type || "roundabout"})`, {}, 25000);
      stats = { type: args.type || "roundabout", center: args.center };

      return {
        content: [
          {
            type: "text",
            text: `🚦 Nodo de intersección '${args.name || "Intersection_Node"}' (${args.type || "roundabout"}) generado en [${args.center.join(", ")}]:\n- ${args.type === "roundabout" ? "Rotonda circular con jardín/monumento central y 4 accesos." : "Cruce con 4 semáforos funcionales y señalización vial."}`,
          },
        ],
      };
    }

    if (name === "scatter_foliage_and_clutter") {
      const luau = generateFoliageScatterLuau({
        name: args.name || "Nature_Scatter",
        center: args.center,
        radius: args.radius ?? 150,
        biome: args.biome || "forest",
        count: args.count ?? 60,
        seed: args.seed ?? 8831,
        parent: args.parent || "City/Nature",
      });

      await sendToRoblox(luau, `Scatter Foliage (${args.biome || "forest"})`, {}, 40000);
      stats = { count: args.count ?? 60, biome: args.biome || "forest", radius: args.radius ?? 150 };

      return {
        content: [
          {
            type: "text",
            text: `🌲 Scatter orgánico completado:\n- ${args.count ?? 60} elementos de bioma '${args.biome || "forest"}' dispersados en radio ${args.radius ?? 150} studs.\n- Detección de suelo por Raycast con filtro de pendientes para evitar acantilados verticales.`,
          },
        ],
      };
    }

    if (name === "inject_game_mechanics") {
      const luau = generateInteractiveSystemsLuau({
        enableDoorController: args.enable_door_controller ?? true,
        enableDayNightLighting: args.enable_day_night_lighting ?? true,
        enableTeamSpawns: args.enable_team_spawns ?? true,
        teamA_Position: args.team_a_position || [0, 5, 200],
        teamB_Position: args.team_b_position || [0, 80, -800],
      });

      await sendToRoblox(luau, "Inject Game Mechanics Systems", {}, 20000);
      stats = { mechanicsInjected: true };

      return {
        content: [
          {
            type: "text",
            text: `🎮 Mecánicas e interactividad de juego instaladas en ServerScriptService:\n- InteractiveDoorController: Puertas animadas suaves con TweenService al presionar 'E'.\n- DayNightLightingController: Alumbrado público que se activa de noche y apaga de día automáticamente.\n- Spawns tácticos de equipo con campos de fuerza en Base Sur y Base Norte.`,
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
    success = false;
    errorObj = err;
    return {
      isError: true,
      content: [{ type: "text", text: `❌ Error: ${err.message}` }],
    };
  } finally {
    const durationMs = Date.now() - startTime;
    logEvent({
      event: "TOOL_CALL",
      tool: name,
      durationMs,
      success,
      stats,
      params: args,
      error: errorObj,
    }).catch(() => {});
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
