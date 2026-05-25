import * as PIXI from "pixi.js-legacy";
// @ts-ignore
import CanvasKitInit, { CanvasKit } from "@rollerbird/canvaskit-wasm-pdf";
import { SkiaRenderer } from "./core/skia-renderer";
import { SelectionManager } from "./core/selection-manager";
import { buildInitialScene, addRandomShape } from "./scene";
import { OverlayManager } from "./ui/overlay-manager";
import { StatusManager } from "./ui/StatusManager";
import { createSelectionHandler } from "./ui/event-handlers";
import { labelMap } from "./shapes/shape-registry";
import { downloadPDF } from "./utils/pdf";
import { PDFExporter } from "./export/pdf-exporter";

async function main(): Promise<void> {
  const statusManager = new StatusManager();
  statusManager.setStatus("Загрузка CanvasKit (Skia WASM)…");

  const ck = await CanvasKitInit({
    locateFile: (file) => {
      if (file === "canvaskit.wasm") {
        return "./canvaskit-pdf.wasm";
      }
      return file;
    },
  });

  statusManager.setStatus("Инициализация Pixi.js…");

  const canvasSize = { width: 400, height: 300 };

  const pixiCanvas = document.getElementById(
    "pixi-canvas",
  ) as HTMLCanvasElement;
  const app = new PIXI.Application({
    view: pixiCanvas,
    width: canvasSize.width,
    height: canvasSize.height,
    forceCanvas: true, // Используем Canvas API вместо WebGL для совместимости с hit-test
    backgroundColor: 0x1a1a24,
    antialias: true,
  });

  const selection = new SelectionManager();
  const mainContainer = buildInitialScene(selection);
  app.stage.addChild(mainContainer);

  const overlay = new OverlayManager(app.stage);
  const handleSelection = createSelectionHandler(
    selection,
    mainContainer,
    labelMap,
    statusManager,
  );

  pixiCanvas.addEventListener("pointerdown", (e: PointerEvent) => {
    handleSelection(e, pixiCanvas, "down");
  });
  pixiCanvas.addEventListener("pointerup", (e: PointerEvent) => {
    handleSelection(e, pixiCanvas, "up");
  });

  const skiaCanvas = document.getElementById(
    "skia-canvas",
  ) as HTMLCanvasElement;
  let skiaRenderer: SkiaRenderer;
  try {
    skiaRenderer = new SkiaRenderer(ck, skiaCanvas);
  } catch (e) {
    statusManager.setStatus("Ошибка Skia: " + (e as Error).message, "err");
    return;
  }

  const pdfExporter = new PDFExporter(ck);

  // Синхронизация выделения между рендерерами и UI
  selection.onChange((entry) => {
    skiaRenderer.setSelected(entry?.gfx ?? null);
    overlay.update(entry?.gfx ?? null);

    if (entry) {
      statusManager.setStatus(`Выбрано: ${entry.label}`, "ok");
    } else {
      statusManager.setStatus("Выделение снято", "");
    }
  });

  // Непрерывный рендеринг Skia при каждом кадре Pixi
  app.ticker.add(() => {
    try {
      skiaRenderer.render(mainContainer);
    } catch (e) {
      console.warn("Skia render error:", e);
    }
  });

  skiaCanvas.addEventListener("pointerdown", (e: PointerEvent) => {
    handleSelection(e, skiaCanvas, "down");
  });
  skiaCanvas.addEventListener("pointerup", (e: PointerEvent) => {
    handleSelection(e, skiaCanvas, "up");
  });

  statusManager.setStatus("Готово. Кликните на фигуру для выделения.", "ok");

  document.getElementById("btn-add")!.addEventListener("click", () => {
    statusManager.setActionStatus(null);
    addRandomShape(mainContainer, selection);
  });

  document.getElementById("btn-pdf")!.addEventListener("click", () => {
    statusManager.setActionStatus(null);
    statusManager.setStatus("Генерация PDF…");
    try {
      // Временно убираем выделение, чтобы в PDF не попала подсветка
      const prev = selection.getSelected();
      const prevLabel = selection.getEntry()?.label ?? "";
      skiaRenderer.setSelected(null);

      const bytes = pdfExporter.export(
        skiaRenderer,
        mainContainer,
        canvasSize.width,
        canvasSize.height,
      );
      downloadPDF(bytes, "scene.pdf");

      // Восстанавливаем выделение
      skiaRenderer.setSelected(prev);
      statusManager.setStatus("PDF готов к сохранению", "ok");
      if (prev) {
        // Даем пользователю увидеть, что выделение вернулось
        setTimeout(
          () => statusManager.setStatus(`Выбрано: ${prevLabel}`, "ok"),
          1500,
        );
      }
    } catch (e) {
      statusManager.setStatus("Ошибка PDF: " + (e as Error).message, "err");
      console.error(e);
    }
  });
}

main().catch((err) => {
  console.error(err);
  document.getElementById("status")!.textContent =
    "Критическая ошибка: " + err.message;
});
