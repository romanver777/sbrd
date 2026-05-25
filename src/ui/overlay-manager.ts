import * as PIXI from "pixi.js-legacy";

export class OverlayManager {
  private overlay: PIXI.Graphics;

  constructor(stage: PIXI.Container) {
    this.overlay = new PIXI.Graphics();
    stage.addChild(this.overlay);
  }

  update(selected: PIXI.Graphics | null): void {
    this.overlay.clear();
    if (!selected) return;

    const data: any[] = (selected.geometry as any).graphicsData ?? [];
    if (!data.length) return;

    // Применяем трансформацию выбранной фигуры к оверлею
    selected.updateTransform();
    this.overlay.transform.setFromMatrix(selected.worldTransform);

    for (const entry of data) {
      const shape = entry.shape;
      const pts: number[] = entry.points ?? [];
      const name = shape?.constructor?.name ?? "";

      // Обработка линий и полигонов (только обводка без заливки)
      if (
        !shape ||
        shape.type === PIXI.SHAPES.POLY ||
        name === "Polygon" ||
        (!shape.type && pts.length >= 4)
      ) {
        const polyPts = shape?.points ?? pts;
        if (polyPts.length >= 4) {
          this.overlay.lineStyle(3, 0x33bbff, 1);
          this.overlay.moveTo(polyPts[0], polyPts[1]);
          for (let i = 2; i < polyPts.length; i += 2) {
            this.overlay.lineTo(polyPts[i], polyPts[i + 1]);
          }
        }
        continue;
      }

      // Заливка + обводка для замкнутых фигур
      if (shape.type === PIXI.SHAPES.RECT || name === "Rectangle") {
        const { x, y, width, height } = shape;
        this.overlay
          .beginFill(0x55ccff, 0.18)
          .drawRect(x, y, width, height)
          .endFill();
        this.overlay.lineStyle(2.5, 0x33bbff, 1).drawRect(x, y, width, height);
      } else if (shape.type === PIXI.SHAPES.ELIP || name === "Ellipse") {
        const { x, y, width: rx, height: ry } = shape;
        this.overlay
          .beginFill(0x55ccff, 0.18)
          .drawEllipse(x, y, rx, ry)
          .endFill();
        this.overlay.lineStyle(2.5, 0x33bbff, 1).drawEllipse(x, y, rx, ry);
      } else if (shape.type === PIXI.SHAPES.CIRC || name === "Circle") {
        const { x, y, radius } = shape;
        this.overlay
          .beginFill(0x55ccff, 0.18)
          .drawCircle(x, y, radius)
          .endFill();
        this.overlay.lineStyle(2.5, 0x33bbff, 1).drawCircle(x, y, radius);
      }
    }
  }
}
