import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { MedicoApiItem, TableColumn } from '../../../core/models/clinic.models';
import { ClinicApiService } from '../../../core/services/clinic-api.service';
import { ButtonComponent } from '../../atoms/button/button.component';
import { TableWithTitleComponent } from '../../molecules/table-with-title/table-with-title.component';

@Component({
  selector: 'app-medicos-list',
  standalone: true,
  imports: [TableWithTitleComponent, ButtonComponent],
  template: `
    <app-table-with-title
      title="Directorio de Médicos Especialistas"
      subtitle="Profesionales de la salud adscritos a la Clínica Piedra Azul y sus horarios de atención."
      [badgeText]="rows().length + ' médicos'"
      [columns]="columns"
      [data]="rows()"
      [emptyMessage]="loading() ? 'Cargando directorio de médicos...' : 'No hay médicos registrados.'"
    >
      <app-button
        label="↻ Actualizar Tabla"
        variant="outline"
        size="sm"
        (clicked)="reload()"
      />
    </app-table-with-title>
  `,
})
export class MedicosListComponent implements OnInit {
  private readonly clinicApi = inject(ClinicApiService);

  @Input() adminMode = false;
  @Output() loaded = new EventEmitter<MedicoApiItem[]>();

  readonly loading = signal(false);
  readonly rows = signal<Record<string, unknown>[]>([]);

  readonly columns: TableColumn[] = [
    { key: 'nombreCompleto', label: 'Médico Especialista' },
    { key: 'especialidadTexto', label: 'Especialidad', type: 'badge' },
    { key: 'tarjetaProfesional', label: 'Tarjeta Profesional' },
    { key: 'consultorio', label: 'Consultorio' },
    { key: 'horarioTexto', label: 'Días y Horario' },
    {
      key: 'estadoTexto',
      label: 'Estado',
      type: 'badge',
      badgeMap: { Activo: 'success', Inactivo: 'danger' },
    },
  ];

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    const source$ = this.adminMode
      ? this.clinicApi.getMedicosAdmin()
      : this.clinicApi.getMedicosPublic();

    source$.subscribe({
      next: (res) => {
        this.loading.set(false);
        this.loaded.emit(res.data);
        this.rows.set(
          res.data.map((m) => {
            const esp =
              m.especialidadNombre ||
              (typeof m.especialidad === 'string'
                ? m.especialidad
                : m.especialidad?.nombre) ||
              'General';
            return {
              ...m,
              especialidadTexto: esp,
              horarioTexto: `${m.diasAtencion} (${m.horaInicio} - ${m.horaFin})`,
              estadoTexto: m.activo === false ? 'Inactivo' : 'Activo',
            };
          })
        );
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
