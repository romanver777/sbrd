import * as PIXI from "pixi.js-legacy";

// Глобальный реестр для связи PIXI.Graphics с их текстовыми метками
// Используем WeakMap для автоматической сборки мусора при удалении фигур
export const labelMap = new WeakMap<PIXI.Graphics, string>();

export function registerShape(gfx: PIXI.Graphics, label: string): void {
  gfx.eventMode = "static"; // Включаем обработку событий для hit-testing
  gfx.cursor = "default";
  labelMap.set(gfx, label);
}
