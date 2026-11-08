import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CitaApiItem, TableColumn } from '../../../core/models/clinic.models';
import { ClinicApiService } from '../../../core/services/clinic-api.service';
import { ButtonComponent } from '../../atoms/button/button.component';
import { TableWithTitleComponent } from '../../molecules/table-with-title/table-with-title.component';

@Component({
  selector: 'app-citas-list',
  standalone: true,
  imports: [TableWithTitleComponent, ButtonComponent],
  template: `
    <app-table-with-title
      [title]="
        mode === 'paciente'
          ? 'Mis Citas Médicas Programadas e Historial'
          : 'Agenda Global de Citas Médicas'
      "
      [subtitle]="
        mode === 'paciente'
          ? 'Listado exclusivo de tus citas médicas registradas en la Clínica Piedra Azul.'
          : 'Supervisión centralizada de todas las citas agendadas en la institución.'
      "
      [badgeText]="rows().length + ' citas'"
      [columns]="activeColumns"
      [data]="rows()"
      [emptyMessage]="loading() ? 'Consultando citas médicas...' : 'No hay citas registradas.'"
    >
      <app-button
        label="↻ Actualizar Citas"
        variant="outline"
        size="sm"
        (clicked)="reload()"
      />
    </app-table-with-title>
  `,
})
export class CitasListComponent implements OnInit {
  private readonly clinicApi = inject(ClinicApiService);

  @Input() mode: 'admin' | 'paciente' = 'admin';
  @Output() loaded = new EventEmitter<CitaApiItem[]>();

  readonly loading = signal(false);
  readonly rows = signal<Record<string, unknown>[]>([]);

  private readonly adminColumns: TableColumn[] = [
    { key: 'fechaHoraTexto', label: 'Fecha y Hora' },
    { key: 'pacienteNombre', label: 'Paciente' },
    { key: 'pacienteCedula', label: 'Cédula' },
    { key: 'medicoNombre', label: 'Médico Especialista' },
    { key: 'especialidad', label: 'Especialidad', type: 'badge' },
    { key: 'consultorio', label: 'Consultorio' },
    { key: 'motivo', label: 'Motivo de Consulta' },
    {
      key: 'estado',
      label: 'Estado',
      type: 'badge',
      badgeMap: {
        PROGRAMADA: 'primary',
        COMPLETADA: 'success',
        CANCELADA: 'danger',
      },
    },
  ];

  private readonly pacienteColumns: TableColumn[] = [
    { key: 'fechaHoraTexto', label: 'Fecha y Hora' },
    { key: 'medicoNombre', label: 'Médico Especialista' },
    { key: 'especialidad', label: 'Especialidad', type: 'badge' },
    { key: 'consultorio', label: 'Consultorio' },
    { key: 'motivo', label: 'Motivo de Consulta' },
    {
      key: 'estado',
      label: 'Estado',
      type: 'badge',
      badgeMap: {
        PROGRAMADA: 'primary',
        COMPLETADA: 'success',
        CANCELADA: 'danger',
      },
    },
  ];

  get activeColumns(): TableColumn[] {
    return this.mode === 'paciente' ? this.pacienteColumns : this.adminColumns;
  }

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    const request$ =
      this.mode === 'paciente'
        ? this.clinicApi.getMisCitasPaciente()
        : this.clinicApi.getCitasAdmin();

    request$.subscribe({
      next: (res) => {
        this.loading.set(false);
        this.loaded.emit(res.data);
        this.rows.set(
          res.data.map((c) => {
            const fecha = new Date(c.fechaHora);
            const fechaTexto = Number.isNaN(fecha.getTime())
              ? c.fechaHora
              : fecha.toLocaleString('es-CO', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                });
            return {
              id: c.id,
              fechaHoraTexto: fechaTexto,
              pacienteNombre: `${c.paciente.nombres} ${c.paciente.apellidos}`,
              pacienteCedula: c.paciente.cedula,
              medicoNombre: `Dr(a). ${c.medico.nombres} ${c.medico.apellidos}`,
              especialidad: c.medico.especialidad?.nombre || 'General',
              consultorio: c.medico.consultorio,
              motivo: c.motivo,
              estado: c.estado,
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
