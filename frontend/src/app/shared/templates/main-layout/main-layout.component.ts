import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { ToastComponent } from '../../atoms/toast/toast.component';
import { FooterComponent } from '../../organisms/footer/footer.component';
import { HeaderComponent } from '../../organisms/header/header.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, ToastComponent],
  template: `
    @if (isLoginTransition()) {
      <div class="pa-login-screen-curtain" aria-hidden="true">
        <div class="pa-login-screen-curtain__pill">
          <span class="pa-login-screen-curtain__icon">✓</span>
          <span>Ingreso verificado · Abriendo su portal clínico...</span>
        </div>
      </div>
    }

    <div class="pa-layout" [class.pa-layout--login-enter]="isLoginTransition()">
      <app-toast />
      <app-header />

      @if (pageTitle) {
        <section class="pa-layout__hero">
          <div class="pa-layout__hero-inner">
            <div class="pa-layout__hero-text">
              @if (eyebrow) {
                <span class="pa-layout__eyebrow">{{ eyebrow }}</span>
              }
              <h1>{{ pageTitle }}</h1>
              @if (pageDescription) {
                <p>{{ pageDescription }}</p>
              }
            </div>
            <div class="pa-layout__hero-extra">
              <ng-content select="[heroExtra]"></ng-content>
            </div>
          </div>
        </section>
      }

      <main class="pa-layout__main pa-page-animate">
        <div class="pa-layout__container">
          <ng-content></ng-content>
        </div>
      </main>

      <app-footer />
    </div>
  `,
  styles: [
    `
      .pa-layout {
        min-height: 100vh;
        display: grid;
        grid-template-columns: minmax(0, 1fr); /* para que la columna no exceda la pantalla */
        grid-template-rows: auto auto 1fr auto;
        background-color: var(--pa-bg);
      }

      /* Animación llamativa de pantalla completa al ingresar desde el Login */
      .pa-layout--login-enter {
        animation: paLoginPortalEnter 820ms cubic-bezier(0.16, 1, 0.3, 1) both;
        transform-origin: center top;
      }

      .pa-layout--login-enter .pa-layout__hero {
        animation: paLoginHeroSlideUp 720ms 90ms cubic-bezier(0.16, 1, 0.3, 1) both;
      }

      .pa-layout--login-enter .pa-layout__main {
        animation: paLoginContentZoomUp 820ms 160ms cubic-bezier(0.16, 1, 0.3, 1) both;
      }

      .pa-login-screen-curtain {
        position: fixed;
        inset: 0;
        z-index: 9999;
        pointer-events: none;
        display: flex;
        align-items: center;
        justify-content: center;
        background: radial-gradient(
          circle at center,
          rgba(225, 245, 254, 0.92) 0%,
          rgba(2, 119, 189, 0.24) 65%,
          rgba(11, 37, 69, 0.12) 100%
        );
        animation: paLoginCurtainFadeOut 900ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
      }

      .pa-login-screen-curtain__pill {
        display: inline-flex;
        align-items: center;
        gap: 0.85rem;
        padding: 1.1rem 2rem;
        border-radius: 999px;
        background-color: var(--pa-white);
        border: 3px solid var(--pa-blue-700);
        box-shadow: var(--pa-shadow-lg);
        color: var(--pa-blue-900);
        font-size: 1.25rem;
        font-weight: 800;
        animation: paLoginPillPop 850ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }

      .pa-login-screen-curtain__icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background-color: var(--pa-blue-700);
        color: var(--pa-white);
        font-size: 1.15rem;
        font-weight: 900;
      }

      /* Cabecera en Azul Celeste Claro y Blanco con texto Azul Marino de alto contraste */
      .pa-layout__hero {
        background: linear-gradient(135deg, var(--pa-white) 0%, var(--pa-surface-alt) 65%, var(--pa-panel-sky) 100%);
        color: var(--pa-text-main);
        border-bottom: 2px solid var(--pa-border);
      }

      .pa-layout__hero-inner {
        max-width: 1360px;
        margin: 0 auto;
        padding: 2rem 1.5rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 1.5rem;
      }

      .pa-layout__hero-text {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        max-width: 860px;

        h1 {
          color: var(--pa-blue-900);
        }

        p {
          color: var(--pa-text-secondary);
          font-size: 1.15rem;
        }
      }

      .pa-layout__eyebrow {
        display: inline-flex;
        align-self: flex-start;
        padding: 0.35rem 0.9rem;
        border-radius: 999px;
        background-color: var(--pa-white);
        border: 2px solid var(--pa-blue-700);
        color: var(--pa-blue-900);
        font-size: 0.92rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .pa-layout__main {
        width: 100%;
      }

      .pa-layout__container {
        max-width: 1360px;
        margin: 0 auto;
        padding: 2.25rem 1.5rem 3.5rem;
        display: flex;
        flex-direction: column;
        gap: 2rem;
      }

      @media (max-width: 1024px) {
        .pa-layout__container {
          padding: 1.75rem 1.25rem 2.75rem;
          gap: 1.6rem;
        }
      }

      @media (max-width: 640px) {
        .pa-layout__hero-inner {
          padding: 1.5rem 1rem;
        }

        .pa-layout__container {
          padding: 1.25rem 1rem 2.25rem;
          gap: 1.35rem;
        }
      }
    `,
  ],
})
export class MainLayoutComponent implements OnInit {
  private readonly authService = inject(AuthService);

  @Input() eyebrow = '';
  @Input() pageTitle = '';
  @Input() pageDescription = '';

  readonly isLoginTransition = signal(false);

  ngOnInit(): void {
    if (this.authService.consumeLoginTransition()) {
      this.isLoginTransition.set(true);
      setTimeout(() => {
        this.isLoginTransition.set(false);
      }, 950);
    }
  }
}
