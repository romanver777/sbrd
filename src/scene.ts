import * as PIXI from "pixi.js-legacy";
import { SelectionManager } from "./core/selection-manager";
import { registerShape } from "./shapes/shape-registry";
import { createRandomShape } from "./shapes/shape-factory";

export function buildInitialScene(selection: SelectionManager): PIXI.Container {
  const mainContainer = new PIXI.Container();
  const subContainer = new PIXI.Container();

  const g1 = new PIXI.Graphics();
  g1.beginFill("#ff4455").drawEllipse(0, 0, 70, 35).endFill();
  g1.position.set(200, 120);
  g1.angle = 30;
  registerShape(g1, "красный эллипс");

  const g2 = new PIXI.Graphics();
  g2.beginFill("#3355ff").drawRect(-30, -45, 60, 90).endFill();
  g2.position.set(130, 80);
  g2.angle = 15;
  g2.scale.set(1.2, 1.2);
  registerShape(g2, "синий прямоугольник");

  const g3 = new PIXI.Graphics();
  g3.lineStyle(5, "#ffffff", 1);
  g3.moveTo(0, 0);
  g3.lineTo(100, 60);
  g3.angle = -20;
  registerShape(g3, "белая линия");
  subContainer.addChild(g3);

  const g4 = new PIXI.Graphics();
  g4.lineStyle(5, "#ffee00", 1);
  g4.moveTo(0, 50);
  g4.lineTo(100, -20);
  g4.angle = 20;
  registerShape(g4, "жёлтая линия");
  subContainer.addChild(g4);

  mainContainer.addChild(subContainer, g1, g2);

  // Ловим клики по пустому месту, чтобы снять выделение
  mainContainer.eventMode = "static";
  mainContainer.hitArea = new PIXI.Rectangle(0, 0, 400, 300);
  mainContainer.cursor = "default";
  mainContainer.on("pointerdown", (e) => {
    if (e.target === mainContainer) {
      selection.deselect();
    }
  });

  return mainContainer;
}

export function addRandomShape(
  container: PIXI.Container,
  selection: SelectionManager,
): void {
  const { graphics, label } = createRandomShape();
  container.addChild(graphics);
  // Автоматически выделяем новую фигуру для обратной связи с пользователем
  selection.select(graphics, label);
}
