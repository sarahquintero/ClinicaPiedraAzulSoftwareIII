import { NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [NgClass],
  template: `
    <button
      [type]="type"
      class="pa-btn"
      [ngClass]="['pa-btn--' + variant, 'pa-btn--' + size, fullWidth ? 'pa-btn--block' : '']"
      [disabled]="disabled"
      (click)="handleClick($event)"
    >
      @if (label) {
        <span>{{ label }}</span>
      } @else {
        <ng-content></ng-content>
      }
    </button>
  `,
  styles: [
    `
      /* Área de clic mínima garantizada >= 48x48px para accesibilidad Tercera Edad */
      .pa-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.6rem;
        min-height: 52px;
        min-width: 52px;
        border-radius: var(--pa-radius-sm);
        font-family: inherit;
        font-weight: 800;
        line-height: 1.25;
        cursor: pointer;
        border: 2px solid transparent;
        transition:
          background-color var(--pa-transition),
          color var(--pa-transition),
          border-color var(--pa-transition),
          transform var(--pa-transition),
          box-shadow var(--pa-transition);

        &:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        &:active:not(:disabled) {
          transform: translateY(0);
        }

        &:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
      }

      .pa-btn--sm {
        padding: 0.7rem 1.25rem;
        font-size: 1rem; /* 18px */
      }

      .pa-btn--md {
        padding: 0.8rem 1.55rem;
        font-size: 1.111rem; /* 20px */
      }

      .pa-btn--lg {
        padding: 0.95rem 1.9rem;
        font-size: 1.18rem; /* 21px */
      }

      .pa-btn--block {
        width: 100%;
      }

      /* Azul Fuerte Clínico para botones principales */
      .pa-btn--primary {
        background-color: var(--pa-blue-700);
        color: var(--pa-white);
        border-color: var(--pa-blue-800);
        box-shadow: 0 4px 12px rgba(2, 119, 189, 0.25);

        &:hover:not(:disabled) {
          background-color: var(--pa-blue-800);
          box-shadow: 0 6px 16px rgba(3, 83, 136, 0.32);
        }
      }

      .pa-btn--secondary {
        background-color: var(--pa-blue-800);
        color: var(--pa-white);
        border-color: var(--pa-blue-900);
        box-shadow: 0 4px 12px rgba(3, 83, 136, 0.25);

        &:hover:not(:disabled) {
          background-color: var(--pa-blue-900);
        }
      }

      .pa-btn--outline {
        background-color: var(--pa-white);
        color: var(--pa-blue-900);
        border-color: var(--pa-blue-700);

        &:hover:not(:disabled) {
          background-color: var(--pa-surface-alt);
          border-color: var(--pa-blue-900);
        }
      }

      .pa-btn--danger {
        background-color: var(--pa-danger-bg);
        color: var(--pa-danger-text);
        border-color: var(--pa-danger-border);

        &:hover:not(:disabled) {
          background-color: #fee2e2;
        }
      }

      .pa-btn--ghost {
        background-color: var(--pa-surface-alt);
        color: var(--pa-blue-900);
        border-color: var(--pa-border);

        &:hover:not(:disabled) {
          background-color: var(--pa-blue-200);
        }
      }
    `,
  ],
})
export class ButtonComponent {
  @Input() label = '';
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() fullWidth = false;

  @Output() clicked = new EventEmitter<MouseEvent>();

  handleClick(event: MouseEvent): void {
    if (!this.disabled) {
      this.clicked.emit(event);
    }
  }
}
