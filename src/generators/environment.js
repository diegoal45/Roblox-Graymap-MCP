/**
 * Motor Cinemático de Iluminación, Atmósfera y Post-Procesado para Roblox Studio.
 * Inyecta Future Lighting, Atmosphere, Bloom, ColorCorrection y SunRays
 * para transformar visualmente el juego a calidad AAA.
 */

export const ENVIRONMENT_PRESETS = {
  cyberpunk_night: {
    name: "Cyberpunk Night",
    clockTime: 22.5,
    brightness: 1.2,
    ambient: [25, 30, 45],
    outdoorAmbient: [35, 40, 55],
    colorShift_Top: [0, 180, 255],
    atmosphere: { density: 0.35, offset: 0.2, haze: 2.0, color: [30, 40, 60], decay: [15, 20, 35], glare: 0.2 },
    bloom: { intensity: 1.2, size: 24, threshold: 0.8 },
    colorCorrection: { contrast: 0.18, saturation: 0.28, tint: [220, 230, 255] },
    sunRays: null,
  },

  golden_hour: {
    name: "Golden Hour / Atardecer Cálido",
    clockTime: 17.4,
    brightness: 2.2,
    ambient: [70, 50, 40],
    outdoorAmbient: [140, 100, 70],
    colorShift_Top: [255, 180, 100],
    atmosphere: { density: 0.28, offset: 0.1, haze: 1.5, color: [255, 170, 90], decay: [210, 120, 50], glare: 0.5 },
    bloom: { intensity: 0.6, size: 18, threshold: 1.0 },
    colorCorrection: { contrast: 0.10, saturation: 0.18, tint: [255, 235, 210] },
    sunRays: { intensity: 0.25, spread: 0.8 },
  },

  overcast_fog: {
    name: "Overcast Fog / Niebla Industrial",
    clockTime: 14.0,
    brightness: 1.6,
    ambient: [90, 95, 105],
    outdoorAmbient: [120, 125, 135],
    colorShift_Top: [180, 185, 195],
    atmosphere: { density: 0.55, offset: 0.3, haze: 3.5, color: [180, 185, 195], decay: [140, 145, 155], glare: 0.1 },
    bloom: { intensity: 0.3, size: 12, threshold: 1.2 },
    colorCorrection: { contrast: -0.05, saturation: -0.20, tint: [240, 240, 245] },
    sunRays: null,
  },

  sunny_noon: {
    name: "Sunny Noon / Mediodía Nítido",
    clockTime: 12.0,
    brightness: 2.8,
    ambient: [80, 85, 95],
    outdoorAmbient: [130, 135, 145],
    colorShift_Top: [255, 255, 250],
    atmosphere: { density: 0.20, offset: 0.05, haze: 0.5, color: [210, 225, 245], decay: [180, 200, 225], glare: 0.3 },
    bloom: { intensity: 0.4, size: 14, threshold: 1.4 },
    colorCorrection: { contrast: 0.05, saturation: 0.08, tint: [255, 255, 255] },
    sunRays: { intensity: 0.12, spread: 0.6 },
  },

  rainy_noir: {
    name: "Rainy Noir / Lluvia Urbana",
    clockTime: 20.0,
    brightness: 1.0,
    ambient: [30, 35, 45],
    outdoorAmbient: [40, 45, 60],
    colorShift_Top: [120, 140, 180],
    atmosphere: { density: 0.45, offset: 0.25, haze: 3.0, color: [25, 30, 45], decay: [10, 15, 25], glare: 0.15 },
    bloom: { intensity: 0.9, size: 20, threshold: 0.9 },
    colorCorrection: { contrast: 0.22, saturation: -0.10, tint: [195, 215, 235] },
    sunRays: null,
  },
};

export function generateEnvironmentLuau({
  preset = "golden_hour",
  clockTime = null,
  enableFutureLighting = true,
  shadowSoftness = 0.2,
}) {
  const pKey = preset.toLowerCase().replace(/[^a-z0-9_]/g, "_");
  const config = ENVIRONMENT_PRESETS[pKey] || ENVIRONMENT_PRESETS.golden_hour;
  const effectiveClock = clockTime !== null && clockTime !== undefined ? Number(clockTime) : config.clockTime;

  const amb = config.ambient;
  const outAmb = config.outdoorAmbient;
  const atmo = config.atmosphere;
  const bloom = config.bloom;
  const cc = config.colorCorrection;

  return `
local Lighting = game:GetService("Lighting")

-- 1. CONFIGURACIÓN DEL MOTOR DE ILUMINACIÓN
${enableFutureLighting ? `pcall(function() Lighting.Technology = Enum.Technology.Future end)` : ""}
Lighting.GlobalShadows = true
Lighting.ShadowSoftness = ${shadowSoftness}
Lighting.ClockTime = ${effectiveClock}
Lighting.Brightness = ${config.brightness}
Lighting.Ambient = Color3.fromRGB(${amb[0]}, ${amb[1]}, ${amb[2]})
Lighting.OutdoorAmbient = Color3.fromRGB(${outAmb[0]}, ${outAmb[1]}, ${outAmb[2]})

-- 2. ATMÓSFERA Y DISPERSIÓN DE LUZ (Atmosphere)
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

-- 3. EFECTO DE RESPLANDOR (BloomEffect)
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

-- 5. RAYOS SOLARES (SunRaysEffect)
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

print(string.format("[Environment] ✅ Atmósfera cinemática '%s' aplicada (Hora: %.1f, Future Lighting: %s).", "${config.name}", ${effectiveClock}, "${enableFutureLighting}"))
`;
}
