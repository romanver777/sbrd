export class StatusManager {
  private statusEl: HTMLElement;
  private actionEl: HTMLElement;

  constructor() {
    this.statusEl = document.getElementById("status")!;
    this.actionEl = document.getElementById("action-status")!;
  }

  setStatus(msg: string, cls: "ok" | "err" | "" = ""): void {
    this.statusEl.textContent = msg;
    this.statusEl.className = cls;
  }

  setActionStatus(msg: string | null): void {
    this.actionEl.textContent = msg || "";
  }
}
