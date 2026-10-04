/**
 * Catálogo de Estilos Arquitectónicos y Paletas de Materiales PBR para Roblox.
 * Define la coherencia estética para fachadas, escaparates, molduras, azoteas y mobiliario.
 */

export const STYLE_PRESETS = {
  modern_downtown: {
    name: "Modern Downtown",
    description: "Distrito corporativo de rascacielos contemporáneos con cristal, hormigón pulido y metal",
    facadeMaterials: ["SmoothPlastic", "Concrete"],
    facadeColors: [
      [215, 220, 225], // Gris platino claro
      [185, 190, 198], // Gris arquitectónico medio
      [65, 72, 85],    // Azul pizarra corporativo
      [240, 242, 245], // Blanco titanio
    ],
    pillarMaterial: "Metal",
    pillarColor: [45, 48, 55], // Grafito oscuro
    corniceMaterial: "Concrete",
    corniceColor: [160, 165, 172],
    baseboardMaterial: "Concrete",
    baseboardColor: [80, 85, 92],
    glassMaterial: "Glass",
    glassColor: [100, 140, 185],
    glassTransparency: 0.35,
    glassReflectance: 0.4,
    awningColors: [
      [35, 65, 120],  // Azul marino
      [40, 40, 45],   // Negro carbón
      [160, 40, 40],  // Rojo borgoña
    ],
    awningMaterial: "SmoothPlastic",
    roofFloorMaterial: "Concrete",
    roofFloorColor: [75, 78, 84],
    parapetMaterial: "Concrete",
    parapetColor: [140, 145, 150],
    accentLightColor: [240, 245, 255], // Blanco LED neutro
    densityRange: { minFloors: 6, maxFloors: 16 },
  },

  classic_brick: {
    name: "Classic Brick / Brownstone",
    description: "Arquitectura clásica tipo Manhattan Brownstone, ladrillo visto, molduras crema y cornisas ornamentales",
    facadeMaterials: ["Brick"],
    facadeColors: [
      [155, 65, 48],  // Ladrillo terracota cálido
      [125, 48, 38],  // Ladrillo quemado oscuro
      [175, 85, 60],  // Ladrillo rojizo colonial
      [90, 42, 35],   // Ladrillo vintage industrial
    ],
    pillarMaterial: "Sandstone",
    pillarColor: [225, 215, 195], // Crema piedra arenisca
    corniceMaterial: "Sandstone",
    corniceColor: [230, 220, 205],
    baseboardMaterial: "Cobblestone",
    baseboardColor: [110, 105, 100],
    glassMaterial: "Glass",
    glassColor: [220, 230, 240],
    glassTransparency: 0.5,
    glassReflectance: 0.2,
    awningColors: [
      [45, 90, 55],   // Verde bosque clásico
      [135, 40, 35],  // Granate
      [180, 140, 50], // Mostaza vintage
    ],
    awningMaterial: "Fabric",
    roofFloorMaterial: "Concrete",
    roofFloorColor: [95, 90, 85],
    parapetMaterial: "Brick",
    parapetColor: [145, 60, 45],
    accentLightColor: [255, 210, 135], // Luz cálida tungsteno
    densityRange: { minFloors: 3, maxFloors: 7 },
  },

  cyberpunk: {
    name: "Cyberpunk / Neo-Metropolis",
    description: "Megaestructuras distópicas oscuras con cables vistos, metal corrugado, paneles oscuros y neones vibrantes",
    facadeMaterials: ["Concrete", "CorrugatedMetal"],
    facadeColors: [
      [28, 30, 35],   // Negro antracita
      [40, 42, 48],   // Gris oscuro industrial
      [22, 24, 28],   // Obsidiana
    ],
    pillarMaterial: "DiamondPlate",
    pillarColor: [55, 60, 68],
    corniceMaterial: "Metal",
    corniceColor: [35, 38, 44],
    baseboardMaterial: "Metal",
    baseboardColor: [20, 22, 25],
    glassMaterial: "Glass",
    glassColor: [40, 30, 60],
    glassTransparency: 0.25,
    glassReflectance: 0.65,
    awningColors: [
      [255, 0, 85],   // Rosa neón magenta
      [0, 240, 255],  // Cian neón
      [255, 175, 0],  // Ámbar
    ],
    awningMaterial: "Neon",
    roofFloorMaterial: "Metal",
    roofFloorColor: [32, 34, 38],
    parapetMaterial: "DiamondPlate",
    parapetColor: [48, 52, 60],
    accentLightColor: [0, 240, 255], // Neón cian
    densityRange: { minFloors: 8, maxFloors: 20 },
  },

  industrial: {
    name: "Industrial Dock & Warehouse",
    description: "Fábricas, muelles y almacenes logísticos con chapa oxidada, vigas de acero y ventanas cuadriculadas",
    facadeMaterials: ["CorrugatedMetal", "Concrete"],
    facadeColors: [
      [145, 110, 85], // Chapa oxidada ocre
      [90, 95, 102],  // Gris hormigón nave
      [115, 120, 128], // Acero envejecido
    ],
    pillarMaterial: "Metal",
    pillarColor: [60, 65, 72],
    corniceMaterial: "Metal",
    corniceColor: [50, 54, 60],
    baseboardMaterial: "Concrete",
    baseboardColor: [70, 72, 75],
    glassMaterial: "Glass",
    glassColor: [180, 195, 205],
    glassTransparency: 0.4,
    glassReflectance: 0.25,
    awningColors: [
      [75, 80, 85],
      [120, 85, 55],
    ],
    awningMaterial: "CorrugatedMetal",
    roofFloorMaterial: "CorrugatedMetal",
    roofFloorColor: [80, 82, 85],
    parapetMaterial: "Metal",
    parapetColor: [65, 70, 75],
    accentLightColor: [255, 195, 80], // Vapor de sodio amarillo
    densityRange: { minFloors: 2, maxFloors: 5 },
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
    awningColors: [
      [40, 110, 180], // Lona azul impermeable
      [130, 135, 140], // Chapa galvanizada
      [170, 60, 45],  // Lona roja
    ],
    awningMaterial: "CorrugatedMetal",
    roofFloorMaterial: "Concrete",
    roofFloorColor: [110, 105, 100],
    parapetMaterial: "Brick",
    parapetColor: [150, 70, 48],
    accentLightColor: [255, 215, 140],
    densityRange: { minFloors: 2, maxFloors: 5 },
  },
};

export function getStylePreset(styleName = "modern_downtown") {
  const key = styleName.toLowerCase().replace(/[^a-z0-9_]/g, "_");
  return STYLE_PRESETS[key] || STYLE_PRESETS.modern_downtown;
}
