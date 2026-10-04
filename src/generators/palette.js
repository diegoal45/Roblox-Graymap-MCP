export const PALETTE = {
  floor: "Color3.fromRGB(75, 75, 80)",
  wall: "Color3.fromRGB(185, 185, 190)",
  wallTrim: "Color3.fromRGB(120, 120, 125)",
  lowCover: "Color3.fromRGB(225, 130, 45)",       // Cobertura baja (3 studs)
  highCover: "Color3.fromRGB(65, 115, 185)",      // Cobertura alta (6.5 studs)
  stairs: "Color3.fromRGB(90, 135, 130)",         // Escalones
  platform: "Color3.fromRGB(110, 110, 115)",      // Plataformas elevadas
  spawnPoint: "Color3.fromRGB(45, 180, 100)",     // Zona de spawn
  objective: "Color3.fromRGB(240, 180, 40)",      // Punto de captura / objetivo
};

export const METRICS = {
  playerHeight: 5,        // Altura avatar R15
  playerWidth: 4,         // Ancho avatar
  maxStepHeight: 1.2,     // Altura máxima escalón sin saltar
  recommendedStepHeight: 0.8,
  stepDepth: 2.0,         // Profundidad escalón
  jumpHeight: 7.2,        // Salto estándar
  doorWidth: 5,           // Ancho puerta
  doorHeight: 8.5,        // Alto puerta
  lowCoverHeight: 3,      // Cobertura baja
  highCoverHeight: 6.5,   // Cobertura alta
};
