import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
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

function parseDdMmYyyy(value: string): Date | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) {
    return null;
  }
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }
  return parsed;
}

function formatDateToDdMmYyyy(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());
  return `${day}/${month}/${year}`;
}

function defaultFutureDateDdMmYyyy(): string {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  return formatDateToDdMmYyyy(d);
}

function combineDateAndTime(fechaDdMmYyyy: string, horaHhMm: string): Date | null {
  const parsedDate = parseDdMmYyyy(fechaDdMmYyyy);
  if (!parsedDate) {
    return null;
  }
  const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(horaHhMm.trim());
  if (!timeMatch) {
    return null;
  }
  const hours = Number(timeMatch[1]);
  const minutes = Number(timeMatch[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }
  parsedDate.setHours(hours, minutes, 0, 0);
  return parsedDate;
}

const fechaDdMmYyyyCitaValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const val = String(control.value ?? '').trim();
  if (!val) {
    return null;
  }
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
    return { formatoFechaInvalido: true };
  }
  const parsed = parseDdMmYyyy(val);
  if (!parsed) {
    return { fechaInvalida: true };
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  parsed.setHours(0, 0, 0, 0);
  if (parsed < today) {
    return { fechaEnPasado: true };
  }
  return null;
};

const citaFechaHoraFuturaValidator: ValidatorFn = (
  group: AbstractControl
): ValidationErrors | null => {
  const fecha = group.get('fechaCita')?.value as string | undefined;
  const hora = group.get('horaCita')?.value as string | undefined;
  if (!fecha || !hora) {
    return null;
  }
  const combined = combineDateAndTime(fecha, hora);
  if (!combined) {
    return null;
  }
  if (combined.getTime() <= Date.now()) {
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

      <form [formGroup]="form" (ngSubmit)="onSubmit()" autocomplete="on" novalidate>
        <div class="pa-form-grid">
          <!-- Paciente -->
          <div class="pa-form-field">
            <label class="pa-form-label" for="citaPacienteId">
              Seleccione el Paciente <span class="pa-form-req">*</span>
            </label>
            <select
              id="citaPacienteId"
              name="pacienteId"
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
            <label class="pa-form-label" for="citaMedicoId">
              Seleccione el Médico Especialista <span class="pa-form-req">*</span>
            </label>
            <select
              id="citaMedicoId"
              name="medicoId"
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

          <!-- Fecha Manual (dd/mm/aaaa) + Botón Calendario Modal Grande + Hora (type="time") -->
          <div class="pa-form-field">
            <label class="pa-form-label" for="citaFecha">
              Fecha (dd/mm/aaaa) y Hora de la Cita <span class="pa-form-req">*</span>
            </label>
            <div class="pa-datetime-row">
              <div class="pa-date-input-group pa-datetime-row__date">
                <input
                  id="citaFecha"
                  name="fechaCita"
                  type="text"
                  inputmode="numeric"
                  maxlength="10"
                  autocomplete="on"
                  class="pa-form-control pa-date-input-group__input"
                  [class.pa-form-control--invalid]="isInvalid('fechaCita') || isFechaHoraFuturaInvalid()"
                  formControlName="fechaCita"
                  placeholder="dd/mm/aaaa (Ej. 20/11/2026)"
                  (input)="onFechaInput($event)"
                  aria-label="Fecha de la cita en formato dd/mm/aaaa"
                />
                <button
                  type="button"
                  class="pa-calendar-trigger-btn"
                  (click)="openCalendarModal()"
                  aria-label="Abrir calendario grande para seleccionar fecha de la cita"
                  title="Abrir calendario"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    aria-hidden="true"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </button>
              </div>

              <div class="pa-datetime-row__time">
                <input
                  id="citaHora"
                  name="horaCita"
                  type="time"
                  autocomplete="on"
                  class="pa-form-control"
                  [class.pa-form-control--invalid]="isInvalid('horaCita') || isFechaHoraFuturaInvalid()"
                  formControlName="horaCita"
                  aria-label="Hora exacta de la cita"
                />
              </div>
            </div>

            @if (isInvalid('fechaCita')) {
              <div class="pa-form-error" role="alert">
                <span class="pa-form-error__icon" aria-hidden="true">⚠️</span>
                <span>{{ getFechaErrorMessage() }}</span>
              </div>
            } @else if (isInvalid('horaCita')) {
              <div class="pa-form-error" role="alert">
                <span class="pa-form-error__icon" aria-hidden="true">⚠️</span>
                <span>Debe seleccionar una hora válida para la cita médica.</span>
              </div>
            } @else if (isFechaHoraFuturaInvalid()) {
              <div class="pa-form-error" role="alert">
                <span class="pa-form-error__icon" aria-hidden="true">⚠️</span>
                <span>La fecha y hora combinadas de la cita deben ser futuras.</span>
              </div>
            }
          </div>

          <!-- Duración -->
          <div class="pa-form-field">
            <label class="pa-form-label" for="citaDuracion">
              Duración Estimada (Minutos) <span class="pa-form-req">*</span>
            </label>
            <select
              id="citaDuracion"
              name="duracionMinutos"
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
            <label class="pa-form-label" for="citaMotivo">
              Motivo de la Consulta Médica <span class="pa-form-req">*</span>
            </label>
            <input
              id="citaMotivo"
              name="motivo"
              type="text"
              autocomplete="on"
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
            <label class="pa-form-label" for="citaNotas">
              Observaciones o Recomendaciones para el Paciente (Opcional)
            </label>
            <input
              id="citaNotas"
              name="notas"
              type="text"
              autocomplete="on"
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

    <!-- Modal Grande Accesible para Selección de Fecha de la Cita Médica -->
    @if (calendarModalOpen()) {
      <div
        class="pa-calendar-modal-backdrop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cita-calendar-modal-title"
        (click)="onBackdropClick($event)"
      >
        <div class="pa-calendar-modal">
          <header class="pa-calendar-modal__header">
            <div>
              <h3 id="cita-calendar-modal-title">Seleccionar Fecha de la Cita</h3>
              <p>Elija el año, el mes y el día disponible para la consulta</p>
            </div>
            <button
              type="button"
              class="pa-calendar-modal__close"
              (click)="closeCalendarModal()"
              aria-label="Cerrar calendario"
            >
              ✕
            </button>
          </header>

          <div class="pa-calendar-modal__controls">
            <button
              type="button"
              class="pa-calendar-nav-btn"
              (click)="changeCalendarMonth(-1)"
              aria-label="Mes anterior"
            >
              ‹
            </button>

            <select
              class="pa-form-control pa-calendar-select"
              [value]="calendarMonth()"
              (change)="onMonthSelect($event)"
              aria-label="Seleccionar mes"
            >
              @for (mes of monthNames; track $index) {
                <option [value]="$index">{{ mes }}</option>
              }
            </select>

            <select
              class="pa-form-control pa-calendar-select"
              [value]="calendarYear()"
              (change)="onYearSelect($event)"
              aria-label="Seleccionar año"
            >
              @for (anio of availableYears; track anio) {
                <option [value]="anio">{{ anio }}</option>
              }
            </select>

            <button
              type="button"
              class="pa-calendar-nav-btn"
              (click)="changeCalendarMonth(1)"
              aria-label="Mes siguiente"
            >
              ›
            </button>
          </div>

          <div class="pa-calendar-weekdays" aria-hidden="true">
            <span>Lun</span>
            <span>Mar</span>
            <span>Mié</span>
            <span>Jue</span>
            <span>Vie</span>
            <span>Sáb</span>
            <span>Dom</span>
          </div>

          <div class="pa-calendar-days-grid">
            @for (cell of calendarDays(); track $index) {
              @if (cell === null) {
                <span class="pa-calendar-day-empty" aria-hidden="true"></span>
              } @else {
                <button
                  type="button"
                  class="pa-calendar-day-btn"
                  [class.pa-calendar-day-btn--selected]="isSelectedDay(cell)"
                  [disabled]="isPastCalendarDay(cell)"
                  (click)="selectCalendarDay(cell)"
                >
                  {{ cell }}
                </button>
              }
            }
          </div>

          <footer class="pa-calendar-modal__footer">
            <app-button
              label="Cerrar Calendario"
              variant="outline"
              type="button"
              (clicked)="closeCalendarModal()"
            />
          </footer>
        </div>
      </div>
    }
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

  // Estado del Modal de Calendario Grande para Citas
  readonly calendarModalOpen = signal(false);
  readonly calendarMonth = signal(new Date().getMonth());
  readonly calendarYear = signal(new Date().getFullYear());

  readonly monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  readonly availableYears: number[] = Array.from(
    { length: 6 },
    (_, i) => new Date().getFullYear() + i
  );

  readonly calendarDays = computed<(number | null)[]>(() => {
    const year = this.calendarYear();
    const month = this.calendarMonth();
    const firstDayJs = new Date(year, month, 1).getDay();
    const offsetMonday = (firstDayJs + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: (number | null)[] = Array.from({ length: offsetMonday }, () => null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(d);
    }
    return cells;
  });

  readonly form = this.fb.nonNullable.group(
    {
      pacienteId: ['', [Validators.required]],
      medicoId: ['', [Validators.required]],
      fechaCita: [defaultFutureDateDdMmYyyy(), [Validators.required, fechaDdMmYyyyCitaValidator]],
      horaCita: ['10:00', [Validators.required, Validators.pattern(/^([01]\d|2[0-3]):[0-5]\d$/)]],
      duracionMinutos: [30, [Validators.required, Validators.min(15), Validators.max(120)]],
      motivo: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(300)]],
      notas: [''],
    },
    { validators: [citaFechaHoraFuturaValidator] }
  );

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.calendarModalOpen()) {
      this.closeCalendarModal();
    }
  }

  onFechaInput(event: Event): void {
    const inputEvent = event as InputEvent;
    const input = event.target as HTMLInputElement;
    if (inputEvent.inputType?.startsWith('delete')) {
      return;
    }

    const digits = input.value.replace(/\D/g, '').slice(0, 8);
    let formatted = digits;
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    } else if (digits.length === 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}/`;
    } else if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    } else if (digits.length === 2) {
      formatted = `${digits}/`;
    }

    if (formatted !== input.value) {
      input.value = formatted;
      this.form.controls.fechaCita.setValue(formatted);
    }
  }

  openCalendarModal(): void {
    const currentVal = this.form.controls.fechaCita.value;
    const parsed = parseDdMmYyyy(currentVal);
    if (parsed && parsed.getFullYear() >= this.availableYears[0]) {
      this.calendarYear.set(parsed.getFullYear());
      this.calendarMonth.set(parsed.getMonth());
    } else {
      const now = new Date();
      this.calendarYear.set(now.getFullYear());
      this.calendarMonth.set(now.getMonth());
    }
    this.calendarModalOpen.set(true);
  }

  closeCalendarModal(): void {
    this.calendarModalOpen.set(false);
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeCalendarModal();
    }
  }

  onMonthSelect(event: Event): void {
    const val = Number((event.target as HTMLSelectElement).value);
    if (!Number.isNaN(val)) {
      this.calendarMonth.set(val);
    }
  }

  onYearSelect(event: Event): void {
    const val = Number((event.target as HTMLSelectElement).value);
    if (!Number.isNaN(val)) {
      this.calendarYear.set(val);
    }
  }

  changeCalendarMonth(delta: number): void {
    let month = this.calendarMonth() + delta;
    let year = this.calendarYear();
    if (month < 0) {
      month = 11;
      year -= 1;
    } else if (month > 11) {
      month = 0;
      year += 1;
    }
    const minYear = this.availableYears[0];
    const maxYear = this.availableYears[this.availableYears.length - 1];
    if (year >= minYear && year <= maxYear) {
      this.calendarMonth.set(month);
      this.calendarYear.set(year);
    }
  }

  isPastCalendarDay(day: number): boolean {
    const candidate = new Date(this.calendarYear(), this.calendarMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    candidate.setHours(0, 0, 0, 0);
    return candidate < today;
  }

  isSelectedDay(day: number): boolean {
    const parsed = parseDdMmYyyy(this.form.controls.fechaCita.value);
    if (!parsed) {
      return false;
    }
    return (
      parsed.getFullYear() === this.calendarYear() &&
      parsed.getMonth() === this.calendarMonth() &&
      parsed.getDate() === day
    );
  }

  selectCalendarDay(day: number): void {
    if (this.isPastCalendarDay(day)) {
      return;
    }
    const selected = new Date(this.calendarYear(), this.calendarMonth(), day);
    const formatted = formatDateToDdMmYyyy(selected);
    this.form.controls.fechaCita.setValue(formatted);
    this.form.controls.fechaCita.markAsDirty();
    this.form.controls.fechaCita.markAsTouched();
    this.closeCalendarModal();
  }

  getFechaErrorMessage(): string {
    const ctrl = this.form.controls.fechaCita;
    if (ctrl.hasError('fechaEnPasado')) {
      return 'La fecha de la cita no puede ser anterior al día de hoy.';
    }
    if (ctrl.hasError('formatoFechaInvalido') || ctrl.hasError('fechaInvalida')) {
      return 'Ingrese una fecha válida en formato dd/mm/aaaa (Ej. 20/11/2026).';
    }
    return 'La fecha de la cita es obligatoria (formato dd/mm/aaaa).';
  }

  isFechaHoraFuturaInvalid(): boolean {
    const fechaCtrl = this.form.controls.fechaCita;
    const horaCtrl = this.form.controls.horaCita;
    return (
      this.form.hasError('citaEnPasado') &&
      (fechaCtrl.touched || horaCtrl.touched || this.submitted())
    );
  }

  isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return Boolean(control && control.invalid && (control.touched || this.submitted()));
  }

  onSubmit(): void {
    this.submitted.set(true);
    this.backendError.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const combinedDate = combineDateAndTime(raw.fechaCita, raw.horaCita);
    if (!combinedDate) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const isoDate = combinedDate.toISOString();

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
      fechaCita: defaultFutureDateDdMmYyyy(),
      horaCita: '10:00',
      duracionMinutos: 30,
      motivo: '',
      notas: '',
    });
  }
}
