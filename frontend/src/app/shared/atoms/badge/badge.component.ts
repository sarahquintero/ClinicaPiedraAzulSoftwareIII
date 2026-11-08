import { NgClass } from '@angular/common';
import { Component, Input } from '@angular/core';
import { BadgeVariant } from '../../../core/models/clinic.models';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [NgClass],
  template: `
    <span class="pa-badge" [ngClass]="'pa-badge--' + variant">
      <span class="pa-badge__dot" aria-hidden="true"></span>
      @if (text) {
        {{ text }}
      } @else {
        <ng-content></ng-content>
      }
    </span>
  `,
  styles: [
    `
      .pa-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.45rem;
        padding: 0.35rem 0.9rem;
        border-radius: 999px;
        font-size: 0.95rem;
        font-weight: 800;
        white-space: nowrap;
        border: 1.5px solid transparent;
      }

      .pa-badge__dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: currentColor;
      }

      .pa-badge--primary {
        background-color: var(--pa-surface-alt);
        color: var(--pa-blue-900);
        border-color: var(--pa-blue-700);
      }

      .pa-badge--success {
        background-color: var(--pa-success-bg);
        color: var(--pa-success-text);
        border-color: var(--pa-success-border);
      }

      .pa-badge--warning {
        background-color: var(--pa-warning-bg);
        color: var(--pa-warning-text);
        border-color: var(--pa-warning-border);
      }

      .pa-badge--danger {
        background-color: var(--pa-danger-bg);
        color: var(--pa-danger-text);
        border-color: var(--pa-danger-border);
      }

      .pa-badge--info {
        background-color: var(--pa-blue-100);
        color: var(--pa-blue-800);
        border-color: var(--pa-blue-600);
      }

      .pa-badge--neutral {
        background-color: var(--pa-white);
        color: var(--pa-blue-900);
        border-color: var(--pa-border-strong);
      }
    `,
  ],
})
export class BadgeComponent {
  @Input() variant: BadgeVariant = 'primary';
  @Input() text = '';
}
