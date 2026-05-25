import * as PIXI from "pixi.js-legacy";
import { SelectionEntry, SelectionListener } from "../types";

export class SelectionManager {
  private entry: SelectionEntry | null = null;
  private listeners: SelectionListener[] = [];

  select(gfx: PIXI.Graphics, label: string): void {
    // Избегаем лишних уведомлений при повторном выделении той же фигуры
    if (this.entry?.gfx === gfx) return;
    this.entry = { gfx, label };
    this.listeners.forEach((fn) => fn(this.entry));
  }

  deselect(): void {
    if (this.entry === null) return;
    this.entry = null;
    this.listeners.forEach((fn) => fn(null));
  }

  getSelected(): PIXI.Graphics | null {
    return this.entry?.gfx ?? null;
  }

  getEntry(): SelectionEntry | null {
    return this.entry;
  }

  onChange(fn: SelectionListener): void {
    this.listeners.push(fn);
  }
}
