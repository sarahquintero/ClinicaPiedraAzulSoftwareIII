import { Component, EventEmitter, OnInit, Output, inject, signal } from '@angular/core';
import { PacienteApiItem, TableColumn } from '../../../core/models/clinic.models';
import { ClinicApiService } from '../../../core/services/clinic-api.service';
import { ButtonComponent } from '../../atoms/button/button.component';
import { TableWithTitleComponent } from '../../molecules/table-with-title/table-with-title.component';

@Component({
  selector: 'app-pacientes-list',
  standalone: true,
  imports: [TableWithTitleComponent, ButtonComponent],
  template: `
    <app-table-with-title
      title="Padrón de Pacientes Registrados"
      subtitle="Fichas clínicas activas y datos de contacto verificados en admisiones."
      [badgeText]="rows().length + ' pacientes'"
      [columns]="columns"
      [data]="rows()"
      [emptyMessage]="loading() ? 'Cargando pacientes...' : 'No hay pacientes registrados.'"
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
export class PacientesListComponent implements OnInit {
  private readonly clinicApi = inject(ClinicApiService);

  @Output() loaded = new EventEmitter<PacienteApiItem[]>();

  readonly loading = signal(false);
  readonly rows = signal<Record<string, unknown>[]>([]);

  readonly columns: TableColumn[] = [
    { key: 'tipoDocumento', label: 'Tipo' },
    { key: 'cedula', label: 'Número de Cédula' },
    { key: 'nombreCompleto', label: 'Nombre del Paciente' },
    { key: 'fechaNacimientoTexto', label: 'Fecha Nacimiento' },
    { key: 'genero', label: 'Género' },
    { key: 'grupoSanguineoTexto', label: 'RH', type: 'badge' },
    { key: 'telefono', label: 'Teléfono' },
    { key: 'email', label: 'Correo Electrónico' },
  ];

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this.clinicApi.getPacientesAdmin().subscribe({
      next: (res) => {
        this.loading.set(false);
        this.loaded.emit(res.data);
        this.rows.set(
          res.data.map((p) => ({
            ...p,
            nombreCompleto: p.nombreCompleto || `${p.nombres} ${p.apellidos}`,
            fechaNacimientoTexto: String(p.fechaNacimiento).slice(0, 10),
            grupoSanguineoTexto: p.grupoSanguineo || 'N/A',
          }))
        );
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
