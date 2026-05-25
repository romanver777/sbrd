export function random(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function randomInt(min: number, max: number): number {
  return Math.floor(random(min, max));
}

/**
 * Вычисляет минимальное расстояние от точки до отрезка
 * Используется для hit-testing линий с учётом толщины обводки
 */
export function distanceToSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;

  // Отрезок вырожден в точку
  if (lenSq === 0) return Math.hypot(px - ax, py - ay);

  // Проекция точки на отрезок с ограничением [0,1]
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));

  // Ближайшая точка на отрезке
  const closestX = ax + t * dx;
  const closestY = ay + t * dy;

  return Math.hypot(px - closestX, py - closestY);
}
