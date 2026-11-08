import { Component, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { CitaApiItem, MedicoApiItem, PacienteApiItem } from '../../core/models/clinic.models';
import { AuthService } from '../../core/services/auth.service';
import { ClinicApiService } from '../../core/services/clinic-api.service';
import { BadgeComponent } from '../../shared/atoms/badge/badge.component';
import { CitaFormComponent } from '../../shared/organisms/cita-form/cita-form.component';
import { CitasListComponent } from '../../shared/organisms/citas-list/citas-list.component';
import { MedicoFormComponent } from '../../shared/organisms/medico-form/medico-form.component';
import { MedicosListComponent } from '../../shared/organisms/medicos-list/medicos-list.component';
import { PacienteFormComponent } from '../../shared/organisms/paciente-form/paciente-form.component';
import { PacientesListComponent } from '../../shared/organisms/pacientes-list/pacientes-list.component';
import { MainLayoutComponent } from '../../shared/templates/main-layout/main-layout.component';

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    MainLayoutComponent,
    BadgeComponent,
    MedicoFormComponent,
    PacienteFormComponent,
    CitaFormComponent,
    MedicosListComponent,
    PacientesListComponent,
    CitasListComponent,
  ],
  template: `
    <app-main-layout
      eyebrow="Rol Autorizado: Administrador"
      pageTitle="Panel de Administración Hospitalaria"
      pageDescription="Registre nuevos médicos, pacientes y citas médicas mediante formularios claros y consulte la información en tiempo real."
    >
      <div heroExtra>
        <app-badge
          variant="primary"
          [text]="'Sesión activa: ' + (authService.user()?.email ?? '')"
        />
      </div>

      <!-- Indicadores Clínicos en Tiempo Real -->
      <section class="pa-kpi-grid" aria-label="Resumen de registros en la clínica">
        <article class="pa-kpi-card">
          <span class="pa-kpi-card__label">Médicos Registrados</span>
          <strong class="pa-kpi-card__value">{{ medicos().length }}</strong>
          <span class="pa-kpi-card__meta">Datos en vivo desde /api/medicos/admin</span>
        </article>

        <article class="pa-kpi-card pa-kpi-card--green">
          <span class="pa-kpi-card__label">Pacientes en Padrón</span>
          <strong class="pa-kpi-card__value">{{ pacientes().length }}</strong>
          <span class="pa-kpi-card__meta">Verificación reactiva de cédula activa</span>
        </article>

        <article class="pa-kpi-card">
          <span class="pa-kpi-card__label">Citas en Agenda</span>
          <strong class="pa-kpi-card__value">{{ totalCitas() }}</strong>
          <span class="pa-kpi-card__meta">Control de solapamiento (409) activo</span>
        </article>

        <article class="pa-kpi-card pa-kpi-card--green">
          <span class="pa-kpi-card__label">Rol en Token JWT</span>
          <strong class="pa-kpi-card__value">Administrador</strong>
          <span class="pa-kpi-card__meta">Protegido por authGuard y roleGuard</span>
        </article>
      </section>

      <!-- Navegación Grande por Módulos -->
      <nav class="pa-subnav" aria-label="Módulos de administración">
        <a
          routerLink="/admin"
          routerLinkActive="pa-subnav__item--active"
          [routerLinkActiveOptions]="{ exact: true }"
          class="pa-subnav__item"
        >
          📋 Vista Completa
        </a>
        <a
          routerLink="/admin/medicos"
          routerLinkActive="pa-subnav__item--active"
          class="pa-subnav__item"
        >
          🩺 Módulo de Médicos
        </a>
        <a
          routerLink="/admin/pacientes"
          routerLinkActive="pa-subnav__item--active"
          class="pa-subnav__item"
        >
          👤 Módulo de Pacientes
        </a>
        <a
          routerLink="/admin/citas"
          routerLinkActive="pa-subnav__item--active"
          class="pa-subnav__item"
        >
          📅 Módulo de Citas Médicas
        </a>
      </nav>

      <!-- MÓDULO 1: MÉDICOS -->
      @if (section() === 'all' || section() === 'medicos') {
        <div class="pa-module-block">
          <app-medico-form (medicoCreated)="onMedicoCreated()" />
          <app-medicos-list
            #medicosListRef
            [adminMode]="true"
            (loaded)="onMedicosLoaded($event)"
          />
        </div>
      }

      <!-- MÓDULO 2: PACIENTES -->
      @if (section() === 'all' || section() === 'pacientes') {
        <div class="pa-module-block">
          <app-paciente-form (pacienteCreated)="onPacienteCreated()" />
          <app-pacientes-list
            #pacientesListRef
            (loaded)="onPacientesLoaded($event)"
          />
        </div>
      }

      <!-- MÓDULO 3: CITAS MÉDICAS -->
      @if (section() === 'all' || section() === 'citas') {
        <div class="pa-module-block">
          <app-cita-form
            [pacientes]="pacientes()"
            [medicos]="medicosActivos()"
            (citaCreated)="onCitaCreated()"
          />
          <app-citas-list
            #citasListRef
            mode="admin"
            (loaded)="onCitasLoaded($event)"
          />
        </div>
      }
    </app-main-layout>
  `,
  styles: [
    `
      .pa-kpi-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1.25rem;
      }

      .pa-kpi-card {
        background: var(--pa-surface);
        border: 2px solid var(--pa-border);
        border-left: 6px solid var(--pa-blue-700);
        border-radius: var(--pa-radius-md);
        padding: 1.35rem 1.5rem;
        box-shadow: var(--pa-shadow-sm);
        display: flex;
        flex-direction: column;
        gap: 0.35rem;
      }

      .pa-kpi-card--green {
        border-left-color: var(--pa-green-700);
      }

      .pa-kpi-card__label {
        font-size: 0.95rem;
        font-weight: 800;
        text-transform: uppercase;
        color: var(--pa-text-secondary);
      }

      .pa-kpi-card__value {
        font-size: 2rem;
        font-weight: 900;
        color: var(--pa-blue-900);
      }

      .pa-kpi-card__meta {
        font-size: 0.95rem;
        color: var(--pa-green-800);
        font-weight: 700;
      }

      .pa-subnav {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
        padding: 0.75rem;
        background-color: var(--pa-white);
        border: 2px solid var(--pa-border);
        border-radius: var(--pa-radius-md);
      }

      /* Botones de pestaña >= 48px de alto para accesibilidad */
      .pa-subnav__item {
        display: inline-flex;
        align-items: center;
        min-height: 50px;
        padding: 0.7rem 1.35rem;
        border-radius: var(--pa-radius-sm);
        font-size: 1.08rem;
        font-weight: 800;
        text-decoration: none;
        color: var(--pa-blue-900);
        border: 2px solid transparent;
        transition:
          background-color var(--pa-transition),
          color var(--pa-transition);

        &:hover {
          background-color: var(--pa-blue-50);
          border-color: var(--pa-blue-200);
        }
      }

      .pa-subnav__item--active {
        background-color: var(--pa-blue-700);
        color: var(--pa-white) !important;
      }

      .pa-module-block {
        display: flex;
        flex-direction: column;
        gap: 1.75rem;
      }

      @media (max-width: 1080px) {
        .pa-kpi-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      @media (max-width: 600px) {
        .pa-kpi-grid {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class AdminDashboardPageComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly clinicApi = inject(ClinicApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly routeData = toSignal(this.route.data);

  @ViewChild('medicosListRef') medicosListRef?: MedicosListComponent;
  @ViewChild('pacientesListRef') pacientesListRef?: PacientesListComponent;
  @ViewChild('citasListRef') citasListRef?: CitasListComponent;

  readonly medicos = signal<MedicoApiItem[]>([]);
  readonly pacientes = signal<PacienteApiItem[]>([]);
  readonly totalCitas = signal<number>(0);

  readonly medicosActivos = computed(() =>
    this.medicos().filter((m) => m.activo !== false)
  );

  readonly section = computed(() => {
    const dataSection = this.routeData()?.['section'] as string | undefined;
    return dataSection ?? 'all';
  });

  ngOnInit(): void {
    this.loadCatalogs();
  }

  loadCatalogs(): void {
    this.clinicApi.getMedicosAdmin().subscribe({
      next: (res) => this.medicos.set(res.data),
    });
    this.clinicApi.getPacientesAdmin().subscribe({
      next: (res) => this.pacientes.set(res.data),
    });
    this.clinicApi.getCitasAdmin().subscribe({
      next: (res) => this.totalCitas.set(res.total),
    });
  }

  onMedicosLoaded(items: MedicoApiItem[]): void {
    this.medicos.set(items);
  }

  onPacientesLoaded(items: PacienteApiItem[]): void {
    this.pacientes.set(items);
  }

  onCitasLoaded(items: CitaApiItem[]): void {
    this.totalCitas.set(items.length);
  }

  onMedicoCreated(): void {
    this.medicosListRef?.reload();
    this.loadCatalogs();
  }

  onPacienteCreated(): void {
    this.pacientesListRef?.reload();
    this.loadCatalogs();
  }

  onCitaCreated(): void {
    this.citasListRef?.reload();
    this.loadCatalogs();
  }
}
