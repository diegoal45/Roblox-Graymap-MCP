/**
 * Utilidades de Snap to Grid (Ajuste a Rejilla) para construcciones en Roblox.
 * Roblox utiliza múltiplos de 4 y 8 studs como estándar de arquitectura modular.
 */

export function snapVal(val, grid = 4) {
  if (!grid || grid <= 0) return val;
  return Math.round(val / grid) * grid;
}

export function snapSize(val, grid = 4, min = 1) {
  if (!grid || grid <= 0) return Math.max(min, val);
  const snapped = Math.round(val / grid) * grid;
  return Math.max(min, snapped);
}

export function snapPosition([x, y, z], grid = 4, snapY = false) {
  if (!grid || grid <= 0) return [x, y, z];
  return [
    snapVal(x, grid),
    snapY ? snapVal(y, grid) : y,
    snapVal(z, grid),
  ];
}
