import { CanvasKit, PDFMetadata } from "@rollerbird/canvaskit-wasm-pdf";
import * as PIXI from "pixi.js-legacy";
import { SkiaRenderer } from "../core/skia-renderer";

export class PDFExporter {
  private ck: CanvasKit;

  constructor(ck: CanvasKit) {
    this.ck = ck;
  }

  export(
    renderer: SkiaRenderer,
    container: PIXI.Container,
    width: number,
    height: number,
  ): Uint8Array {
    const metadata: PDFMetadata = {
      title: "Pixi → Ski сцена",
      creator: "Pixi-skia-pdf",
      producer: "Skia PDF backend",
      rootTag: {
        id: 1,
        type: "Document",
        alt: "",
        language: "ru",
        attributes: [],
        children: [],
      },
    };

    const pdfDoc = this.ck.MakePDFDocument(metadata);
    const pdfPage = pdfDoc.beginPage(width, height);

    const bgPaint = new this.ck.Paint();
    pdfPage.drawRect(this.ck.LTRBRect(0, 0, width, height), bgPaint);
    bgPaint.delete();

    renderer.renderToCanvas(pdfPage, container);

    pdfDoc.endPage();
    return pdfDoc.close();
  }
}
