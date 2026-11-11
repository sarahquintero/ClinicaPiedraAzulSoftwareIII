import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { BadgeComponent } from '../../shared/atoms/badge/badge.component';
import { ButtonComponent } from '../../shared/atoms/button/button.component';
import { MainLayoutComponent } from '../../shared/templates/main-layout/main-layout.component';

@Component({
  selector: 'app-unauthorized-page',
  standalone: true,
  imports: [MainLayoutComponent, BadgeComponent, ButtonComponent],
  template: `
    <app-main-layout
      eyebrow="Control de Acceso · Código 403"
      pageTitle="Acceso No Autorizado para su Rol"
      [pageDescription]="description()"
    >
      <section class="pa-status-card" role="alert">
        <div class="pa-status-card__code">⚠️ 403</div>
        <app-badge
          variant="danger"
          [text]="'Rol actual en sesión: ' + (authService.currentRole() ?? 'Sin sesión')"
        />
        @if (requiredRole(); as required) {
          <h2>Esta sección es exclusiva para el {{ required }}</h2>
        } @else {
          <h2>Esta sección requiere una sesión activa</h2>
        }
        <p>
          El sistema de seguridad (<code>roleGuard</code>) verificó su perfil y bloqueó el acceso
          para proteger la información hospitalaria. Puede regresar a su panel principal con el
          botón de abajo.
        </p>

        <div class="pa-status-card__actions">
          <app-button
            label="Volver a mi Panel Principal"
            variant="primary"
            size="lg"
            (clicked)="goToAuthorizedHome()"
          />
          <app-button
            label="Iniciar Sesión con Otra Cuenta"
            variant="outline"
            size="lg"
            (clicked)="switchAccount()"
          />
        </div>
      </section>
    </app-main-layout>
  `,
  styles: [
    `
      .pa-status-card {
        max-width: 720px;
        margin: 1rem auto;
        background-color: var(--pa-white);
        border: 2px solid var(--pa-danger-border);
        border-top: 8px solid var(--pa-danger-border);
        border-radius: var(--pa-radius-lg);
        padding: 2.5rem 2.25rem;
        text-align: center;
        box-shadow: var(--pa-shadow-md);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1.25rem;
      }

      .pa-status-card__code {
        font-size: 3.2rem;
        font-weight: 900;
        line-height: 1.1;
        color: var(--pa-danger-text);
      }

      .pa-status-card p {
        color: var(--pa-text-secondary);
        font-size: 1.15rem;
        max-width: 580px;
      }

      .pa-status-card__actions {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 1rem;
        margin-top: 0.5rem;
      }
    `,
  ],
})
export class UnauthorizedPageComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  /**
   * Rol que sí puede ver la sección bloqueada. Con solo dos roles en la app,
   * es el opuesto al rol de la sesión actual: si es Paciente, la sección era de
   * Administrador, y viceversa.
   */
  readonly requiredRole = computed<string | null>(() => {
    switch (this.authService.currentRole()) {
      case 'Paciente':
        return 'Administrador';
      case 'Administrador':
        return 'Paciente';
      default:
        return null;
    }
  });

  readonly description = computed(() => {
    const required = this.requiredRole();
    return required
      ? `Su cuenta actual no cuenta con los permisos necesarios para abrir esta sección, que es exclusiva del rol ${required}.`
      : 'Debe iniciar sesión con una cuenta autorizada para abrir esta sección.';
  });

  goToAuthorizedHome(): void {
    const role = this.authService.currentRole();
    if (role === 'Administrador') {
      void this.router.navigate(['/admin']);
    } else if (role === 'Paciente') {
      void this.router.navigate(['/paciente']);
    } else {
      void this.router.navigate(['/login']);
    }
  }

  switchAccount(): void {
    this.authService.logout();
  }
}