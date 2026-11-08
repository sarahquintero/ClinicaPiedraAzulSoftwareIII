import { Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    @if (toastService.activeToast(); as toast) {
      <div
        class="pa-toast"
        [class.pa-toast--success]="toast.type === 'success'"
        [class.pa-toast--error]="toast.type === 'error'"
        role="alert"
        aria-live="assertive"
      >
        <div class="pa-toast__icon" aria-hidden="true">
          {{ toast.type === 'success' ? '✅' : '⚠️' }}
        </div>
        <div class="pa-toast__content">
          <strong class="pa-toast__title">{{ toast.title }}</strong>
          <p class="pa-toast__message">{{ toast.message }}</p>
        </div>
        <button
          type="button"
          class="pa-toast__close"
          (click)="toastService.dismiss()"
          aria-label="Cerrar notificación"
        >
          ✕ Cerrar
        </button>
      </div>
    }
  `,
  styles: [
    `
      .pa-toast {
        position: fixed;
        top: 1.25rem;
        right: 1.25rem;
        z-index: 9999;
        max-width: 620px;
        width: calc(100% - 2.5rem);
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.15rem 1.35rem;
        border-radius: var(--pa-radius-md);
        background-color: var(--pa-white);
        box-shadow: var(--pa-shadow-lg);
        border: 3px solid var(--pa-blue-700);
        animation: paPageEnter 240ms cubic-bezier(0.22, 1, 0.36, 1) both;
      }

      .pa-toast--success {
        background-color: #ecfdf5;
        border-color: var(--pa-green-700);
        color: var(--pa-green-800);
      }

      .pa-toast--error {
        background-color: #fef2f2;
        border-color: var(--pa-danger-border);
        color: var(--pa-danger-text);
      }

      .pa-toast__icon {
        font-size: 1.85rem;
        flex-shrink: 0;
      }

      .pa-toast__content {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
      }

      .pa-toast__title {
        font-size: 1.15rem; /* 21px */
        font-weight: 800;
      }

      .pa-toast__message {
        font-size: 1.08rem; /* ~19.5px */
        font-weight: 600;
      }

      .pa-toast__close {
        min-height: 48px;
        min-width: 96px;
        padding: 0.5rem 0.9rem;
        border-radius: var(--pa-radius-sm);
        border: 2px solid currentColor;
        background-color: var(--pa-white);
        color: inherit;
        font-family: inherit;
        font-size: 1rem;
        font-weight: 800;
        cursor: pointer;
      }
    `,
  ],
})
export class ToastComponent {
  readonly toastService = inject(ToastService);
}
