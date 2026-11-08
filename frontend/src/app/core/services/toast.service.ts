import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  readonly activeToast = signal<ToastMessage | null>(null);
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  showSuccess(message: string, title = 'Operación exitosa'): void {
    this.present({ id: Date.now(), type: 'success', title, message }, 6500);
  }

  showError(message: string, title = 'Atención: No se pudo completar'): void {
    this.present({ id: Date.now(), type: 'error', title, message }, 8500);
  }

  dismiss(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.activeToast.set(null);
  }

  private present(toast: ToastMessage, durationMs: number): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.activeToast.set(toast);
    this.timeoutId = setTimeout(() => {
      this.activeToast.set(null);
      this.timeoutId = null;
    }, durationMs);
  }
}
