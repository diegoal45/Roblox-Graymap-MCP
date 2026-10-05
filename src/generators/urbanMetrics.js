import { snapVal } from "./grid.js";

/**
 * Matriz Oficial de Métricas Urbanas para Roblox (Studs Standard)
 * 
 * Reglas de Proporción y Escala:
 * - 1 Stud ≈ 0.28m físicas / 0.35m visuales de personaje R15 (5 studs alto x 2 studs ancho).
 * - Coche Estándar Roblox: 8-9 studs ancho, 18-22 studs largo.
 * - Camión / Furgón: 10-11 studs ancho, 28-36 studs largo.
 */

export const URBAN_METRICS = {
  // 1. CARRILES Y SECCIONES VIALES
  LANE_WIDTH: 13,                // Ancho de rodadura de 1 carril vehicular
  SHOULDER_WIDTH: 2,             // Arcén o cuneta lateral
  MEDIAN_NARROW: 4,              // Mediana simple o con doble raya
  MEDIAN_AVENUE: 8,              // Mediana ancha ajardinada con farolas centrales
  CURB_HEIGHT: 0.65,             // Altura del bordillo de granito sobre la calzada
  CURB_WIDTH: 0.8,               // Grosor del bordillo

  // 2. JERARQUÍA DE CALZADAS (Road Widths)
  ROADS: {
    HIGHWAY_4LANE: {
      totalWidth: 68,
      lanes: 4,
      medianWidth: 6,
      hasShoulders: true,
      shoulderWidth: 5,
    },
    HIGHWAY_6LANE: {
      totalWidth: 88,
      lanes: 6,
      medianWidth: 8,
      hasShoulders: true,
      shoulderWidth: 6,
    },
    BOULEVARD_4LANE: {
      totalWidth: 56,            // 4 carriles x 13 = 52 + mediana 4 = 56
      lanes: 4,
      medianWidth: 4,
      hasSidewalks: true,
      defaultSidewalkWidth: 10,
    },
    STREET_2LANE: {
      totalWidth: 28,            // 2 carriles x 13 = 26 + 2 arcenes = 28
      lanes: 2,
      medianWidth: 0,
      hasSidewalks: true,
      defaultSidewalkWidth: 8,
    },
    STREET_WITH_PARKING: {
      totalWidth: 36,            // 2 carriles rodadura (26) + 1 banda aparcamiento (10)
      lanes: 2,
      parkingWidth: 8,
      defaultSidewalkWidth: 8,
    },
    SERVICE_ALLEY: {
      totalWidth: 16,            // Callejón trasero de servicio para camiones de basura / trapicheo
      lanes: 1,
      hasSidewalks: false,
      isPavedCobbleOrDirt: true,
    },
    CANAL_WIDTH_STANDARD: 56,    // Ancho estándar del canal pluvial tipo LA River
    CANAL_DEPTH_STANDARD: 16,    // Profundidad de excavación bajo cota de calle (Y = -16)
    CUL_DE_SAC_BULB_RADIUS: 38,  // Radio exterior de la rotonda de retorno estilo Grove St
    CUL_DE_SAC_LOT_RADIUS: 74,   // Distancia radial desde el centro del retorno a las casas
    HILL_SLOPE_MAX_CLIMB: 50,    // Desnivel vertical máximo sugerido para laderas residenciales
  },

  // 3. ACERAS Y ESPACIO PEATONAL
  SIDEWALKS: {
    NARROW: 6,                   // En callejones o zonas residenciales compactas
    STANDARD: 8,                 // En calles residenciales y secundarias
    COMMERCIAL: 10,              // En bulevares y zonas de tiendas con veladores
    AVENUE_PLAZA: 14,            // En distritos financieros o paseos arbolados
  },

  // 4. RETRANQUEOS DE EDIFICACIÓN (Setbacks desde el bordillo)
  SETBACKS: {
    COMMERCIAL_DOWNTOWN: {
      front: 0,                  // Fachada alineada a ras de acera
      side: 0,                   // Fachadas medianeras continuas
      rear: 12,                  // Patio trasero o callejón de servicio
    },
    COMMERCIAL_STRIP: {
      front: 4,                  // Pequeño alero/escaparate o terraza
      side: 2,                   // Espacio entre locales o continuo
      rear: 14,                  // Callejón con contenedores y carga
    },
    RESIDENTIAL_SUBURBAN: {
      front: 16,                 // Jardín delantero con césped y porche
      side: 6,                   // Separación lateral entre casas contiguas
      rear: 18,                  // Patio trasero con valla, barbacoa o tendedero
    },
    RESIDENTIAL_GHETTO: {
      front: 10,                 // Entrada más apretada, porche cercano a acera
      side: 4,
      rear: 12,
    },
    INDUSTRIAL_STORAGE: {
      front: 18,                 // Zona de maniobra frontal de furgonetas / báscula
      side: 8,
      rear: 10,
    },
    MOTEL_ROADSIDE: {
      front: 28,                 // Parking frontal con plazas en batería frente a habitaciones
      side: 6,
      rear: 8,
    },
    DOCKS_SEAPORT: {
      front: 24,                 // Línea de atraque y defensas de barco
      side: 12,
      rear: 20,
    },
  },

  // 5. DIMENSIONES ESTÁNDAR DE PARCELAS / SOLARES (Width X, Depth Z)
  LOT_SIZES: {
    SUBURBAN_HOUSE: { width: 48, depth: 72 },       // Parcela estándar de chalet unifamiliar
    GHETTO_BUNGALOW: { width: 40, depth: 64 },      // Casa tipo Grove Street / Ganton
    LUXURY_MANSION: { width: 72, depth: 96 },       // Villa Vinewood Hills con piscina
    COMMERCIAL_SHOP: { width: 36, depth: 52 },      // Negocio turbio / farmacia / empeño
    DOWNTOWN_HIGHRISE: { width: 64, depth: 64 },    // Rascacielos o torre de oficinas
    DOWNTOWN_TOWER_LARGE: { width: 88, depth: 88 }, // Gran rascacielos corporativo
    MOTEL_6ROOM: { width: 90, depth: 52 },          // Motel de 6 habitaciones + recepción
    MOTEL_10ROOM: { width: 138, depth: 52 },        // Motel de 10 habitaciones
    STORAGE_FACILITY: { width: 110, depth: 78 },    // Complejo de trasteros con verja
    POCKET_PARK_SMALL: { width: 48, depth: 60 },    // Parque de bolsillo con columpios
    POCKET_PARK_LARGE: { width: 80, depth: 80 },    // Plaza arbolada con fuente
    PARKING_LOT_SMALL: { width: 60, depth: 50 },    // Parking de 12 plazas con farolas
    DOCKS_FACILITY: { width: 160, depth: 110 },     // Muelle con grúa y contenedores
  },

  // 6. MANZANAS URBANAS (City Blocks)
  BLOCKS: {
    RESIDENTIAL_SUBURB: {
      width: 240,
      depth: 160,               // Permite 2 filas de 4-5 casas espalda con espalda
      centralAlleyWidth: 14,
    },
    DOWNTOWN_GRID: {
      width: 200,
      depth: 200,               // Permite 4 torres cuadradas o 1 torre + 4 locales
      centralAlleyWidth: 16,
    },
    COMMERCIAL_STRIP: {
      width: 260,
      depth: 130,               // Franja comercial frontal con parking y trastienda
      centralAlleyWidth: 14,
    },
    INDUSTRIAL_ZONE: {
      width: 280,
      depth: 220,
      centralAlleyWidth: 20,
    },
  },

  // 7. ALTURAS DE EDIFICACIÓN Y NIVELES
  HEIGHTS: {
    GROUND_FLOOR_COMMERCIAL: 14, // Planta baja comercial con escaparates altos
    GROUND_FLOOR_RESIDENTIAL: 10,// Planta baja de vivienda unifamiliar
    UPPER_FLOOR_OFFICE: 10.5,    // Pisos superiores de oficinas
    UPPER_FLOOR_RESIDENTIAL: 9.5,// Pisos superiores de viviendas
    PARAPET_ROOF: 1.5,           // Altura del antepecho/cornisa de cubierta para cobertura
    DOOR_HEIGHT: 7.5,            // Altura libre de paso de puertas
    DOOR_WIDTH: 3.8,             // Ancho de puerta simple
    DOUBLE_DOOR_WIDTH: 7.2,      // Ancho de puerta doble comercial
  },
};

/**
 * Normaliza y orienta una rotación cartesiana hacia una dirección cardinal.
 * @param {"North" | "South" | "East" | "West"} facingDirection
 * @returns {{ angleDeg: number, angleRad: number, forwardVector: [number, number, number] }}
 */
export function getFrontageTransform(facingDirection) {
  switch (facingDirection) {
    case "South":
      // El frente mira hacia +Z (hacia el Sur)
      return { angleDeg: 0, angleRad: 0, forwardVector: [0, 0, 1] };
    case "North":
      // El frente mira hacia -Z (hacia el Norte)
      return { angleDeg: 180, angleRad: Math.PI, forwardVector: [0, 0, -1] };
    case "East":
      // El frente mira hacia +X (hacia el Este)
      return { angleDeg: 90, angleRad: Math.PI / 2, forwardVector: [1, 0, 0] };
    case "West":
      // El frente mira hacia -X (hacia el Oeste)
      return { angleDeg: 270, angleRad: (3 * Math.PI) / 2, forwardVector: [-1, 0, 0] };
    default:
      return { angleDeg: 0, angleRad: 0, forwardVector: [0, 0, 1] };
  }
}

/**
 * Calcula la posición del punto medio de fachada y centro de edificio aplicando el setback
 */
export function calculateLotPlacement({
  lotCenter,
  lotSize,
  buildingFootprint,
  facingDirection = "South",
  frontSetback = 0,
}) {
  const [lotCx, lotCy, lotCz] = lotCenter;
  const [lotW, lotD] = lotSize;
  const [bldW, bldD] = buildingFootprint;
  const { angleDeg, angleRad } = getFrontageTransform(facingDirection);

  let buildingCx = lotCx;
  let buildingCz = lotCz;

  if (facingDirection === "South") {
    // El borde frontal de la parcela está en lotCz + lotD / 2
    // La fachada del edificio debe quedar en (lotCz + lotD / 2) - frontSetback
    // Por tanto el centro del edificio está en esa posición menos bldD / 2
    const frontEdgeZ = lotCz + lotD / 2;
    buildingCz = frontEdgeZ - frontSetback - bldD / 2;
  } else if (facingDirection === "North") {
    const frontEdgeZ = lotCz - lotD / 2;
    buildingCz = frontEdgeZ + frontSetback + bldD / 2;
  } else if (facingDirection === "East") {
    const frontEdgeX = lotCx + lotW / 2;
    buildingCx = frontEdgeX - frontSetback - bldD / 2;
  } else if (facingDirection === "West") {
    const frontEdgeX = lotCx - lotW / 2;
    buildingCx = frontEdgeX + frontSetback + bldD / 2;
  }

  return {
    buildingCenter: [snapVal(buildingCx, 2), lotCy, snapVal(buildingCz, 2)],
    rotationY: angleDeg,
    rotationRad: angleRad,
    facingDirection,
  };
}
