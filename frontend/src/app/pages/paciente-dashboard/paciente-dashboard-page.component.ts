import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CitaApiItem } from '../../core/models/clinic.models';
import { AuthService } from '../../core/services/auth.service';
import { BadgeComponent } from '../../shared/atoms/badge/badge.component';
import { ButtonComponent } from '../../shared/atoms/button/button.component';
import { CitasListComponent } from '../../shared/organisms/citas-list/citas-list.component';
import { MedicosListComponent } from '../../shared/organisms/medicos-list/medicos-list.component';
import { MainLayoutComponent } from '../../shared/templates/main-layout/main-layout.component';

@Component({
  selector: 'app-paciente-dashboard-page',
  standalone: true,
  imports: [
    RouterLink,
    MainLayoutComponent,
    BadgeComponent,
    ButtonComponent,
    CitasListComponent,
    MedicosListComponent,
  ],
  template: `
    <app-main-layout
      eyebrow="Portal Personal del Paciente"
      [pageTitle]="'Bienvenido(a), ' + (authService.user()?.nombre ?? 'Paciente')"
      pageDescription="Aquí puede consultar de forma clara y segura todas sus citas médicas registradas en la Clínica Piedra Azul."
    >
      <!-- Panel en Azul Celeste Claro y Blanco de Alto Contraste -->
      <section class="pa-patient-banner">
        <div class="pa-patient-banner__info">
          <div class="pa-patient-banner__badges">
            <app-badge variant="primary" text="Rol: Paciente" />
            <app-badge variant="info" [text]="'Correo: ' + (authService.user()?.email ?? '')" />
            <app-badge variant="success" [text]="misCitasCount() + ' citas asociadas'" />
          </div>
          <h2>Información sobre sus Citas Médicas</h2>
          <p>
            Sus citas se cargan directamente desde el servidor (<code>GET /api/citas/mis-citas</code>)
            usando su token de seguridad. Para programar una nueva cita, acérquese o comuníquese con
            Admisiones.
          </p>
        </div>

        <div class="pa-patient-banner__guard-test">
          <span>Prueba de Seguridad de Roles (Guard 2):</span>
          <a routerLink="/admin/medicos">
            <app-button
              label="Intentar entrar a /admin/medicos (Redirige a /unauthorized)"
              variant="outline"
              size="md"
            />
          </a>
        </div>
      </section>

      <!-- Organismo Conectado a GET /api/citas/mis-citas -->
      <app-citas-list mode="paciente" (loaded)="onMisCitasLoaded($event)" />

      <!-- Organismo Conectado a GET /api/medicos -->
      <app-medicos-list [adminMode]="false" />
    </app-main-layout>
  `,
  styles: [
    `
      .pa-patient-banner {
        background-color: var(--pa-surface-alt);
        border: 2px solid var(--pa-border-strong);
        border-left: 8px solid var(--pa-blue-700);
        border-radius: var(--pa-radius-lg);
        padding: 1.65rem 1.85rem;
        box-shadow: var(--pa-shadow-sm);
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 1.5rem;
      }

      .pa-patient-banner__info {
        display: flex;
        flex-direction: column;
        gap: 0.65rem;
        max-width: 780px;

        p {
          font-size: 1.08rem;
          color: var(--pa-text-secondary);
        }
      }

      .pa-patient-banner__badges {
        display: flex;
        flex-wrap: wrap;
        gap: 0.65rem;
      }

      .pa-patient-banner__guard-test {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.55rem;

        span {
          font-size: 0.95rem;
          font-weight: 800;
          color: var(--pa-blue-900);
        }

        a {
          text-decoration: none;
        }
      }
    `,
  ],
})
export class PacienteDashboardPageComponent {
  readonly authService = inject(AuthService);
  readonly misCitasCount = signal(0);

  onMisCitasLoaded(citas: CitaApiItem[]): void {
    this.misCitasCount.set(citas.length);
  }
}
