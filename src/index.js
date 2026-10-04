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
import { generateHouseLuau } from "./generators/house.js";
import { generateLandmarkLuau } from "./generators/landmarks.js";
import { generateTrafficSignageLuau } from "./generators/trafficSignage.js";
import { generateElevatedHighwayLuau } from "./generators/highway.js";
import { generateParkingLotLuau } from "./generators/parkingLot.js";
import {
  generateCaliforniaPalmLuau,
  generatePocketParkLuau,
} from "./generators/palmsAndParks.js";
import { generateDistrictLuau } from "./generators/district.js";
import { generateStreetFurnitureLuau } from "./generators/streetFurniture.js";
import { generateEnvironmentLuau } from "./generators/environment.js";
import { generateFavelaDistrictLuau } from "./generators/favela.js";
import { generatePlayableInteriorLuau } from "./generators/interior.js";
import { generateCurvedRoadLuau, generateIntersectionLuau } from "./generators/roadNetwork.js";
import { generateFoliageScatterLuau } from "./generators/scatter.js";
import { generateInteractiveSystemsLuau } from "./generators/interactive.js";
import {
  generateTransformObjectLuau,
  generateAlignToSurfaceLuau,
  generateDuplicateAndRepeatLuau,
  generateMeasureDistanceLuau,
  generateFindObjectsLuau,
  generateAuditPerformanceLuau,
  generateOptimizeWorkspaceLuau,
  generateReplaceMaterialOrColorLuau,
  generateFocusCameraLuau,
  generateAdjustLightingLuau,
} from "./generators/levelDesignTools.js";
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
            district_type: {
              type: "string",
              enum: ["commercial_downtown", "residential_suburb", "mixed_urban"],
              default: "commercial_downtown",
              description: "Tipo de distrito ('commercial_downtown' = rascacielos/comercios, 'residential_suburb' = barrio de casas unifamiliares estilo Grove St / Ganton con jardines y porches, 'mixed_urban' = bulevar mixto)",
            },
            has_furniture: {
              type: "boolean",
              default: true,
              description: "Incluir farolas con sombras, árboles en alcorques, bancos y bocas de incendio",
            },
            has_power_lines: {
              type: "boolean",
              default: true,
              description: "Incluir postes de madera con crucetas, transformadores y cables eléctricos aéreos tendidos (estilo icónico GTA San Andreas)",
            },
            has_plaza: {
              type: "boolean",
              default: true,
              description: "En manzanas 3x3 comerciales, convierte la parcela central en una plaza peatonal monumental con fuente de agua",
            },
            align_to_terrain: {
              type: "boolean",
              default: true,
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
        name: "build_house",
        description:
          "CASA RESIDENCIAL REALISTA ESTILO GTA SAN ANDREAS: Construye una vivienda unifamiliar detallada (Grove Street / Ganton / San Fierro / Vinewood) con tejado a dos aguas con aleros y chimenea de ladrillo, porche delantero cubierto con escalones y barandillas, puerta residencial con manilla de latón, ventanas con contraventanas de madera (shutters), garaje adosado con portón y camino de entrada de hormigón (driveway), jardín delantero de césped con camino de losas y buzón de correos americano a pie de calle, y patio trasero vallado con barbacoa y cubos de basura.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", default: "Suburban_House" },
            position: {
              type: "array",
              items: { type: "number" },
              description: "[X, Y, Z] posición central de la parcela/casa",
            },
            lot_size: {
              type: "array",
              items: { type: "number" },
              default: [56, 72],
              description: "[ancho X, fondo Z] dimensiones de la parcela",
            },
            style: {
              type: "string",
              enum: [
                "suburban_bungalow",
                "victorian_rowhouse",
                "vinewood_mansion",
                "duplex_apartment",
              ],
              default: "suburban_bungalow",
              description: "Estilo residencial ('suburban_bungalow' = Grove St / Ganton, 'victorian_rowhouse' = San Fierro, 'vinewood_mansion' = Mansión moderna Vinewood Hills, 'duplex_apartment' = Bloque duplex multifamiliar)",
            },
            seed: { type: "number", default: 2024 },
            has_garage: { type: "boolean", default: true, description: "Garaje adosado con portón y camino de entrada" },
            has_porch: { type: "boolean", default: true, description: "Porche delantero cubierto con escalones y farol" },
            has_fence: { type: "boolean", default: true, description: "Valla perimetral de madera blanca o delimitación" },
            has_yard_props: { type: "boolean", default: true, description: "Buzón americano a pie de calle, camino de losas, barbacoa y cubos de basura" },
            parent: { type: "string", default: "City/Houses" },
          },
          required: ["position"],
        },
      },
      {
        name: "build_landmark",
        description:
          "EDIFICIOS EMBLEMÁTICOS Y SERVICIOS URBANOS ESTILO GTA SAN ANDREAS: Construye hitos urbanos detallados de servicio:\n- 'gas_station': Gasolinera con gran marquesina iluminada, 4 surtidores con mangueras, tienda de conveniencia 24/7 con escaparates y rótulos iluminados, tótem de precios gigante a pie de calle, máquina de hielo y cajero ATM.\n- 'fast_food_diner': Restaurante Burger Shot / Diner con carril Drive-Thru transitable, poste de menú con interfono, ventanilla de recogida de pedidos y gran tótem cartel elevado estilo autopista.\n- 'police_station': Comisaría de policía de 2 plantas con 3 cocheras de patrullas con portones enrollables, helipuerto operativo en azotea con balizas de aterrizaje y torre de comunicaciones de radio.",
        inputSchema: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["gas_station", "fast_food_diner", "police_station"],
              default: "gas_station",
              description: "Tipo de hito urbano ('gas_station', 'fast_food_diner', 'police_station')",
            },
            name: { type: "string" },
            position: {
              type: "array",
              items: { type: "number" },
              description: "[X, Y, Z] posición central en el suelo",
            },
            rotation_y: { type: "number", default: 0, description: "Rotación en grados sobre el eje Y" },
            seed: { type: "number", default: 5050 },
            parent: { type: "string", default: "City/Landmarks" },
          },
          required: ["type", "position"],
        },
      },
      {
        name: "place_traffic_signage",
        description:
          "SEÑALIZACIÓN VIAL Y SEMÁFOROS PROFESIONALES ESTILO GTA SAN ANDREAS: Despliega elementos de control de tráfico y señalización urbana:\n- 'intersection_traffic_light': Semáforo en poste con brazo curvado (mast-arm) sobre la calzada con ópticas 3D (rojo, ámbar, verde con luces), señal peatonal y placas de calles cruzadas.\n- 'stop_sign': Señal de STOP octogonal en poste de aluminio con señal de cruce.\n- 'street_name_sign': Poste de doble placa con nombres de calles en cruce (ej: 'GROVE ST / GANTON AVE').\n- 'speed_limit': Señal de límite de velocidad oficial (SPEED LIMIT 35 o 45 MPH).\n- 'road_arrows': Flechas termoplásticas reflectantes pintadas en el asfalto (recto, giro, recto+giro).",
        inputSchema: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["intersection_traffic_light", "stop_sign", "street_name_sign", "speed_limit", "road_arrows"],
              default: "intersection_traffic_light",
              description: "Tipo de señal o semáforo",
            },
            position: {
              type: "array",
              items: { type: "number" },
              description: "[X, Y, Z] posición en el suelo",
            },
            rotation_y: { type: "number", default: 0, description: "Rotación en grados" },
            street_a: { type: "string", default: "GROVE ST", description: "Nombre de la calle principal" },
            street_b: { type: "string", default: "GANTON AVE", description: "Nombre de la calle secundaria" },
            speed_limit: { type: "number", default: 35, description: "Límite de velocidad en MPH" },
            arrow_type: {
              type: "string",
              enum: ["straight", "turn_left", "turn_right", "straight_and_turn"],
              default: "straight_and_turn",
              description: "Tipo de flecha en asfalto",
            },
            parent: { type: "string", default: "City/Signage" },
          },
          required: ["type", "position"],
        },
      },
      {
        name: "build_elevated_highway",
        description:
          "AUTOPISTA ELEVADA / FREEWAY CON PILARES Y RAMPAS ESTILO GTA SAN ANDREAS: Construye tramos de autopista elevada de alta capacidad (4 carriles, 36 studs de ancho) a +22 studs de altura sostenida por pilares macizos de hormigón armado en T (hammerhead piers), barreras laterales New Jersey de hormigón, pórticos de señalización verde interestatal ('LOS SANTOS / DOWNTOWN / AIRPORT') y rampas de acceso conectadas al suelo.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", default: "Elevated_Freeway" },
            start_point: {
              type: "array",
              items: { type: "number" },
              default: [0, 22, -150],
              description: "[X, Y, Z] punto de inicio elevado",
            },
            end_point: {
              type: "array",
              items: { type: "number" },
              default: [0, 22, 150],
              description: "[X, Y, Z] punto final elevado",
            },
            road_width: { type: "number", default: 36, description: "Ancho de la calzada (36 studs = 4 carriles)" },
            elevation: { type: "number", default: 22, description: "Altura sobre el suelo en studs" },
            include_piers: { type: "boolean", default: true, description: "Pilares macizos de hormigón armado en T cada 60 studs" },
            include_gantry_sign: { type: "boolean", default: true, description: "Pórtico aéreo interestatal verde con destinos" },
            include_ramp: { type: "boolean", default: false, description: "Generar rampa de incorporación/salida hasta cota 0" },
            ramp_side: { type: "string", enum: ["Right", "Left"], default: "Right" },
            parent: { type: "string", default: "City/Highways" },
          },
          required: ["start_point", "end_point"],
        },
      },
      {
        name: "build_parking_lot",
        description:
          "ESTACIONAMIENTO COMERCIAL / PÚBLICO DETALLADO (SIN VEHÍCULOS): Construye una explanada de estacionamiento profesional con asfalto, bordillos perimetrales, plazas delimitadas con marcas viales, plazas azules reservadas para personas con movilidad reducida (PMR), topes de rueda de hormigón (wheel stops), isletas ajardinadas con palmeras, torres de focos de gran altura, cajero de pago automático cubierto y barrera de control de accesos.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", default: "Commercial_Parking_Lot" },
            center: {
              type: "array",
              items: { type: "number" },
              default: [0, 0, 0],
              description: "[X, Y, Z] centro de la explanada",
            },
            size: {
              type: "array",
              items: { type: "number" },
              default: [90, 80],
              description: "[ancho X, fondo Z] dimensiones del aparcamiento",
            },
            rows: { type: "number", default: 2, description: "Filas dobles de aparcamiento" },
            include_landscaping: { type: "boolean", default: true, description: "Isletas ajardinadas centrales con palmeras" },
            include_light_poles: { type: "boolean", default: true, description: "Torres de iluminación de estacionamiento" },
            include_pay_station: { type: "boolean", default: true, description: "Cajero automático de pago con marquesina" },
            include_barrier_gate: { type: "boolean", default: true, description: "Barrera elevable de control de accesos" },
            parent: { type: "string", default: "City/Parking" },
          },
          required: ["center"],
        },
      },
      {
        name: "spawn_palm_tree",
        description:
          "PALMERA CALIFORNIANA GIGANTE (CALIFORNIA FAN PALM): Genera una palmera icónica estilo Los Santos / Los Ángeles de 28 a 40 studs de altura con tronco curvado segmentado de madera fibrosa, corona de hojas de palma (fronds) inclinadas y sombreado realista.",
        inputSchema: {
          type: "object",
          properties: {
            position: {
              type: "array",
              items: { type: "number" },
              description: "[X, Y, Z] base de la palmera",
            },
            height: { type: "number", default: 32, description: "Altura del tronco en studs (20 a 50)" },
            seed: { type: "number", default: 101, description: "Semilla para variación de curvatura" },
            parent: { type: "string", default: "City/Nature" },
          },
          required: ["position"],
        },
      },
      {
        name: "build_pocket_park",
        description:
          "PARQUE URBANO DE BOLSILLO / PLAZA AJARDINADA: Construye un parque público para barrios residenciales o centros urbanos con pradera de césped perimetral, caminos de grava cruzados, cenador/gazebo hexagonal central de madera con cúpula, fuente de agua o monumento, bancos victorianos, farolas clásicas, parterres florales y palmeras californianas.",
        inputSchema: {
          type: "object",
          properties: {
            name: { type: "string", default: "Suburban_Pocket_Park" },
            center: {
              type: "array",
              items: { type: "number" },
              default: [0, 0, 0],
              description: "[X, Y, Z] centro del parque",
            },
            size: {
              type: "array",
              items: { type: "number" },
              default: [80, 80],
              description: "[ancho X, fondo Z] dimensiones",
            },
            has_gazebo: { type: "boolean", default: true, description: "Cenador hexagonal de madera transitable" },
            has_fountain: { type: "boolean", default: true, description: "Fuente circular ornamental de agua" },
            parent: { type: "string", default: "City/Parks" },
          },
          required: ["center"],
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
        name: "get_selection",
        description:
          "CONCIENCIA DE SELECCIÓN ACTIVA EN STUDIO: Lee qué objetos o modelos tiene seleccionados el desarrollador actualmente en Roblox Studio (Selection:Get()). Devuelve nombres, ClassNames, posiciones [X, Y, Z], dimensiones BoundingBox, cantidad de partes, tags de CollectionService y estado de anclaje para manipularlos con comandos conversacionales ('bájalo al suelo', 'muévelo 10 studs', 'cámbiale el material').",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "set_selection",
        description:
          "SELECCIÓN PROGRAMÁTICA EN STUDIO: Selecciona y resalta visualmente en la ventana de Roblox Studio una o varias instancias a partir de sus rutas en Workspace (ej: ['City/Houses/Suburban_House_1']) o por tag.",
        inputSchema: {
          type: "object",
          properties: {
            target_paths: {
              type: "array",
              items: { type: "string" },
              description: "Lista de rutas de objetos a seleccionar en Workspace",
            },
            target_path: {
              type: "string",
              description: "Ruta única de objeto a seleccionar",
            },
          },
        },
      },
      {
        name: "transform_object",
        description:
          "MANIPULACIÓN Y TRANSFORMACIÓN 3D: Mueve o rota un modelo o parte en Workspace de forma absoluta o relativa con ajuste a rejilla opcional (snap_grid). Si target_path es 'selected', actúa sobre la selección activa en Studio.",
        inputSchema: {
          type: "object",
          properties: {
            target_path: {
              type: "string",
              default: "selected",
              description: "Ruta del objeto en Workspace o 'selected' para usar la selección actual de Studio",
            },
            position: {
              type: "array",
              items: { type: "number" },
              description: "[X, Y, Z] nueva posición absoluta",
            },
            offset: {
              type: "array",
              items: { type: "number" },
              description: "[DX, DY, DZ] desplazamiento relativo en studs",
            },
            rotation: {
              type: "array",
              items: { type: "number" },
              description: "[RX, RY, RZ] nueva rotación absoluta en grados",
            },
            rotation_offset: {
              type: "array",
              items: { type: "number" },
              description: "[DRX, DRY, DRZ] rotación incremental en grados",
            },
            snap_grid: {
              type: "number",
              default: 0,
              description: "Ajuste de posición a rejilla en studs (ej: 4)",
            },
          },
        },
      },
      {
        name: "align_to_surface",
        description:
          "IMÁN / ASENTAR AL SUELO (MAGNET DROP): Asienta con precisión milimétrica un objeto o modelo flotante o enterrado sobre la superficie del suelo o terreno de Roblox mediante Raycast vertical hacia abajo, calculando la altura exacta para que toque el suelo sin flotar ni incrustarse.",
        inputSchema: {
          type: "object",
          properties: {
            target_path: {
              type: "string",
              default: "selected",
              description: "Ruta del objeto o 'selected'",
            },
            offset_y: {
              type: "number",
              default: 0,
              description: "Margen vertical extra sobre el suelo en studs",
            },
            align_normal: {
              type: "boolean",
              default: false,
              description: "Si es true, alinea la orientación del objeto a la inclinación de la pendiente del terreno",
            },
            raycast_distance: {
              type: "number",
              default: 250,
              description: "Alcance máximo hacia abajo en studs",
            },
          },
        },
      },
      {
        name: "duplicate_and_repeat",
        description:
          "CLONACIÓN Y MATRIZ EN SERIE (ARRAY CLONE): Duplica un modelo o prop N veces a lo largo de un vector de desplazamiento y rotación incremental (ideal para filas de farolas, árboles, vallas, escalones o postes).",
        inputSchema: {
          type: "object",
          properties: {
            target_path: {
              type: "string",
              default: "selected",
              description: "Ruta del objeto o 'selected'",
            },
            count: {
              type: "number",
              default: 3,
              description: "Número de copias a generar",
            },
            offset_step: {
              type: "array",
              items: { type: "number" },
              default: [0, 0, 40],
              description: "[DX, DY, DZ] separación incremental entre cada copia en studs",
            },
            rotation_step: {
              type: "array",
              items: { type: "number" },
              default: [0, 0, 0],
              description: "[DRX, DRY, DRZ] rotación incremental entre cada copia en grados",
            },
            parent: {
              type: "string",
              default: "City/Props",
              description: "Carpeta destino para los clones",
            },
          },
        },
      },
      {
        name: "measure_distance",
        description:
          "MEDICIÓN ESPACIAL Y LÍNEA DE VISIÓN (LEVEL DESIGN METRICS): Mide distancia euclídea 3D, distancia horizontal XZ, desnivel vertical Y, pendiente en grados y comprueba si existe línea de visión directa (sin obstáculos) entre dos puntos o dos objetos de Workspace.",
        inputSchema: {
          type: "object",
          properties: {
            point_a: {
              type: "array",
              items: { type: "number" },
              description: "[X, Y, Z] punto A de origen",
            },
            point_b: {
              type: "array",
              items: { type: "number" },
              description: "[X, Y, Z] punto B de destino",
            },
            object_a_path: {
              type: "string",
              description: "Ruta del objeto A (opcional si se usan puntos)",
            },
            object_b_path: {
              type: "string",
              description: "Ruta del objeto B (opcional si se usan puntos)",
            },
            check_line_of_sight: {
              type: "boolean",
              default: true,
              description: "Disparar raycast entre A y B para comprobar línea de visión despejada",
            },
          },
        },
      },
      {
        name: "find_objects",
        description:
          "BUSCADOR Y FILTRADO AVANZADO DE WORKSPACE: Encuentra instancias que coincidan con criterios combinables (nombre, ClassName, material, tag de CollectionService) dentro de una carpeta o en todo el mapa.",
        inputSchema: {
          type: "object",
          properties: {
            query_name: {
              type: "string",
              description: "Texto contenido en el nombre del objeto (búsqueda parcial case-insensitive)",
            },
            class_name: {
              type: "string",
              description: "Clase de Roblox (ej: 'Model', 'Part', 'WedgePart', 'PointLight', 'Seat')",
            },
            material: {
              type: "string",
              description: "Material de la parte (ej: 'SmoothPlastic', 'Neon', 'WoodPlanks')",
            },
            tag: {
              type: "string",
              description: "Tag de CollectionService (ej: 'Building', 'Door', 'Road_Ramp')",
            },
            scope_path: {
              type: "string",
              default: "Workspace",
              description: "Carpeta donde limitar la búsqueda",
            },
            max_results: {
              type: "number",
              default: 30,
              description: "Máximo número de coincidencias a retornar",
            },
          },
        },
      },
      {
        name: "audit_performance",
        description:
          "AUDITORÍA FORENSE DE RENDIMIENTO & ANTI-LAG: Escanea Workspace o una subcarpeta para auditar partes no ancladas (riesgo de colapso de físicas), colisiones innecesarias en partes minúsculas, modelos sin StreamingMesh LOD, luces con sombras excesivas y contenedores vacíos.",
        inputSchema: {
          type: "object",
          properties: {
            target_path: {
              type: "string",
              default: "Workspace",
              description: "Carpeta a auditar (ej: 'Workspace' o 'City')",
            },
          },
        },
      },
      {
        name: "optimize_workspace",
        description:
          "ESCUDO DE RENDIMIENTO AUTOMÁTICO EN 1 CLIC: Optimiza y limpia el Workspace: ancla partes estáticas sueltas, desactiva CanTouch/CanQuery en partes decorativas pequeñas, activa StreamingMesh LOD en modelos complejos, desactiva sombras en piezas diminutas y elimina carpetas vacías.",
        inputSchema: {
          type: "object",
          properties: {
            target_path: {
              type: "string",
              default: "Workspace",
              description: "Carpeta a optimizar",
            },
            anchor_static: {
              type: "boolean",
              default: true,
              description: "Anclar todas las partes desancladas para evitar lag de físicas",
            },
            optimize_collisions: {
              type: "boolean",
              default: true,
              description: "Desactivar CanTouch y CanQuery en piezas decorativas pequeñas",
            },
            enable_streaming_lod: {
              type: "boolean",
              default: true,
              description: "Activar LevelOfDetail = StreamingMesh en modelos con más de 8 partes",
            },
            disable_small_shadows: {
              type: "boolean",
              default: true,
              description: "Desactivar CastShadow en piezas menores de 3 studs",
            },
            clean_empty: {
              type: "boolean",
              default: true,
              description: "Eliminar carpetas y modelos vacíos huérfanos",
            },
          },
        },
      },
      {
        name: "replace_material_or_color",
        description:
          "CAMBIADOR EN LOTE DE MATERIALES O PALETAS: Sustituye en masa un material por otro (ej: SmoothPlastic a Concrete) o actualiza colores RGB en un modelo, distrito o carpeta.",
        inputSchema: {
          type: "object",
          properties: {
            target_path: {
              type: "string",
              default: "Workspace",
              description: "Carpeta o modelo donde aplicar el cambio",
            },
            source_material: {
              type: "string",
              description: "Material actual a buscar (ej: 'SmoothPlastic')",
            },
            target_material: {
              type: "string",
              description: "Nuevo material PBR (ej: 'Concrete', 'Brick', 'Sandstone')",
            },
            source_color: {
              type: "array",
              items: { type: "number" },
              description: "[R, G, B] color aproximado a reemplazar",
            },
            target_color: {
              type: "array",
              items: { type: "number" },
              description: "[R, G, B] nuevo color resultante",
            },
          },
        },
      },
      {
        name: "focus_camera",
        description:
          "TELETRANSPORTE Y ENFOQUE DE CÁMARA DE STUDIO: Orienta y posiciona la cámara de Roblox Studio (CurrentCamera) para enfocar inmediatamente un objeto o posición desde varios ángulos ('perspective_overhead', 'front', 'top_down', 'orbit') sin tener que volar manualmente.",
        inputSchema: {
          type: "object",
          properties: {
            target_path: {
              type: "string",
              default: "selected",
              description: "Ruta del objeto a enfocar o 'selected'",
            },
            position: {
              type: "array",
              items: { type: "number" },
              description: "[X, Y, Z] coordenadas a enfocar si no se especifica objeto",
            },
            view_mode: {
              type: "string",
              enum: ["perspective_overhead", "front", "top_down", "orbit"],
              default: "perspective_overhead",
              description: "Ángulo de encuadre de la cámara",
            },
            distance: {
              type: "number",
              description: "Distancia en studs desde el objetivo (automático según tamaño si se omite)",
            },
          },
        },
      },
      {
        name: "adjust_lighting",
        description:
          "AJUSTES DE ILUMINACIÓN Y CIELO EN TIEMPO REAL: Modifica propiedades dinámicas del servicio Lighting (ClockTime, ExposureCompensation, Brightness, OutdoorAmbient, FogEnd, FogColor) en directo en Roblox Studio.",
        inputSchema: {
          type: "object",
          properties: {
            clock_time: {
              type: "number",
              description: "Hora del día (0 a 24, ej: 14.5 para las 14:30h)",
            },
            exposure: {
              type: "number",
              description: "Compensación de exposición (-3 a 3)",
            },
            brightness: {
              type: "number",
              description: "Brillo de la luz ambiental (0 a 5)",
            },
            outdoor_ambient: {
              type: "array",
              items: { type: "number" },
              description: "[R, G, B] color de luz ambiental exterior",
            },
            fog_end: {
              type: "number",
              description: "Distancia máxima de niebla en studs",
            },
            fog_color: {
              type: "array",
              items: { type: "number" },
              description: "[R, G, B] color de la niebla",
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
        districtType: args.district_type || "commercial_downtown",
        streetWidth: args.street_width ?? 28,
        sidewalkWidth: args.sidewalk_width ?? 8,
        seed: args.seed ?? 54321,
        hasFurniture: args.has_furniture ?? true,
        hasPowerLines: args.has_power_lines ?? true,
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
            text: `🏙️ Distrito Urbano / Suburbano AAA '${args.name || "Downtown_District"}' generado exitosamente:\n- Tipo de distrito: ${args.district_type || "commercial_downtown"} (Estilo: ${args.style || "modern_downtown"})\n- Dimensiones: ${args.size ? args.size.join("x") : "240x240"} studs en centro [${(args.center || [0, 0]).join(", ")}]\n- Calzadas con asfalto, bordillos de granito, imbornales y pasos de cebra peatonales.\n- Arquitectura: ${args.district_type === "residential_suburb" ? "Casas unifamiliares con tejados a dos aguas, porches, chimeneas, garajes, driveways y buzones" : "Edificios comerciales orientados a la calle con portales, rótulos 3D iluminados y callejones con dumpsters"}.\n- Red de postes de madera con cables eléctricos aéreos: ${args.has_power_lines !== false ? "Instalada" : "Desactivada"}.\n- Plaza central con fuente: ${args.has_plaza !== false ? "Activa" : "Desactivada"}.\n- Mobiliario urbano desplegado: ${args.has_furniture !== false ? "Farolas con sombras, árboles, bancos y bocas de incendio" : "Desactivado"}.\n- Terreno nivelado automáticamente: ${args.align_to_terrain !== false ? "Sí" : "No"}.`,
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

    if (name === "build_house") {
      const luau = generateHouseLuau({
        name: args.name || "Suburban_House",
        position: args.position,
        lotSize: args.lot_size || [56, 72],
        style: args.style || "suburban_bungalow",
        seed: args.seed ?? 2024,
        hasGarage: args.has_garage ?? true,
        hasPorch: args.has_porch ?? true,
        hasFence: args.has_fence ?? true,
        hasYardProps: args.has_yard_props ?? true,
        parent: args.parent || "City/Houses",
      });

      await sendToRoblox(luau, `Build Realistic House (${args.name || "House"})`, {}, 30000);
      stats = { house: args.name || "Suburban_House", style: args.style || "suburban_bungalow", position: args.position };

      return {
        content: [
          {
            type: "text",
            text: `🏡 Casa Residencial Estilo GTA San Andreas '${args.name || "Suburban_House"}' construida exitosamente:\n- Ubicación: [${args.position.join(", ")}]\n- Estilo: ${args.style || "suburban_bungalow"} (Parcela: ${(args.lot_size || [56, 72]).join("x")} studs)\n- Tejado a dos aguas con aleros volados y chimenea de ladrillo vista.\n- Porche delantero cubierto con escalones, barandilla de madera, felpudo y farol colgante.\n- Puerta de entrada con manilla de latón y ventanas con contraventanas de madera (shutters).\n- Garaje adosado con portón seccional y entrada de hormigón (driveway).\n- Jardín delantero con césped, camino de losas y buzón de correos americano a pie de calle.\n- Patio trasero vallado con barbacoa y cubos de basura.`,
          },
        ],
      };
    }

    if (name === "build_landmark") {
      const luau = generateLandmarkLuau({
        type: args.type || "gas_station",
        name: args.name,
        position: args.position,
        rotationY: args.rotation_y ?? 0,
        seed: args.seed ?? 5050,
        parent: args.parent || "City/Landmarks",
      });

      await sendToRoblox(luau, `Build Landmark (${args.type || "gas_station"})`, {}, 35000);
      stats = { type: args.type || "gas_station", position: args.position };

      return {
        content: [
          {
            type: "text",
            text: `🏛️ Hito Urbano '${args.name || args.type}' (${args.type}) construido exitosamente en [${args.position.join(", ")}]:\n- Modelo con nivel de detalle StreamingMesh y LOD optimizado.\n- Desplegado en '${args.parent || "City/Landmarks"}'.`,
          },
        ],
      };
    }

    if (name === "place_traffic_signage") {
      const luau = generateTrafficSignageLuau({
        type: args.type || "intersection_traffic_light",
        position: args.position,
        rotationY: args.rotation_y ?? 0,
        streetA: args.street_a || "GROVE ST",
        streetB: args.street_b || "GANTON AVE",
        speedLimit: args.speed_limit ?? 35,
        arrowType: args.arrow_type || "straight_and_turn",
        parent: args.parent || "City/Signage",
      });

      await sendToRoblox(luau, `Place Traffic Signage (${args.type})`, {}, 15000);
      stats = { type: args.type, position: args.position };

      return {
        content: [
          {
            type: "text",
            text: `🚦 Señalización de tráfico '${args.type}' colocada exitosamente en [${args.position.join(", ")}].`,
          },
        ],
      };
    }

    if (name === "build_elevated_highway") {
      const luau = generateElevatedHighwayLuau({
        name: args.name || "Elevated_Freeway",
        startPoint: args.start_point || [0, 22, -150],
        endPoint: args.end_point || [0, 22, 150],
        roadWidth: args.road_width ?? 36,
        elevation: args.elevation ?? 22,
        includePiers: args.include_piers ?? true,
        includeGantrySign: args.include_gantry_sign ?? true,
        includeRamp: args.include_ramp ?? false,
        rampSide: args.ramp_side || "Right",
        parent: args.parent || "City/Highways",
      });

      await sendToRoblox(luau, `Build Elevated Highway (${args.name || "Freeway"})`, {}, 35000);
      stats = { highway: args.name || "Elevated_Freeway", start: args.start_point, end: args.end_point };

      return {
        content: [
          {
            type: "text",
            text: `🛣️ Autopista elevada '${args.name || "Elevated_Freeway"}' construida exitosamente:\n- Tramo: [${(args.start_point || [0, 22, -150]).join(", ")}] ➔ [${(args.end_point || [0, 22, 150]).join(", ")}]\n- Ancho: ${args.road_width ?? 36} studs (4 carriles con barreras New Jersey)\n- Pilares macizos en T: ${args.include_piers !== false ? "Instalados cada 60 studs" : "Sin pilares"}\n- Pórtico verde interestatal: ${args.include_gantry_sign !== false ? "Instalado" : "Desactivado"}\n- Rampa conectada al suelo: ${args.include_ramp ? "Sí (" + (args.ramp_side || "Right") + ")" : "No"}.`,
          },
        ],
      };
    }

    if (name === "build_parking_lot") {
      const luau = generateParkingLotLuau({
        name: args.name || "Commercial_Parking_Lot",
        center: args.center || [0, 0, 0],
        size: args.size || [90, 80],
        rows: args.rows ?? 2,
        includeLandscaping: args.include_landscaping ?? true,
        includeLightPoles: args.include_light_poles ?? true,
        includePayStation: args.include_pay_station ?? true,
        includeBarrierGate: args.include_barrier_gate ?? true,
        parent: args.parent || "City/Parking",
      });

      await sendToRoblox(luau, `Build Parking Lot (${args.name || "Parking"})`, {}, 30000);
      stats = { parking: args.name || "Commercial_Parking_Lot", center: args.center || [0, 0, 0] };

      return {
        content: [
          {
            type: "text",
            text: `🅿️ Estacionamiento comercial '${args.name || "Commercial_Parking_Lot"}' generado exitosamente:\n- Dimensiones: ${(args.size || [90, 80]).join("x")} studs en centro [${(args.center || [0, 0, 0]).join(", ")}]\n- Plazas marcadas con topes de rueda de hormigón (wheel stops) y plazas PMR (azul).\n- Isletas ajardinadas con palmeras: ${args.include_landscaping !== false ? "Sí" : "No"}\n- Torres de iluminación de estacionamiento: ${args.include_light_poles !== false ? "Sí" : "No"}\n- Cajero automático de pago y barrera de acceso: ${args.include_pay_station !== false ? "Sí" : "No"}.`,
          },
        ],
      };
    }

    if (name === "spawn_palm_tree") {
      const luau = generateCaliforniaPalmLuau({
        position: args.position,
        height: args.height ?? 32,
        seed: args.seed ?? 101,
        parent: args.parent || "City/Nature",
      });

      await sendToRoblox(luau, "Spawn California Palm Tree", {}, 15000);
      stats = { palmHeight: args.height ?? 32, position: args.position };

      return {
        content: [
          {
            type: "text",
            text: `🌴 Palmera californiana gigante (${args.height ?? 32} studs de altura) plantada exitosamente en [${args.position.join(", ")}].`,
          },
        ],
      };
    }

    if (name === "build_pocket_park") {
      const luau = generatePocketParkLuau({
        name: args.name || "Suburban_Pocket_Park",
        center: args.center || [0, 0, 0],
        size: args.size || [80, 80],
        hasGazebo: args.has_gazebo ?? true,
        hasFountain: args.has_fountain ?? true,
        parent: args.parent || "City/Parks",
      });

      await sendToRoblox(luau, `Build Pocket Park (${args.name || "Park"})`, {}, 30000);
      stats = { park: args.name || "Suburban_Pocket_Park", center: args.center || [0, 0, 0] };

      return {
        content: [
          {
            type: "text",
            text: `🌳 Parque de bolsillo '${args.name || "Suburban_Pocket_Park"}' generado exitosamente:\n- Dimensiones: ${(args.size || [80, 80]).join("x")} studs en centro [${(args.center || [0, 0, 0]).join(", ")}]\n- Caminos de grava, pradera de césped, parterres de flores y palmeras californianas.\n- Cenador/Gazebo de madera hexagonal: ${args.has_gazebo !== false ? "Instalado" : "No"}\n- Fuente ornamental de agua: ${args.has_fountain !== false ? "Instalada" : "No"}\n- Bancos peatonales y farolas victorianas perimetrales.`,
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

    if (name === "get_selection") {
      const result = await sendToRoblox("", "Get Selection", { type: "get_selection" }, 20000);
      const data = result.data || {};
      const count = data.count || 0;
      const items = data.items || [];

      if (count === 0) {
        return {
          content: [
            {
              type: "text",
              text: `ℹ️ No hay ningún objeto seleccionado actualmente en Roblox Studio.\n💡 Haz clic en una parte o modelo en el Viewport o Explorer de Studio y vuelve a consultar, o indica su nombre/ruta.`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: `🎯 Objetos seleccionados en Roblox Studio (${count}):\n\n\`\`\`json\n${JSON.stringify(items, null, 2)}\n\`\`\``,
          },
        ],
      };
    }

    if (name === "set_selection") {
      const targetPaths = args.target_paths || (args.target_path ? [args.target_path] : []);
      const result = await sendToRoblox(
        "",
        "Set Selection",
        { type: "set_selection", target_paths: targetPaths },
        20000
      );
      return {
        content: [
          {
            type: "text",
            text: `🎯 Selección establecida en Roblox Studio (${result.data?.count || 0} objetos seleccionados):\n- Rutas: ${targetPaths.join(", ")}`,
          },
        ],
      };
    }

    if (name === "transform_object") {
      const luau = generateTransformObjectLuau({
        targetPath: args.target_path || "selected",
        position: args.position,
        offset: args.offset,
        rotation: args.rotation,
        rotationOffset: args.rotation_offset,
        snapGrid: args.snap_grid ?? 0,
      });

      const result = await sendToRoblox(luau, `Transform Object (${args.target_path || "Selection"})`, {}, 25000);
      return {
        content: [
          {
            type: "text",
            text: `📐 Objeto transformado exitosamente:\n\n\`\`\`json\n${JSON.stringify(result.data || {}, null, 2)}\n\`\`\``,
          },
        ],
      };
    }

    if (name === "align_to_surface") {
      const luau = generateAlignToSurfaceLuau({
        targetPath: args.target_path || "selected",
        offsetY: args.offset_y ?? 0,
        alignNormal: args.align_normal ?? false,
        raycastDistance: args.raycast_distance ?? 250,
      });

      const result = await sendToRoblox(luau, `Align to Surface (${args.target_path || "Selection"})`, {}, 25000);
      return {
        content: [
          {
            type: "text",
            text: `🧲 Objeto asentado al suelo exitosamente:\n\n\`\`\`json\n${JSON.stringify(result.data || {}, null, 2)}\n\`\`\``,
          },
        ],
      };
    }

    if (name === "duplicate_and_repeat") {
      const luau = generateDuplicateAndRepeatLuau({
        targetPath: args.target_path || "selected",
        count: args.count ?? 3,
        offsetStep: args.offset_step || [0, 0, 40],
        rotationStep: args.rotation_step || [0, 0, 0],
        parent: args.parent || "City/Props",
      });

      const result = await sendToRoblox(luau, `Duplicate and Repeat (${args.count ?? 3} copies)`, {}, 30000);
      return {
        content: [
          {
            type: "text",
            text: `🔁 Clonación en serie completada:\n\n\`\`\`json\n${JSON.stringify(result.data || {}, null, 2)}\n\`\`\``,
          },
        ],
      };
    }

    if (name === "measure_distance") {
      const luau = generateMeasureDistanceLuau({
        pointA: args.point_a,
        pointB: args.point_b,
        objectAPath: args.object_a_path,
        objectBPath: args.object_b_path,
        checkLineOfSight: args.check_line_of_sight ?? true,
      });

      const result = await sendToRoblox(luau, "Measure Distance & Sight", { isQuery: true }, 25000);
      return {
        content: [
          {
            type: "text",
            text: `📏 Medición espacial completada:\n\n\`\`\`json\n${JSON.stringify(result.data || {}, null, 2)}\n\`\`\``,
          },
        ],
      };
    }

    if (name === "find_objects") {
      const luau = generateFindObjectsLuau({
        queryName: args.query_name,
        className: args.class_name,
        material: args.material,
        tag: args.tag,
        scopePath: args.scope_path || "Workspace",
        maxResults: args.max_results ?? 30,
      });

      const result = await sendToRoblox(luau, "Find Objects Query", { isQuery: true }, 25000);
      return {
        content: [
          {
            type: "text",
            text: `🔎 Búsqueda de objetos en '${args.scope_path || "Workspace"}' (${result.data?.count || 0} encontrados):\n\n\`\`\`json\n${JSON.stringify(result.data || {}, null, 2)}\n\`\`\``,
          },
        ],
      };
    }

    if (name === "audit_performance") {
      const luau = generateAuditPerformanceLuau({
        targetPath: args.target_path || "Workspace",
      });

      const result = await sendToRoblox(luau, "Audit Performance", { isQuery: true }, 30000);
      return {
        content: [
          {
            type: "text",
            text: `🛡️ Diagnóstico de Rendimiento para '${args.target_path || "Workspace"}':\n\n\`\`\`json\n${JSON.stringify(result.data || {}, null, 2)}\n\`\`\``,
          },
        ],
      };
    }

    if (name === "optimize_workspace") {
      const luau = generateOptimizeWorkspaceLuau({
        targetPath: args.target_path || "Workspace",
        anchorStatic: args.anchor_static ?? true,
        optimizeCollisions: args.optimize_collisions ?? true,
        enableStreamingLOD: args.enable_streaming_lod ?? true,
        disableSmallShadows: args.disable_small_shadows ?? true,
        cleanEmpty: args.clean_empty ?? true,
      });

      const result = await sendToRoblox(luau, "Optimize Workspace Performance", {}, 35000);
      return {
        content: [
          {
            type: "text",
            text: `⚡ Optimización de Workspace aplicada exitosamente:\n\n\`\`\`json\n${JSON.stringify(result.data || {}, null, 2)}\n\`\`\``,
          },
        ],
      };
    }

    if (name === "replace_material_or_color") {
      const luau = generateReplaceMaterialOrColorLuau({
        targetPath: args.target_path || "Workspace",
        sourceMaterial: args.source_material,
        targetMaterial: args.target_material,
        sourceColor: args.source_color,
        targetColor: args.target_color,
      });

      const result = await sendToRoblox(luau, "Replace Material or Color Batch", {}, 30000);
      return {
        content: [
          {
            type: "text",
            text: `🎨 Reemplazo de materiales/colores completado:\n\n\`\`\`json\n${JSON.stringify(result.data || {}, null, 2)}\n\`\`\``,
          },
        ],
      };
    }

    if (name === "focus_camera") {
      const luau = generateFocusCameraLuau({
        targetPath: args.target_path || "selected",
        position: args.position,
        viewMode: args.view_mode || "perspective_overhead",
        distance: args.distance,
      });

      const result = await sendToRoblox(luau, "Focus Studio Camera", { isQuery: true }, 15000);
      return {
        content: [
          {
            type: "text",
            text: `👁️ Cámara de Roblox Studio enfocada exitosamente:\n\n\`\`\`json\n${JSON.stringify(result.data || {}, null, 2)}\n\`\`\``,
          },
        ],
      };
    }

    if (name === "adjust_lighting") {
      const luau = generateAdjustLightingLuau({
        clockTime: args.clock_time,
        exposure: args.exposure,
        brightness: args.brightness,
        outdoorAmbient: args.outdoor_ambient,
        fogEnd: args.fog_end,
        fogColor: args.fog_color,
      });

      const result = await sendToRoblox(luau, "Adjust Lighting Properties", {}, 15000);
      return {
        content: [
          {
            type: "text",
            text: `☀️ Propiedades de iluminación actualizadas en tiempo real:\n\n\`\`\`json\n${JSON.stringify(result.data || {}, null, 2)}\n\`\`\``,
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
