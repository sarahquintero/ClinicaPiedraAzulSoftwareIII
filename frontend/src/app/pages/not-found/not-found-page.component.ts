import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BadgeComponent } from '../../shared/atoms/badge/badge.component';
import { ButtonComponent } from '../../shared/atoms/button/button.component';
import { MainLayoutComponent } from '../../shared/templates/main-layout/main-layout.component';

@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: [MainLayoutComponent, BadgeComponent, ButtonComponent],
  template: `
    <app-main-layout
      eyebrow="Aviso de Navegación · Código 404"
      pageTitle="Página No Encontrada"
      pageDescription="La dirección que intenta abrir no existe dentro del portal de la Clínica Piedra Azul."
    >
      <section class="pa-not-found-card">
        <div class="pa-not-found-card__code">404</div>
        <app-badge variant="warning" text="Dirección no disponible" />
        <h2>No encontramos la página solicitada</h2>
        <p>
          Presione el botón de abajo para regresar a la pantalla principal de la clínica.
        </p>
        <app-button
          label="Regresar al Inicio"
          variant="primary"
          size="lg"
          (clicked)="goHome()"
        />
      </section>
    </app-main-layout>
  `,
  styles: [
    `
      .pa-not-found-card {
        max-width: 680px;
        margin: 1rem auto;
        background-color: var(--pa-white);
        border: 2px solid var(--pa-border-strong);
        border-top: 8px solid var(--pa-blue-700);
        border-radius: var(--pa-radius-lg);
        padding: 2.5rem 2.25rem;
        text-align: center;
        box-shadow: var(--pa-shadow-md);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.25rem;
      }

      .pa-not-found-card__code {
        font-size: 3.4rem;
        font-weight: 900;
        line-height: 1.1;
        color: var(--pa-blue-900);
      }

      .pa-not-found-card p {
        color: var(--pa-text-secondary);
        font-size: 1.15rem;
        max-width: 520px;
      }
    `,
  ],
})
export class NotFoundPageComponent {
  private readonly router = inject(Router);

  goHome(): void {
    void this.router.navigate(['/login']);
  }
}
