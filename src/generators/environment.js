/**
 * Motor Cinemático de Iluminación, Atmósfera y Post-Procesado AAA para Roblox Studio.
 * Inyecta Future Lighting, ColorShift (sol y sombras rebotadas), Atmosphere volumétrica,
 * Bloom con umbral afinado para neones, ColorCorrection con contraste cinematográfico y SunRays.
 * Elimina completamente el aspecto plano y apagado de los mundos.
 */

export const ENVIRONMENT_PRESETS = {
  cyberpunk_night: {
    name: "Cyberpunk Night",
    clockTime: 22.5,
    brightness: 1.4,
    ambient: [30, 36, 52],
    outdoorAmbient: [42, 48, 65],
    colorShift_Top: [0, 190, 255],     // Tinte superior cian
    colorShift_Bottom: [80, 20, 80],   // Tinte de rebote magenta
    exposureCompensation: 0.2,
    atmosphere: { density: 0.38, offset: 0.2, haze: 2.2, color: [32, 42, 65], decay: [18, 22, 38], glare: 0.25 },
    bloom: { intensity: 1.3, size: 24, threshold: 0.8 },
    colorCorrection: { contrast: 0.22, saturation: 0.32, tint: [225, 235, 255] },
    sunRays: null,
  },

  golden_hour: {
    name: "Golden Hour / Atardecer Cinemático AAA",
    clockTime: 17.5,
    brightness: 2.5,
    ambient: [80, 60, 50],
    outdoorAmbient: [155, 115, 85],
    colorShift_Top: [255, 185, 110],    // Luz solar dorada intensa
    colorShift_Bottom: [65, 85, 120],   // Sombras con tinte azul cielo complementario
    exposureCompensation: 0.1,
    atmosphere: { density: 0.28, offset: 0.12, haze: 1.6, color: [255, 175, 95], decay: [215, 125, 55], glare: 0.6 },
    bloom: { intensity: 0.7, size: 20, threshold: 0.95 },
    colorCorrection: { contrast: 0.14, saturation: 0.22, tint: [255, 240, 220] },
    sunRays: { intensity: 0.28, spread: 0.85 },
  },

  sunny_noon: {
    name: "Sunny Noon / Mediodía Nítido AAA",
    clockTime: 12.5,
    brightness: 3.0,
    ambient: [95, 100, 110],
    outdoorAmbient: [145, 150, 160],
    colorShift_Top: [255, 252, 245],    // Luz solar cálida y brillante
    colorShift_Bottom: [90, 110, 140],  // Sombras con rebote celeste
    exposureCompensation: 0.05,
    atmosphere: { density: 0.22, offset: 0.06, haze: 0.6, color: [215, 230, 250], decay: [185, 205, 230], glare: 0.35 },
    bloom: { intensity: 0.45, size: 16, threshold: 1.3 },
    colorCorrection: { contrast: 0.10, saturation: 0.12, tint: [255, 255, 255] },
    sunRays: { intensity: 0.15, spread: 0.65 },
  },

  overcast_fog: {
    name: "Overcast Fog / Atmósfera Industrial",
    clockTime: 14.0,
    brightness: 1.8,
    ambient: [100, 105, 115],
    outdoorAmbient: [130, 135, 145],
    colorShift_Top: [195, 200, 210],
    colorShift_Bottom: [75, 80, 90],
    exposureCompensation: 0.0,
    atmosphere: { density: 0.52, offset: 0.28, haze: 3.2, color: [185, 190, 200], decay: [145, 150, 160], glare: 0.15 },
    bloom: { intensity: 0.35, size: 14, threshold: 1.1 },
    colorCorrection: { contrast: 0.08, saturation: -0.10, tint: [242, 244, 248] },
    sunRays: null,
  },

  rainy_noir: {
    name: "Rainy Noir / Urbano Nocturno",
    clockTime: 20.5,
    brightness: 1.2,
    ambient: [35, 40, 50],
    outdoorAmbient: [48, 55, 70],
    colorShift_Top: [130, 150, 195],
    colorShift_Bottom: [40, 45, 55],
    exposureCompensation: 0.15,
    atmosphere: { density: 0.46, offset: 0.22, haze: 2.8, color: [28, 35, 50], decay: [12, 18, 28], glare: 0.2 },
    bloom: { intensity: 1.0, size: 22, threshold: 0.85 },
    colorCorrection: { contrast: 0.24, saturation: 0.05, tint: [205, 220, 240] },
    sunRays: null,
  },
};

export function generateEnvironmentLuau({
  preset = "golden_hour",
  clockTime = null,
  enableFutureLighting = true,
  shadowSoftness = 0.18,
}) {
  const pKey = preset.toLowerCase().replace(/[^a-z0-9_]/g, "_");
  const config = ENVIRONMENT_PRESETS[pKey] || ENVIRONMENT_PRESETS.golden_hour;
  const effectiveClock = clockTime !== null && clockTime !== undefined ? Number(clockTime) : config.clockTime;

  const amb = config.ambient;
  const outAmb = config.outdoorAmbient;
  const topCol = config.colorShift_Top;
  const botCol = config.colorShift_Bottom;
  const atmo = config.atmosphere;
  const bloom = config.bloom;
  const cc = config.colorCorrection;

  return `
local Lighting = game:GetService("Lighting")

-- 1. MOTOR DE ILUMINACIÓN FUTURE LIGHTING Y SOMBRAS EN TIEMPO REAL
${enableFutureLighting ? `pcall(function() Lighting.Technology = Enum.Technology.Future end)` : ""}
Lighting.GlobalShadows = true
Lighting.ShadowSoftness = ${shadowSoftness}
Lighting.ClockTime = ${effectiveClock}
Lighting.Brightness = ${config.brightness}
Lighting.ExposureCompensation = ${config.exposureCompensation || 0}
Lighting.Ambient = Color3.fromRGB(${amb[0]}, ${amb[1]}, ${amb[2]})
Lighting.OutdoorAmbient = Color3.fromRGB(${outAmb[0]}, ${outAmb[1]}, ${outAmb[2]})
Lighting.ColorShift_Top = Color3.fromRGB(${topCol[0]}, ${topCol[1]}, ${topCol[2]})
Lighting.ColorShift_Bottom = Color3.fromRGB(${botCol[0]}, ${botCol[1]}, ${botCol[2]})

-- 2. ATMÓSFERA Y DISPERSIÓN DE LUZ VOLUMÉTRICA (Atmosphere)
local atmo = Lighting:FindFirstChildOfClass("Atmosphere")
if not atmo then
    atmo = Instance.new("Atmosphere")
    atmo.Name = "CinematicAtmosphere"
    atmo.Parent = Lighting
end
atmo.Density = ${atmo.density}
atmo.Offset = ${atmo.offset}
atmo.Haze = ${atmo.haze}
atmo.Color = Color3.fromRGB(${atmo.color[0]}, ${atmo.color[1]}, ${atmo.color[2]})
atmo.Decay = Color3.fromRGB(${atmo.decay[0]}, ${atmo.decay[1]}, ${atmo.decay[2]})
atmo.Glare = ${atmo.glare}

-- 3. EFECTO DE RESPLANDOR (BloomEffect para ventanas y neones)
local bloom = Lighting:FindFirstChildOfClass("BloomEffect")
if not bloom then
    bloom = Instance.new("BloomEffect")
    bloom.Name = "CinematicBloom"
    bloom.Parent = Lighting
end
bloom.Intensity = ${bloom.intensity}
bloom.Size = ${bloom.size}
bloom.Threshold = ${bloom.threshold}

-- 4. CORRECCIÓN DE COLOR CINEMÁTICA (ColorCorrectionEffect)
local cc = Lighting:FindFirstChildOfClass("ColorCorrectionEffect")
if not cc then
    cc = Instance.new("ColorCorrectionEffect")
    cc.Name = "CinematicColorCorrection"
    cc.Parent = Lighting
end
cc.Contrast = ${cc.contrast}
cc.Saturation = ${cc.saturation}
cc.TintColor = Color3.fromRGB(${cc.tint[0]}, ${cc.tint[1]}, ${cc.tint[2]})

-- 5. RAYOS SOLARES CREPUSCULARES (SunRaysEffect)
local sunRays = Lighting:FindFirstChildOfClass("SunRaysEffect")
${
  config.sunRays
    ? `
if not sunRays then
    sunRays = Instance.new("SunRaysEffect")
    sunRays.Name = "CinematicSunRays"
    sunRays.Parent = Lighting
end
sunRays.Intensity = ${config.sunRays.intensity}
sunRays.Spread = ${config.sunRays.spread}
sunRays.Enabled = true
`
    : `
if sunRays then
    sunRays.Enabled = false
end
`
}

print(string.format("[Environment AAA] ✅ Atmósfera cinemática '%s' aplicada (Hora: %.1f, Future Lighting: %s).", "${config.name}", ${effectiveClock}, "${enableFutureLighting}"))
`;
}
