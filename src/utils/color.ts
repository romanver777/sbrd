/**
 * Преобразует цвет из формата Pixi (string или number) в формат Skia (RGBA)
 * Pixi использует hex-строки (#ff0000) или числа (0xff0000)
 * Skia ожидает числа от 0 до 1 в формате [r, g, b, a]
 */
export function parseColor(
  raw: string | number,
  alpha = 1,
): [number, number, number, number] {
  let hex = typeof raw === "number" ? raw : parseInt(raw.replace("#", ""), 16);
  const r = ((hex >> 16) & 0xff) / 255;
  const g = ((hex >> 8) & 0xff) / 255;
  const b = (hex & 0xff) / 255;
  return [r, g, b, alpha];
}

export function randomColor(): string {
  return (
    "#" +
    Math.floor(Math.random() * 0xffffff)
      .toString(16)
      .padStart(6, "0")
  );
}
