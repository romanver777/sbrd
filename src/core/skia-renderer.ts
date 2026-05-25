import {
  CanvasKit,
  Canvas,
  Surface,
  Path,
} from "@rollerbird/canvaskit-wasm-pdf";
import * as PIXI from "pixi.js-legacy";
import { parseColor } from "../utils/color";

export class SkiaRenderer {
  private ck: CanvasKit;
  private surface: Surface;
  private selectedGfx: PIXI.Graphics | null = null;

  constructor(ck: CanvasKit, canvas: HTMLCanvasElement) {
    this.ck = ck;

    const surface = ck.MakeCanvasSurface(canvas);
    if (!surface) {
      const surface2 = ck.MakeSWCanvasSurface(canvas);
      if (!surface2) throw new Error("Skia: не удалось создать Surface");
      this.surface = surface2;
    } else {
      this.surface = surface;
    }
  }

  setSelected(gfx: PIXI.Graphics | null): void {
    this.selectedGfx = gfx;
  }

  render(container: PIXI.Container): void {
    const skCanvas = this.surface.getCanvas();
    skCanvas.clear(this.ck.Color4f(0.102, 0.102, 0.141, 1));
    this.drawContainer(skCanvas, container);
    this.surface.flush();
  }

  renderToCanvas(
    canvas: Canvas,
    container: PIXI.Container,
    clearColor?: [number, number, number, number],
  ): void {
    if (clearColor) {
      canvas.clear(
        this.ck.Color4f(
          clearColor[0],
          clearColor[1],
          clearColor[2],
          clearColor[3],
        ),
      );
    }
    this.drawContainer(canvas, container);
  }

  private drawContainer(canvas: Canvas, container: PIXI.Container): void {
    canvas.save();
    this.applyTransform(canvas, container);

    for (const child of container.children) {
      if (
        child instanceof PIXI.Container &&
        !(child instanceof PIXI.Graphics) &&
        !(child instanceof PIXI.Sprite)
      ) {
        this.drawContainer(canvas, child);
      } else if (child instanceof PIXI.Graphics) {
        this.drawGraphics(canvas, child);
      } else if (child instanceof PIXI.Sprite) {
        this.drawSprite(canvas, child);
      }
    }

    canvas.restore();
  }

  private applyTransform(canvas: Canvas, obj: PIXI.DisplayObject): void {
    const x = obj.position.x;
    const y = obj.position.y;
    const a = obj.rotation;
    const sx = (obj as any).scale?.x ?? 1;
    const sy = (obj as any).scale?.y ?? 1;
    const px = (obj as any).pivot?.x ?? 0;
    const py = (obj as any).pivot?.y ?? 0;

    if (x !== 0 || y !== 0) canvas.translate(x, y);
    if (a !== 0) canvas.rotate(a * (180 / Math.PI), 0, 0); // Pixi в радианах → Skia в градусах
    if (sx !== 1 || sy !== 1) canvas.scale(sx, sy);
    if (px !== 0 || py !== 0) canvas.translate(-px, -py);
  }

  private drawGraphics(canvas: Canvas, gfx: PIXI.Graphics): void {
    canvas.save();
    this.applyTransform(canvas, gfx);

    const isSelected = gfx === this.selectedGfx;
    const data: any[] = (gfx.geometry as any).graphicsData ?? [];

    for (const entry of data) {
      const fillStyle = entry.fillStyle;
      const lineStyle = entry.lineStyle;
      const shape = entry.shape;
      const points: number[] = entry.points ?? [];

      const path = new this.ck.Path();
      this.buildPath(path, shape, points);

      // Заливка
      if (fillStyle?.visible && fillStyle.color != null) {
        const paint = new this.ck.Paint();
        paint.setAntiAlias(true);
        paint.setStyle(this.ck.PaintStyle.Fill);
        const [r, g, b] = parseColor(fillStyle.color);
        paint.setColor(this.ck.Color4f(r, g, b, fillStyle.alpha ?? 1));
        canvas.drawPath(path, paint);
        paint.delete();
      }

      // Обводка
      if (
        lineStyle?.visible &&
        lineStyle.color != null &&
        (lineStyle.width ?? 0) > 0
      ) {
        const paint = new this.ck.Paint();
        paint.setAntiAlias(true);
        paint.setStyle(this.ck.PaintStyle.Stroke);
        paint.setStrokeWidth(lineStyle.width ?? 1);
        const [r, g, b] = parseColor(lineStyle.color);
        paint.setColor(this.ck.Color4f(r, g, b, lineStyle.alpha ?? 1));
        canvas.drawPath(path, paint);
        paint.delete();
      }

      // Визуальное выделение: полупрозрачная заливка + пунктирная обводка
      if (isSelected) {
        const tint = new this.ck.Paint();
        tint.setAntiAlias(true);
        tint.setStyle(this.ck.PaintStyle.Fill);
        tint.setColor(this.ck.Color4f(0.4, 0.75, 1.0, 0.25));
        canvas.drawPath(path, tint);
        tint.delete();

        const sel = new this.ck.Paint();
        sel.setAntiAlias(true);
        sel.setStyle(this.ck.PaintStyle.Stroke);
        sel.setStrokeWidth(2.5);
        sel.setColor(this.ck.Color4f(0.2, 0.7, 1.0, 1.0));
        sel.setPathEffect(this.ck.PathEffect.MakeDash([6, 4], 0));
        canvas.drawPath(path, sel);
        sel.delete();
      }

      path.delete();
    }

    canvas.restore();
  }

  private buildPath(path: Path, shape: any, points: number[]): void {
    if (!shape) {
      this.buildPolyPath(path, points);
      return;
    }

    const name = shape.constructor?.name ?? "";

    if (shape.type === PIXI.SHAPES.RECT || name === "Rectangle") {
      const { x, y, width, height } = shape;
      path.addRect(this.ck.LTRBRect(x, y, x + width, y + height));
    } else if (shape.type === PIXI.SHAPES.ELIP || name === "Ellipse") {
      const { x, y, width, height } = shape;
      // LTRBRect ожидает left, top, right, bottom
      path.addOval(
        this.ck.LTRBRect(x - width, y - height, x + width, y + height),
      );
    } else if (shape.type === PIXI.SHAPES.CIRC || name === "Circle") {
      const { x, y, radius } = shape;
      path.addCircle(x, y, radius);
    } else if (shape.type === PIXI.SHAPES.POLY || name === "Polygon") {
      this.buildPolyPath(path, shape.points ?? points);
    } else if (points.length >= 4) {
      this.buildPolyPath(path, points);
    }
  }

  private buildPolyPath(path: Path, pts: number[]): void {
    if (pts.length < 4) return;
    path.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) {
      path.lineTo(pts[i], pts[i + 1]);
    }
  }

  private drawSprite(canvas: Canvas, sprite: PIXI.Sprite): void {
    const texture = sprite.texture;
    if (!texture?.valid) return;

    // Конвертируем Pixi текстуру в Skia Image через временный canvas
    const resource = texture.baseTexture.resource as any;
    const src = resource?.source ?? resource?.data;
    if (!(src instanceof HTMLImageElement || src instanceof HTMLCanvasElement))
      return;

    const tmp = document.createElement("canvas");
    tmp.width = texture.width;
    tmp.height = texture.height;
    const ctx = tmp.getContext("2d")!;
    ctx.drawImage(
      src,
      texture.frame.x,
      texture.frame.y,
      texture.frame.width,
      texture.frame.height,
      0,
      0,
      texture.width,
      texture.height,
    );
    const imgData = ctx.getImageData(0, 0, tmp.width, tmp.height);
    const skImg = this.ck.MakeImage(
      {
        width: tmp.width,
        height: tmp.height,
        alphaType: this.ck.AlphaType.Unpremul,
        colorType: this.ck.ColorType.RGBA_8888,
        colorSpace: this.ck.ColorSpace.SRGB,
      },
      imgData.data,
      4 * tmp.width,
    );

    if (!skImg) return;

    canvas.save();
    this.applyTransform(canvas, sprite);

    const w = sprite.width / ((sprite as any).scale?.x || 1);
    const h = sprite.height / ((sprite as any).scale?.y || 1);
    const px = (sprite as any).pivot?.x || sprite.anchor.x * w || 0;
    const py = (sprite as any).pivot?.y || sprite.anchor.y * h || 0;

    const paint = new this.ck.Paint();
    paint.setAntiAlias(true);
    canvas.drawImageRect(
      skImg,
      this.ck.XYWHRect(0, 0, tmp.width, tmp.height),
      this.ck.XYWHRect(-px, -py, w, h),
      paint,
    );
    paint.delete();
    skImg.delete();
    canvas.restore();
  }
}
