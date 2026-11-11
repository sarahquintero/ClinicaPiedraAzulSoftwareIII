import { Component, Input } from '@angular/core';
import { ToastComponent } from '../../atoms/toast/toast.component';
import { FooterComponent } from '../../organisms/footer/footer.component';
import { HeaderComponent } from '../../organisms/header/header.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, ToastComponent],
  template: `
    <div class="pa-layout">
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
export class MainLayoutComponent {
  @Input() eyebrow = '';
  @Input() pageTitle = '';
  @Input() pageDescription = '';
}
