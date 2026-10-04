/**
 * Catálogo de Estilos Arquitectónicos y Paletas de Materiales PBR AAA para Roblox.
 * Define la coherencia estética para fachadas, portales, escaparates, molduras,
 * cornisas, balcones, azoteas, rótulos comerciales y mobiliario urbano.
 */

export const STYLE_PRESETS = {
  modern_downtown: {
    name: "Modern Downtown",
    description: "Distrito corporativo contemporáneo con piedra pulida, hormigón arquitectónico, titanio, vidrio templado y acabados de lujo",
    facadeMaterials: ["Concrete", "Granite", "Slate"],
    facadeColors: [
      [238, 240, 244], // Blanco titanio moderno
      [180, 185, 195], // Gris arquitectónico neutro
      [55, 60, 72],    // Gris pizarra corporativo profundo
      [215, 218, 222], // Platino claro
      [90, 95, 105],   // Grafito medio
    ],
    pillarMaterial: "Metal",
    pillarColor: [40, 44, 52], // Grafito oscuro mate
    corniceMaterial: "Concrete",
    corniceColor: [165, 170, 178],
    baseboardMaterial: "Granite",
    baseboardColor: [50, 54, 62],
    glassMaterial: "Glass",
    glassColor: [110, 150, 195],
    glassTransparency: 0.32,
    glassReflectance: 0.55,
    doorMaterial: "Metal",
    doorColor: [35, 38, 45],
    doorHandleColor: [220, 225, 235],
    awningColors: [
      [28, 48, 88],    // Azul marino oscuro
      [135, 35, 45],   // Borgoña ejecutivo
      [32, 34, 38],    // Carbón antracita
      [42, 75, 58],    // Verde botella
    ],
    awningMaterial: "Fabric",
    roofFloorMaterial: "Concrete",
    roofFloorColor: [78, 82, 88],
    parapetMaterial: "Concrete",
    parapetColor: [145, 150, 158],
    balconyMaterial: "Metal",
    balconyColor: [40, 44, 52],
    accentLightColor: [245, 248, 255], // Blanco LED puro
    warmInteriorColor: [255, 232, 180], // Luz cálida oficinas ejecutivas
    coolInteriorColor: [215, 238, 255], // Luz fría LED corporativa
    signNames: [
      "NEXUS FINANCIAL",
      "HORIZON TOWER",
      "LUMEN LABS",
      "APEX CAPITAL",
      "METRO COFFEE ROASTERS",
      "VERITAS LAW",
      "ZENITH TECH",
      "THE ARCHITECTS CAFE",
    ],
    signGlowColors: [
      [255, 240, 210],
      [200, 235, 255],
      [255, 200, 120],
      [240, 245, 255],
    ],
    hasFireEscapes: false,
    hasBalconies: true,
    densityRange: { minFloors: 6, maxFloors: 18 },
  },

  classic_brick: {
    name: "Classic Brick / Brownstone & Pre-War",
    description: "Arquitectura clásica tipo Manhattan Brownstone, ladrillo visto texturizado, sills de arenisca, escaleras de incendios y forja negra",
    facadeMaterials: ["Brick"],
    facadeColors: [
      [158, 65, 48],  // Ladrillo terracota cálido
      [122, 46, 36],  // Ladrillo quemado oscuro clinker
      [175, 82, 58],  // Ladrillo rojizo colonial
      [102, 44, 38],  // Ladrillo vintage pre-war
      [142, 60, 46],  // Terracota tostada
    ],
    pillarMaterial: "Sandstone",
    pillarColor: [230, 220, 200], // Arenisca crema cálida
    corniceMaterial: "Sandstone",
    corniceColor: [235, 225, 208],
    baseboardMaterial: "Cobblestone",
    baseboardColor: [95, 90, 85],
    glassMaterial: "Glass",
    glassColor: [215, 225, 235],
    glassTransparency: 0.40,
    glassReflectance: 0.30,
    doorMaterial: "WoodPlanks",
    doorColor: [75, 42, 28], // Caoba noble
    doorHandleColor: [215, 175, 60], // Latón pulido
    awningColors: [
      [42, 82, 52],   // Verde bosque clásico
      [138, 38, 32],  // Borgoña tradicional
      [175, 132, 45], // Mostaza vintage
      [36, 40, 48],   // Negro lona
    ],
    awningMaterial: "Fabric",
    roofFloorMaterial: "Concrete",
    roofFloorColor: [90, 85, 80],
    parapetMaterial: "Brick",
    parapetColor: [142, 58, 44],
    balconyMaterial: "Metal",
    balconyColor: [32, 34, 38], // Forja negra
    accentLightColor: [255, 210, 135], // Vapor de sodio / tungsteno cálido
    warmInteriorColor: [255, 225, 160],
    coolInteriorColor: [240, 240, 225],
    signNames: [
      "THE BROOKLYN ROAST",
      "HARBOR BOOKS",
      "CORNER DELI & MARKET",
      "VINTAGE PHARMACY",
      "CHELSEA BISTRO",
      "HUDSON ANTIQUES",
      "LOMBARD BAKERY",
      "UNION SQUARE CAFE",
    ],
    signGlowColors: [
      [255, 215, 140],
      [255, 195, 100],
      [255, 240, 200],
      [245, 180, 80],
    ],
    hasFireEscapes: true,
    hasBalconies: true,
    densityRange: { minFloors: 3, maxFloors: 8 },
  },

  cyberpunk: {
    name: "Cyberpunk / Neo-Metropolis",
    description: "Megaestructuras distópicas con chapa acanalada, cables aéreos, paneles de carbono y rótulos de neón vibrantes",
    facadeMaterials: ["Concrete", "DiamondPlate", "DiamondPlate"],
    facadeColors: [
      [24, 26, 32],   // Negro carbón profundo
      [36, 38, 46],   // Gris oscuro industrial
      [20, 22, 26],   // Obsidiana
      [42, 45, 54],   // Metal oxidado oscuro
    ],
    pillarMaterial: "DiamondPlate",
    pillarColor: [50, 56, 65],
    corniceMaterial: "Metal",
    corniceColor: [32, 35, 42],
    baseboardMaterial: "Metal",
    baseboardColor: [18, 20, 24],
    glassMaterial: "Glass",
    glassColor: [35, 28, 55],
    glassTransparency: 0.28,
    glassReflectance: 0.70,
    doorMaterial: "DiamondPlate",
    doorColor: [45, 50, 58],
    doorHandleColor: [0, 240, 255], // Resplandor cian
    awningColors: [
      [255, 0, 95],   // Rosa neón magenta
      [0, 240, 255],  // Cian ciberpunk
      [255, 175, 0],  // Ámbar neón
      [140, 0, 255],  // Púrpura eléctrico
    ],
    awningMaterial: "Neon",
    roofFloorMaterial: "Metal",
    roofFloorColor: [28, 30, 35],
    parapetMaterial: "DiamondPlate",
    parapetColor: [44, 48, 56],
    balconyMaterial: "Metal",
    balconyColor: [28, 30, 36],
    accentLightColor: [0, 240, 255], // Neón cian
    warmInteriorColor: [255, 0, 110], // Neón rosa interior
    coolInteriorColor: [0, 220, 255], // Neón cian interior
    signNames: [
      "SYNTH CORP",
      "RAMEN 24/7",
      "NEO-TOKYO CYBER",
      "MATRIX DATA",
      "GLITCH BAR",
      "AUGMENT CLINIC",
      "VOID CLUB",
      "NEBULA NIGHTS",
    ],
    signGlowColors: [
      [255, 0, 110],
      [0, 240, 255],
      [255, 170, 0],
      [160, 30, 255],
    ],
    hasFireEscapes: true,
    hasBalconies: true,
    densityRange: { minFloors: 8, maxFloors: 22 },
  },

  commercial_avenue: {
    name: "Commercial Avenue & Boulevard",
    description: "Gran bulevar europeo/americano con plantas bajas comerciales de doble altura, terrazas con veladores, molduras elegantes y toldos clásicos",
    facadeMaterials: ["Sandstone", "Concrete", "Marble"],
    facadeColors: [
      [232, 226, 214], // Piedra caliza parisina
      [218, 210, 196], // Arena suave
      [242, 238, 230], // Mármol travertino claro
      [195, 186, 172], // Piedra de sillería ocre
    ],
    pillarMaterial: "Marble",
    pillarColor: [180, 172, 160],
    corniceMaterial: "Sandstone",
    corniceColor: [225, 216, 202],
    baseboardMaterial: "Granite",
    baseboardColor: [85, 80, 75],
    glassMaterial: "Glass",
    glassColor: [160, 200, 230],
    glassTransparency: 0.35,
    glassReflectance: 0.40,
    doorMaterial: "WoodPlanks",
    doorColor: [50, 35, 25],
    doorHandleColor: [220, 185, 75], // Latón dorado
    awningColors: [
      [145, 35, 45],   // Rojo carmín
      [25, 65, 115],   // Azul real
      [45, 85, 55],    // Verde oliva
      [175, 140, 60],  // Ocre mostaza
    ],
    awningMaterial: "Fabric",
    roofFloorMaterial: "Concrete",
    roofFloorColor: [85, 82, 80],
    parapetMaterial: "Sandstone",
    parapetColor: [215, 206, 194],
    balconyMaterial: "Metal",
    balconyColor: [35, 36, 40],
    accentLightColor: [255, 228, 175], // Luz cálida de restaurante
    warmInteriorColor: [255, 235, 190],
    coolInteriorColor: [230, 235, 245],
    signNames: [
      "BISTRO DE PARIS",
      "BOUTIQUE ELEGANCE",
      "LA PETITE PATISSERIE",
      "ROSE & THORN FLORIST",
      "AVENUE APPAREL",
      "GRAND RESTAURANT",
      "CAFE DES ARTS",
      "JEWELRY & WATCHES",
    ],
    signGlowColors: [
      [255, 220, 150],
      [255, 240, 210],
      [255, 190, 110],
      [245, 225, 190],
    ],
    hasFireEscapes: false,
    hasBalconies: true,
    densityRange: { minFloors: 4, maxFloors: 10 },
  },

  industrial: {
    name: "Industrial Warehouse & Docklands",
    description: "Fábricas y muelles portuarios con ladrillo clinker, vigas de acero I-beam, chapa oxidada, ventanales de fábrica cuadriculados y portones de carga",
    facadeMaterials: ["Brick", "DiamondPlate", "Concrete"],
    facadeColors: [
      [135, 58, 42],  // Ladrillo clinker oscuro
      [92, 96, 104],  // Hormigón nave industrial
      [118, 108, 98], // Chapa envejecida ocre
      [68, 72, 78],   // Acero naviero
    ],
    pillarMaterial: "Metal",
    pillarColor: [45, 48, 54],
    corniceMaterial: "Metal",
    corniceColor: [40, 44, 50],
    baseboardMaterial: "Concrete",
    baseboardColor: [65, 68, 72],
    glassMaterial: "Glass",
    glassColor: [170, 185, 195],
    glassTransparency: 0.42,
    glassReflectance: 0.25,
    doorMaterial: "Metal",
    doorColor: [55, 58, 65],
    doorHandleColor: [235, 180, 40], // Palanca amarilla de seguridad
    awningColors: [
      [65, 70, 78],
      [115, 82, 52],
      [42, 45, 50],
    ],
    awningMaterial: "DiamondPlate",
    roofFloorMaterial: "DiamondPlate",
    roofFloorColor: [75, 78, 82],
    parapetMaterial: "Metal",
    parapetColor: [55, 60, 66],
    balconyMaterial: "DiamondPlate",
    balconyColor: [50, 54, 60],
    accentLightColor: [255, 195, 75], // Lámpara de vapor de sodio
    warmInteriorColor: [255, 205, 95],
    coolInteriorColor: [200, 220, 235],
    signNames: [
      "TERMINAL 4 LOGISTICS",
      "DOCKYARD IRONWORKS",
      "APEX STORAGE & CARGO",
      "FOUNDRY 1898",
      "HARBOR FREIGHT & CO",
      "HEAVY DIESEL SERVICE",
      "CENTRAL COLD STORAGE",
      "PRECISION MACHINING",
    ],
    signGlowColors: [
      [255, 190, 70],
      [255, 160, 40],
      [255, 225, 140],
    ],
    hasFireEscapes: true,
    hasBalconies: false,
    densityRange: { minFloors: 2, maxFloors: 6 },
  },

  favela: {
    name: "Favela Hillside Community",
    description: "Comunidad orgánica de montaña con ladrillos huecos vistos, parches de chapa, vigas de madera y tanques azules",
    facadeMaterials: ["Brick", "Concrete", "WoodPlanks"],
    facadeColors: [
      [165, 75, 50],  // Ladrillo visto
      [115, 140, 160], // Azul descolorido pintado
      [170, 150, 115], // Arena estuco
      [140, 130, 120], // Hormigón crudo
      [80, 125, 95],  // Verde menta desvaído
    ],
    pillarMaterial: "Concrete",
    pillarColor: [120, 115, 110],
    corniceMaterial: "WoodPlanks",
    corniceColor: [90, 65, 45],
    baseboardMaterial: "Cobblestone",
    baseboardColor: [85, 80, 75],
    glassMaterial: "Glass",
    glassColor: [200, 210, 220],
    glassTransparency: 0.55,
    glassReflectance: 0.15,
    doorMaterial: "WoodPlanks",
    doorColor: [80, 55, 38],
    doorHandleColor: [160, 160, 165],
    awningColors: [
      [40, 110, 180], // Lona azul impermeable
      [130, 135, 140], // Chapa galvanizada
      [170, 60, 45],  // Lona roja
    ],
    awningMaterial: "DiamondPlate",
    roofFloorMaterial: "Concrete",
    roofFloorColor: [110, 105, 100],
    parapetMaterial: "Brick",
    parapetColor: [150, 70, 48],
    balconyMaterial: "WoodPlanks",
    balconyColor: [85, 60, 42],
    accentLightColor: [255, 215, 140],
    warmInteriorColor: [255, 220, 150],
    coolInteriorColor: [220, 230, 240],
    signNames: [
      "BAR DO ZE",
      "PADARIA CENTRAL",
      "MERCADINHO DA PAZ",
      "LANCHONETE DO MORRO",
      "OFICINA COMUNITARIA",
      "FARMACIA POPULAR",
    ],
    signGlowColors: [
      [255, 210, 120],
      [255, 180, 70],
    ],
    hasFireEscapes: false,
    hasBalconies: true,
    densityRange: { minFloors: 2, maxFloors: 5 },
  },
};

export function getStylePreset(styleName = "modern_downtown") {
  const key = (styleName || "").toLowerCase().replace(/[^a-z0-9_]/g, "_");
  return STYLE_PRESETS[key] || STYLE_PRESETS.modern_downtown;
}
