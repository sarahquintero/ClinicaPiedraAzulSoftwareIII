import { HttpErrorResponse } from '@angular/common/http';
import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MedicoApiItem, PacienteApiItem } from '../../../core/models/clinic.models';
import { ClinicApiService } from '../../../core/services/clinic-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { ButtonComponent } from '../../atoms/button/button.component';

function defaultFutureDateTimeLocal(): string {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  d.setHours(10, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const fechaFuturaValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const val = control.value as string;
  if (!val) {
    return null;
  }
  const parsed = new Date(val);
  if (Number.isNaN(parsed.getTime()) || parsed <= new Date()) {
    return { citaEnPasado: true };
  }
  return null;
};

@Component({
  selector: 'app-cita-form',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonComponent],
  template: `
    <section class="pa-form-card" aria-labelledby="cita-form-title">
      <header class="pa-form-card__header">
        <h2 id="cita-form-title">Formulario de Programación de Cita Médica</h2>
        <p>
          Seleccione el paciente, el médico especialista y la fecha y hora de atención. El sistema
          valida automáticamente que no existan cruces de horario (código 409).
        </p>
      </header>

      @if (backendError()) {
        <div class="pa-form-error" role="alert">
          <span class="pa-form-error__icon" aria-hidden="true">⚠️</span>
          <span>{{ backendError() }}</span>
        </div>
      }

      <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
        <div class="pa-form-grid">
          <!-- Paciente -->
          <div class="pa-form-field">
            <label class="pa-form-label" for="cita-paciente">
              Seleccione el Paciente <span class="pa-form-req">*</span>
            </label>
            <select
              id="cita-paciente"
              class="pa-form-control"
              [class.pa-form-control--invalid]="isInvalid('pacienteId')"
              formControlName="pacienteId"
            >
              <option value="">— Seleccione un paciente de la lista —</option>
              @for (p of pacientes; track p.id) {
                <option [value]="p.id">
                  {{ p.nombres }} {{ p.apellidos }} — Cédula: {{ p.cedula }}
                </option>
              }
            </select>
            @if (isInvalid('pacienteId')) {
              <div class="pa-form-error" role="alert">
                <span class="pa-form-error__icon" aria-hidden="true">⚠️</span>
                <span>Debe seleccionar un paciente registrado.</span>
              </div>
            }
          </div>

          <!-- Médico -->
          <div class="pa-form-field">
            <label class="pa-form-label" for="cita-medico">
              Seleccione el Médico Especialista <span class="pa-form-req">*</span>
            </label>
            <select
              id="cita-medico"
              class="pa-form-control"
              [class.pa-form-control--invalid]="isInvalid('medicoId')"
              formControlName="medicoId"
            >
              <option value="">— Seleccione un médico especialista —</option>
              @for (m of medicos; track m.id) {
                <option [value]="m.id">
                  {{ m.nombreCompleto }} — {{ m.especialidadNombre || m.especialidad }} ({{ m.consultorio }})
                </option>
              }
            </select>
            @if (isInvalid('medicoId')) {
              <div class="pa-form-error" role="alert">
                <span class="pa-form-error__icon" aria-hidden="true">⚠️</span>
                <span>Debe seleccionar el médico que atenderá la consulta.</span>
              </div>
            }
          </div>

          <!-- Fecha y Hora -->
          <div class="pa-form-field">
            <label class="pa-form-label" for="cita-fecha-hora">
              Fecha y Hora de la Cita <span class="pa-form-req">*</span>
            </label>
            <input
              id="cita-fecha-hora"
              type="datetime-local"
              class="pa-form-control pa-form-control--date"
              [class.pa-form-control--invalid]="isInvalid('fechaHora')"
              formControlName="fechaHora"
              (click)="openNativePicker($event)"
            />
            @if (isInvalid('fechaHora')) {
              <div class="pa-form-error" role="alert">
                <span class="pa-form-error__icon" aria-hidden="true">⚠️</span>
                <span>Seleccione una fecha y hora futuras válidas para la cita.</span>
              </div>
            }
          </div>

          <!-- Duración -->
          <div class="pa-form-field">
            <label class="pa-form-label" for="cita-duracion">
              Duración Estimada (Minutos) <span class="pa-form-req">*</span>
            </label>
            <select
              id="cita-duracion"
              class="pa-form-control"
              formControlName="duracionMinutos"
            >
              <option [ngValue]="20">20 minutos (Control breve)</option>
              <option [ngValue]="30">30 minutos (Consulta estándar)</option>
              <option [ngValue]="45">45 minutos (Valoración geriátrica)</option>
              <option [ngValue]="60">60 minutos (Consulta integral)</option>
            </select>
          </div>

          <!-- Motivo de Consulta -->
          <div class="pa-form-field pa-form-field--full">
            <label class="pa-form-label" for="cita-motivo">
              Motivo de la Consulta Médica <span class="pa-form-req">*</span>
            </label>
            <input
              id="cita-motivo"
              type="text"
              class="pa-form-control"
              [class.pa-form-control--invalid]="isInvalid('motivo')"
              formControlName="motivo"
              placeholder="Ej. Control periódico de tensión arterial y entrega de resultados"
            />
            @if (isInvalid('motivo')) {
              <div class="pa-form-error" role="alert">
                <span class="pa-form-error__icon" aria-hidden="true">⚠️</span>
                <span>Describa el motivo de la consulta (mínimo 5 caracteres).</span>
              </div>
            }
          </div>

          <!-- Notas Adicionales -->
          <div class="pa-form-field pa-form-field--full">
            <label class="pa-form-label" for="cita-notas">
              Observaciones o Recomendaciones para el Paciente (Opcional)
            </label>
            <input
              id="cita-notas"
              type="text"
              class="pa-form-control"
              formControlName="notas"
              placeholder="Ej. Asistir con acompañante y traer fórmula médica vigente"
            />
          </div>
        </div>

        <div class="pa-form-actions">
          <app-button
            label="Reiniciar Selección"
            variant="outline"
            type="button"
            (clicked)="resetForm()"
          />
          <app-button
            [label]="submitting() ? 'Programando Cita...' : 'Confirmar y Agendar Cita'"
            variant="secondary"
            type="submit"
            [disabled]="submitting()"
          />
        </div>
      </form>
    </section>
  `,
})
export class CitaFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly clinicApi = inject(ClinicApiService);
  private readonly toastService = inject(ToastService);

  @Input() pacientes: PacienteApiItem[] = [];
  @Input() medicos: MedicoApiItem[] = [];
  @Output() citaCreated = new EventEmitter<void>();

  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly backendError = signal('');

  readonly form = this.fb.nonNullable.group({
    pacienteId: ['', [Validators.required]],
    medicoId: ['', [Validators.required]],
    fechaHora: [defaultFutureDateTimeLocal(), [Validators.required, fechaFuturaValidator]],
    duracionMinutos: [30, [Validators.required, Validators.min(15), Validators.max(120)]],
    motivo: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(300)]],
    notas: [''],
  });

  isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return Boolean(control && control.invalid && (control.touched || this.submitted()));
  }

  openNativePicker(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    if (input && typeof input.showPicker === 'function') {
      try {
        input.showPicker();
      } catch {
        // Ignorar si ya está abierto
      }
    }
  }

  onSubmit(): void {
    this.submitted.set(true);
    this.backendError.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const raw = this.form.getRawValue();
    const isoDate = new Date(raw.fechaHora).toISOString();

    this.clinicApi
      .createCitaAdmin({
        pacienteId: raw.pacienteId,
        medicoId: raw.medicoId,
        fechaHora: isoDate,
        duracionMinutos: Number(raw.duracionMinutos),
        motivo: raw.motivo.trim(),
        notas: raw.notas.trim() || undefined,
      })
      .subscribe({
        next: (res) => {
          this.submitting.set(false);
          this.toastService.showSuccess(
            res.message || 'Cita médica agendada exitosamente.'
          );
          this.resetForm();
          this.citaCreated.emit();
        },
        error: (err: HttpErrorResponse) => {
          this.submitting.set(false);
          const msg =
            err.error?.message ||
            'No se pudo agendar la cita. Verifique que el horario no esté ocupado.';
          this.backendError.set(msg);
          this.toastService.showError(msg);
        },
      });
  }

  resetForm(): void {
    this.submitted.set(false);
    this.backendError.set('');
    this.form.reset({
      pacienteId: '',
      medicoId: '',
      fechaHora: defaultFutureDateTimeLocal(),
      duracionMinutos: 30,
      motivo: '',
      notas: '',
    });
  }
}
