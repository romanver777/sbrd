import * as PIXI from "pixi.js-legacy";
import { Point } from "../types";
import { distanceToSegment } from "../utils/math";

function makeTransformMatrix(obj: PIXI.DisplayObject): DOMMatrix {
  const x = obj.position.x;
  const y = obj.position.y;
  const a = obj.rotation;
  const sx = (obj as any).scale?.x ?? 1;
  const sy = (obj as any).scale?.y ?? 1;
  const px = (obj as any).pivot?.x ?? 0;
  const py = (obj as any).pivot?.y ?? 0;

  let m = new DOMMatrix();
  m = m.translate(x, y);
  m = m.rotate(a * (180 / Math.PI)); // Pixi в радианах, DOMMatrix в градусах
  m = m.scale(sx, sy);
  m = m.translate(-px, -py); // Смещение относительно пивота
  return m;
}

function hitTestPolyline(pts: number[], lp: Point, tolerance: number): boolean {
  if (pts.length < 4) return false;
  const tol = Math.max(tolerance, 6); // Минимальный допуск для удобства клика
  for (let i = 0; i < pts.length - 2; i += 2) {
    if (
      distanceToSegment(
        lp.x,
        lp.y,
        pts[i],
        pts[i + 1],
        pts[i + 2],
        pts[i + 3],
      ) <= tol
    ) {
      return true;
    }
  }
  return false;
}

function hitTestShape(entry: any, lp: Point): boolean {
  const shape = entry.shape;
  const points: number[] = entry.points ?? [];
  const ls = entry.lineStyle;
  const strokeW = ls?.visible && (ls?.width ?? 0) > 0 ? (ls.width ?? 1) : 0;
  const halfSW = strokeW / 2 + 3; // Увеличиваем хит-зону на половину обводки + запас

  if (!shape) {
    return hitTestPolyline(points, lp, halfSW);
  }

  const name = shape.constructor?.name ?? "";

  if (shape.type === PIXI.SHAPES.RECT || name === "Rectangle") {
    const { x, y, width, height } = shape;
    return (
      lp.x >= x - halfSW &&
      lp.x <= x + width + halfSW &&
      lp.y >= y - halfSW &&
      lp.y <= y + height + halfSW
    );
  }

  if (shape.type === PIXI.SHAPES.ELIP || name === "Ellipse") {
    const { x, y, width: rx, height: ry } = shape;
    // Нормализованное расстояние с учётом допуска
    const dx = (lp.x - x) / (rx + halfSW);
    const dy = (lp.y - y) / (ry + halfSW);
    return dx * dx + dy * dy <= 1;
  }

  if (shape.type === PIXI.SHAPES.CIRC || name === "Circle") {
    const { x, y, radius } = shape;
    const dx = lp.x - x;
    const dy = lp.y - y;
    return dx * dx + dy * dy <= (radius + halfSW) * (radius + halfSW);
  }

  if (shape.type === PIXI.SHAPES.POLY || name === "Polygon") {
    return hitTestPolyline(shape.points ?? points, lp, halfSW);
  }

  return hitTestPolyline(points, lp, halfSW);
}

function checkHitArea(gfx: PIXI.Graphics, lp: Point): boolean {
  const hitArea = gfx.hitArea;
  if (!hitArea) return false;

  if (hitArea instanceof PIXI.Rectangle) {
    return (
      lp.x >= hitArea.x &&
      lp.x <= hitArea.x + hitArea.width &&
      lp.y >= hitArea.y &&
      lp.y <= hitArea.y + hitArea.height
    );
  }

  if (hitArea instanceof PIXI.Circle) {
    const dx = lp.x - hitArea.x;
    const dy = lp.y - hitArea.y;
    return dx * dx + dy * dy <= hitArea.radius * hitArea.radius;
  }

  if (hitArea instanceof PIXI.Ellipse) {
    const dx = (lp.x - hitArea.x) / hitArea.width;
    const dy = (lp.y - hitArea.y) / hitArea.height;
    return dx * dx + dy * dy <= 1;
  }

  if (hitArea instanceof PIXI.Polygon) {
    return hitTestPolyline(hitArea.points, lp, 6);
  }

  return false;
}

export function hitTest(
  container: PIXI.Container,
  cx: number,
  cy: number,
  parentMatrix: DOMMatrix = new DOMMatrix(),
): PIXI.Graphics | null {
  const m = parentMatrix.multiply(makeTransformMatrix(container));
  let result: PIXI.Graphics | null = null;

  // Идём в обратном порядке для правильного z-order (верхние объекты первыми)
  const children = [...container.children].reverse();

  for (const child of children) {
    if (!child.visible) continue;

    if (child instanceof PIXI.Graphics) {
      const childM = m.multiply(makeTransformMatrix(child));
      const inv = childM.inverse();
      const local = inv.transformPoint({ x: cx, y: cy });
      const lp: Point = { x: local.x, y: local.y };

      let hit = false;

      // Проверяем hitArea для объектов без заливки (линии)
      if (checkHitArea(child, lp)) {
        hit = true;
      } else {
        const data: any[] = (child.geometry as any).graphicsData ?? [];
        for (const entry of data) {
          if (hitTestShape(entry, lp)) {
            hit = true;
            break;
          }
        }
      }

      if (hit) result = child;
    } else if (
      child instanceof PIXI.Container &&
      !(child instanceof PIXI.Sprite)
    ) {
      const sub = hitTest(child, cx, cy, m);
      if (sub) result = sub;
    }
  }

  return result;
}
