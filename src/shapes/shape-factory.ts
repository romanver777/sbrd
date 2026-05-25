import * as PIXI from "pixi.js-legacy";
import { randomInt } from "../utils/math";
import { randomColor } from "../utils/color";
import { registerShape } from "./shape-registry";

export interface CreatedShape {
  graphics: PIXI.Graphics;
  label: string;
}

const shapeLabels: Record<number, string> = {
  0: "случайный прямоугольник",
  1: "случайный эллипс",
  2: "случайная линия",
  3: "случайный круг",
};

export function createRandomShape(): CreatedShape {
  const g = new PIXI.Graphics();
  const color = randomColor();
  const angle = randomInt(-45, 45);
  const type = randomInt(0, 4);
  const label = shapeLabels[type];

  switch (type) {
    case 0:
      g.beginFill(color, 0.85)
        .drawRect(
          -randomInt(15, 50), // Отрицательные координаты для центрального пивота
          -randomInt(15, 50),
          randomInt(30, 100),
          randomInt(30, 100),
        )
        .endFill();
      break;
    case 1:
      g.beginFill(color, 0.85)
        .drawEllipse(0, 0, randomInt(20, 70), randomInt(15, 45))
        .endFill();
      break;
    case 2:
      g.lineStyle(randomInt(3, 8), color, 1)
        .moveTo(0, 0)
        .lineTo(randomInt(50, 130), randomInt(-60, 60));
      break;
    case 3:
      g.beginFill(color, 0.85).drawCircle(0, 0, randomInt(15, 45)).endFill();
      break;
  }

  g.position.set(randomInt(40, 340), randomInt(40, 240));
  g.angle = angle;

  registerShape(g, label);
  return { graphics: g, label };
}
