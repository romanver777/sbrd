import * as PIXI from "pixi.js-legacy";

export interface Point {
  x: number;
  y: number;
}

export interface SelectionEntry {
  gfx: PIXI.Graphics;
  label: string;
}

export type SelectionListener = (entry: SelectionEntry | null) => void;

export interface ShapeConfig {
  type: string;
  color?: string;
  x?: number;
  y?: number;
  angle?: number;
  [key: string]: any;
}

export interface Renderable {
  render(canvas: any, obj: PIXI.DisplayObject): void;
}
