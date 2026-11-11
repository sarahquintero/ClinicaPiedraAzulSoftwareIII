import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-logo',
  standalone: true,
  template: `
    <div class="pa-logo" [class.pa-logo--compact]="compact">
      <div class="pa-logo__mark" aria-hidden="true">
        <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="2" width="40" height="40" rx="12" fill="url(#paGrad)" />
          <path
            d="M22 11V33M11 22H33"
            stroke="#FFFFFF"
            stroke-width="4"
            stroke-linecap="round"
          />
          <path
            d="M12 26.5H17L19.5 21L23.5 29.5L26.5 24H32"
            stroke="#E1F5FE"
            stroke-width="2.4"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <defs>
            <linearGradient id="paGrad" x1="2" y1="2" x2="42" y2="42" gradientUnits="userSpaceOnUse">
              <stop stop-color="#0277BD" />
              <stop offset="1" stop-color="#039BE5" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      @if (!compact) {
        <div class="pa-logo__brand">
          <span class="pa-logo__title">Clínica Piedra Azul</span>
          <span class="pa-logo__subtitle">{{ subtitle }}</span>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .pa-logo {
        display: inline-flex;
        align-items: center;
        gap: 0.85rem;
        user-select: none;
      }

      .pa-logo__mark {
        width: 48px;
        height: 48px;
        flex-shrink: 0;

        svg {
          width: 100%;
          height: 100%;
          display: block;
        }
      }

      .pa-logo__brand {
        display: flex;
        flex-direction: column;
        line-height: 1.2;
      }

      .pa-logo__title {
        font-size: 1.35rem;
        font-weight: 800;
        color: var(--pa-blue-900);
      }

      .pa-logo__subtitle {
        font-size: 0.85rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--pa-blue-800);
      }
    `,
  ],
})

export class LogoComponent {
  @Input() subtitle = 'Centro Médico Integral';
  @Input() compact = false;
}
