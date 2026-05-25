import * as PIXI from "pixi.js-legacy";
import { SelectionManager } from "../core/selection-manager";
import { hitTest } from "../core/hit-tester";

export function createSelectionHandler(
  selection: SelectionManager,
  container: PIXI.Container,
  labelMap: WeakMap<PIXI.Graphics, string>,
  statusManager: any,
) {
  return function handleSelection(
    e: PointerEvent,
    canvas: HTMLCanvasElement,
    direction: "down" | "up",
  ) {
    statusManager.setActionStatus(null);

    // Переводим экранные координаты в координаты canvas с учётом CSS-масштаба
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const cx = (e.clientX - rect.left) * scaleX;
    const cy = (e.clientY - rect.top) * scaleY;

    const hit = hitTest(container, cx, cy);

    if (hit) {
      const label = labelMap.get(hit) ?? "фигура";
      selection.select(hit, label);
      statusManager.setActionStatus(`Действие: pointer ${direction}`);
    } else {
      selection.deselect();
    }
  };
}
