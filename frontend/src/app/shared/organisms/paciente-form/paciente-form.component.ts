import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  EventEmitter,
  HostListener,
  Output,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { NEVER, Observable, catchError, concat, debounceTime, map, of, switchMap, take, tap } from 'rxjs';
import { CreatePacientePayload } from '../../../core/models/clinic.models';
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

function convertDdMmYyyyToIso(value: string): string {
  const parsed = parseDdMmYyyy(value);
  if (!parsed) {
    return value;
  }
  const day = String(parsed.getDate()).padStart(2, '0');
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const year = String(parsed.getFullYear());
  return `${year}-${month}-${day}`;
}

const fechaDdMmYyyyNoFuturaValidator: ValidatorFn = (
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

  if (parsed > today) {
    return { fechaFutura: true };
  }

  return null;
};

/**
 * Validador asíncrono reactivo para el campo `cedula`:
 * Consume GET /api/pacientes/verificar-cedula/:cedula usando debounceTime(500) y switchMap.
 * Si la cédula ya existe en la base de datos, retorna { cedulaYaRegistrada: true }.
 */
export function cedulaUnicaAsyncValidator(
  clinicApi: ClinicApiService,
  cdr: ChangeDetectorRef
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const cedula = String(control.value ?? '').trim();
    if (!cedula || cedula.length < 5) {
      return of(null);
    }

    return concat(of(cedula), NEVER).pipe(
      debounceTime(500),
      take(1),
      switchMap((valorCedula) =>
        clinicApi.verificarCedula(valorCedula).pipe(
          map((res) => (res.existe ? { cedulaYaRegistrada: true } : null)),
          catchError(() => of(null)),
          tap(() => cdr.markForCheck())
        )
      )
    );
  };
}

@Component({
  selector: 'app-paciente-form',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonComponent],
  template: `
    <section class="pa-form-card" aria-labelledby="paciente-form-title">
      <header class="pa-form-card__header">
        <h2 id="paciente-form-title">Formulario de Registro de Paciente</h2>
        <p>
          Al escribir el número de cédula, el sistema verifica automáticamente tras medio segundo si
          el documento ya está registrado en la Clínica Piedra Azul.
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
          <!-- Tipo de Documento -->
          <div class="pa-form-field">
            <label class="pa-form-label" for="tipoDocumento">
              Tipo de Documento <span class="pa-form-req">*</span>
            </label>
            <select
              id="tipoDocumento"
              name="tipoDocumento"
              autocomplete="on"
              class="pa-form-control"
              [class.pa-form-control--invalid]="isInvalid('tipoDocumento')"
              formControlName="tipoDocumento"
            >
              <option value="" disabled>-- Seleccione --</option>
              <option value="CC">Cédula de Ciudadanía (CC)</option>
              <option value="CE">Cédula de Extranjería (CE)</option>
              <option value="TI">Tarjeta de Identidad (TI)</option>
              <option value="PASAPORTE">Pasaporte</option>
            </select>
            @if (isInvalid('tipoDocumento')) {
              <div class="pa-form-error" role="alert">
                <span class="pa-form-error__icon" aria-hidden="true">⚠️</span>
                <span>Debe seleccionar el tipo de documento del paciente.</span>
              </div>
            }
          </div>

          <!-- Cédula con Validación Asíncrona Reactiva -->
          <div class="pa-form-field">
            <label class="pa-form-label" for="pacienteCedula">
              Número de Cédula / Documento <span class="pa-form-req">*</span>
            </label>
            <input
              id="pacienteCedula"
              name="cedula"
              type="text"
              autocomplete="on"
              class="pa-form-control"
              [class.pa-form-control--invalid]="isCedulaInvalid()"
              formControlName="cedula"
              placeholder="Ej. 1020304050"
            />

            @if (cedulaStatus() === 'PENDING' || form.controls.cedula.pending) {
              <div class="pa-form-pending" aria-live="polite">
                ⏳ Verificando disponibilidad de la cédula...
              </div>
            }

            @if (cedulaYaRegistrada()) {
              <div class="pa-form-error" role="alert">
                <span class="pa-form-error__icon" aria-hidden="true">⚠️</span>
                <span>Cédula ya registrada</span>
              </div>
            } @else if (isInvalid('cedula')) {
              <div class="pa-form-error" role="alert">
                <span class="pa-form-error__icon" aria-hidden="true">⚠️</span>
                <span>Ingrese un número de cédula válido (entre 5 y 20 caracteres).</span>
              </div>
            }
          </div>

          <!-- Nombres -->
          <div class="pa-form-field">
            <label class="pa-form-label" for="pacienteNombres">
              Nombres del Paciente <span class="pa-form-req">*</span>
            </label>
            <input
              id="pacienteNombres"
              name="nombres"
              type="text"
              autocomplete="given-name"
              class="pa-form-control"
              [class.pa-form-control--invalid]="isInvalid('nombres')"
              formControlName="nombres"
              placeholder="Ej. Rosa María"
            />
            @if (isInvalid('nombres')) {
              <div class="pa-form-error" role="alert">
                <span class="pa-form-error__icon" aria-hidden="true">⚠️</span>
                <span>Los nombres del paciente son obligatorios (mínimo 2 letras).</span>
              </div>
            }
          </div>

          <!-- Apellidos -->
          <div class="pa-form-field">
            <label class="pa-form-label" for="pacienteApellidos">
              Apellidos del Paciente <span class="pa-form-req">*</span>
            </label>
            <input
              id="pacienteApellidos"
              name="apellidos"
              type="text"
              autocomplete="family-name"
              class="pa-form-control"
              [class.pa-form-control--invalid]="isInvalid('apellidos')"
              formControlName="apellidos"
              placeholder="Ej. Beltrán Quintero"
            />
            @if (isInvalid('apellidos')) {
              <div class="pa-form-error" role="alert">
                <span class="pa-form-error__icon" aria-hidden="true">⚠️</span>
                <span>Los apellidos del paciente son obligatorios (mínimo 2 letras).</span>
              </div>
            }
          </div>

          <!-- Fecha de Nacimiento Manual (dd/mm/aaaa) + Botón de Calendario Modal Grande -->
          <div class="pa-form-field">
            <label class="pa-form-label" for="fechaNacimiento">
              Fecha de Nacimiento (dd/mm/aaaa) <span class="pa-form-req">*</span>
            </label>
            <div class="pa-date-input-group">
              <input
                id="fechaNacimiento"
                name="fechaNacimiento"
                type="text"
                inputmode="numeric"
                maxlength="10"
                autocomplete="bday"
                class="pa-form-control pa-date-input-group__input"
                [class.pa-form-control--invalid]="isInvalid('fechaNacimiento')"
                formControlName="fechaNacimiento"
                placeholder="dd/mm/aaaa (Ej. 14/05/1952)"
                (input)="onFechaInput($event)"
              />
              <button
                type="button"
                class="pa-calendar-trigger-btn"
                (click)="openCalendarModal()"
                aria-label="Abrir calendario grande para seleccionar fecha de nacimiento"
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
            @if (isInvalid('fechaNacimiento')) {
              <div class="pa-form-error" role="alert">
                <span class="pa-form-error__icon" aria-hidden="true">⚠️</span>
                <span>{{ getFechaErrorMessage() }}</span>
              </div>
            }
          </div>

          <!-- Género -->
          <div class="pa-form-field">
            <label class="pa-form-label" for="genero">
              Género <span class="pa-form-req">*</span>
            </label>
            <select
              id="genero"
              name="genero"
              autocomplete="sex"
              class="pa-form-control"
              [class.pa-form-control--invalid]="isInvalid('genero')"
              formControlName="genero"
            >
              <option value="" disabled>-- Seleccione --</option>
              <option value="F">Femenino (F)</option>
              <option value="M">Masculino (M)</option>
              <option value="OTRO">Otro</option>
            </select>
            @if (isInvalid('genero')) {
              <div class="pa-form-error" role="alert">
                <span class="pa-form-error__icon" aria-hidden="true">⚠️</span>
                <span>Debe seleccionar el género del paciente.</span>
              </div>
            }
          </div>

          <!-- Teléfono -->
          <div class="pa-form-field">
            <label class="pa-form-label" for="pacienteTelefono">
              Teléfono o Celular <span class="pa-form-req">*</span>
            </label>
            <input
              id="pacienteTelefono"
              name="telefono"
              type="tel"
              autocomplete="tel"
              class="pa-form-control"
              [class.pa-form-control--invalid]="isInvalid('telefono')"
              formControlName="telefono"
              placeholder="Ej. 3109876543"
            />
            @if (isInvalid('telefono')) {
              <div class="pa-form-error" role="alert">
                <span class="pa-form-error__icon" aria-hidden="true">⚠️</span>
                <span>Ingrese un número telefónico válido (mínimo 7 dígitos).</span>
              </div>
            }
          </div>

          <!-- Correo Electrónico -->
          <div class="pa-form-field">
            <label class="pa-form-label" for="pacienteEmail">
              Correo Electrónico <span class="pa-form-req">*</span>
            </label>
            <input
              id="pacienteEmail"
              name="email"
              type="email"
              autocomplete="email"
              class="pa-form-control"
              [class.pa-form-control--invalid]="isInvalid('email')"
              formControlName="email"
              placeholder="Ej. rosa.beltran@correo.com"
            />
            @if (isInvalid('email')) {
              <div class="pa-form-error" role="alert">
                <span class="pa-form-error__icon" aria-hidden="true">⚠️</span>
                <span>Ingrese un correo electrónico válido (ejemplo@dominio.com).</span>
              </div>
            }
          </div>

          <!-- Grupo Sanguíneo -->
          <div class="pa-form-field">
            <label class="pa-form-label" for="grupoSanguineo">
              Grupo Sanguíneo y RH <span class="pa-form-req">*</span>
            </label>
            <select
              id="grupoSanguineo"
              name="grupoSanguineo"
              autocomplete="on"
              class="pa-form-control"
              [class.pa-form-control--invalid]="isInvalid('grupoSanguineo')"
              formControlName="grupoSanguineo"
            >
              <option value="" disabled>-- Seleccione --</option>
              <option value="O+">O Positivo (O+)</option>
              <option value="O-">O Negativo (O-)</option>
              <option value="A+">A Positivo (A+)</option>
              <option value="A-">A Negativo (A-)</option>
              <option value="B+">B Positivo (B+)</option>
              <option value="B-">B Negativo (B-)</option>
              <option value="AB+">AB Positivo (AB+)</option>
              <option value="AB-">AB Negativo (AB-)</option>
            </select>
            @if (isInvalid('grupoSanguineo')) {
              <div class="pa-form-error" role="alert">
                <span class="pa-form-error__icon" aria-hidden="true">⚠️</span>
                <span>Debe seleccionar el grupo sanguíneo y RH del paciente.</span>
              </div>
            }
          </div>

          <!-- Dirección -->
          <div class="pa-form-field">
            <label class="pa-form-label" for="direccion">
              Dirección de Residencia
            </label>
            <input
              id="direccion"
              name="direccion"
              type="text"
              autocomplete="street-address"
              class="pa-form-control"
              formControlName="direccion"
              placeholder="Ej. Calle 85 # 14-20, Bogotá"
            />
          </div>
        </div>

        <div class="pa-form-actions">
          <app-button
            label="Limpiar Campos"
            variant="outline"
            type="button"
            (clicked)="resetForm()"
          />
          <app-button
            [label]="submitting() ? 'Registrando Paciente...' : 'Registrar Nuevo Paciente'"
            variant="primary"
            type="submit"
            [disabled]="submitting() || form.pending"
          />
        </div>
      </form>
    </section>

    <!-- Modal Grande Accesible para Selección de Fecha de Nacimiento -->
    @if (calendarModalOpen()) {
      <div
        class="pa-calendar-modal-backdrop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-modal-title"
        (click)="onBackdropClick($event)"
      >
        <div class="pa-calendar-modal">
          <header class="pa-calendar-modal__header">
            <div>
              <h3 id="calendar-modal-title">Seleccionar Fecha de Nacimiento</h3>
              <p>Elija el año, el mes y el día en el calendario</p>
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
                  [disabled]="isFutureCalendarDay(cell)"
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
export class PacienteFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly clinicApi = inject(ClinicApiService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  @Output() pacienteCreated = new EventEmitter<void>();

  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly backendError = signal('');
  readonly cedulaYaRegistrada = signal(false);

  // Estado del Modal de Calendario Grande
  readonly calendarModalOpen = signal(false);
  readonly calendarMonth = signal(new Date().getMonth());
  readonly calendarYear = signal(1960);

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
    { length: new Date().getFullYear() - 1900 + 1 },
    (_, i) => new Date().getFullYear() - i
  );

  readonly calendarDays = computed<(number | null)[]>(() => {
    const year = this.calendarYear();
    const month = this.calendarMonth();
    const firstDayJs = new Date(year, month, 1).getDay(); // 0=Dom..6=Sab
    const offsetMonday = (firstDayJs + 6) % 7; // 0=Lun..6=Dom
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: (number | null)[] = Array.from({ length: offsetMonday }, () => null);
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(d);
    }
    return cells;
  });

  readonly form = this.fb.nonNullable.group({
    tipoDocumento: ['' as CreatePacientePayload['tipoDocumento'] | '', [Validators.required]],
    cedula: [
      '',
      {
        validators: [Validators.required, Validators.pattern(/^[0-9A-Za-z-]{5,20}$/)],
        asyncValidators: [cedulaUnicaAsyncValidator(this.clinicApi, this.cdr)],
      },
    ],
    nombres: ['', [Validators.required, Validators.minLength(2)]],
    apellidos: ['', [Validators.required, Validators.minLength(2)]],
    fechaNacimiento: ['', [Validators.required, fechaDdMmYyyyNoFuturaValidator]],
    genero: ['' as CreatePacientePayload['genero'] | '', [Validators.required]],
    telefono: ['', [Validators.required, Validators.minLength(7), Validators.maxLength(20)]],
    email: ['', [Validators.required, Validators.email]],
    grupoSanguineo: ['', [Validators.required]],
    direccion: [''],
  });

  readonly cedulaStatus = toSignal(this.form.controls.cedula.statusChanges, {
    initialValue: 'INVALID',
  });

  constructor() {
    this.form.controls.cedula.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.cedulaYaRegistrada.set(
          this.form.controls.cedula.hasError('cedulaYaRegistrada')
        );
        this.cdr.markForCheck();
      });

    this.form.controls.cedula.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (!this.form.controls.cedula.hasError('cedulaYaRegistrada')) {
          this.cedulaYaRegistrada.set(false);
        }
      });
  }

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
      this.form.controls.fechaNacimiento.setValue(formatted);
    }
  }

  openCalendarModal(): void {
    const currentVal = this.form.controls.fechaNacimiento.value;
    const parsed = parseDdMmYyyy(currentVal);
    if (parsed) {
      this.calendarYear.set(parsed.getFullYear());
      this.calendarMonth.set(parsed.getMonth());
    } else {
      this.calendarYear.set(1960);
      this.calendarMonth.set(0);
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
    const maxYear = new Date().getFullYear();
    if (year >= 1900 && year <= maxYear) {
      this.calendarMonth.set(month);
      this.calendarYear.set(year);
    }
  }

  isFutureCalendarDay(day: number): boolean {
    const candidate = new Date(this.calendarYear(), this.calendarMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    candidate.setHours(0, 0, 0, 0);
    return candidate > today;
  }

  isSelectedDay(day: number): boolean {
    const parsed = parseDdMmYyyy(this.form.controls.fechaNacimiento.value);
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
    if (this.isFutureCalendarDay(day)) {
      return;
    }
    const selected = new Date(this.calendarYear(), this.calendarMonth(), day);
    const formatted = formatDateToDdMmYyyy(selected);
    this.form.controls.fechaNacimiento.setValue(formatted);
    this.form.controls.fechaNacimiento.markAsDirty();
    this.form.controls.fechaNacimiento.markAsTouched();
    this.closeCalendarModal();
  }

  getFechaErrorMessage(): string {
    const ctrl = this.form.controls.fechaNacimiento;
    if (ctrl.hasError('fechaFutura')) {
      return 'La fecha de nacimiento no puede ser una fecha futura.';
    }
    if (ctrl.hasError('formatoFechaInvalido') || ctrl.hasError('fechaInvalida')) {
      return 'Ingrese una fecha válida en formato dd/mm/aaaa (Ej. 14/05/1952).';
    }
    return 'La fecha de nacimiento es obligatoria (formato dd/mm/aaaa).';
  }

  isCedulaInvalid(): boolean {
    const c = this.form.controls.cedula;
    return this.cedulaYaRegistrada() || (c.invalid && (c.touched || this.submitted()));
  }

  isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return Boolean(control && control.invalid && (control.touched || this.submitted()));
  }

  onSubmit(): void {
    this.submitted.set(true);
    this.backendError.set('');

    if (this.form.invalid || this.form.pending) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    const raw = this.form.getRawValue();
    const payload: CreatePacientePayload = {
      tipoDocumento: raw.tipoDocumento as CreatePacientePayload['tipoDocumento'],
      cedula: raw.cedula.trim(),
      nombres: raw.nombres.trim(),
      apellidos: raw.apellidos.trim(),
      fechaNacimiento: convertDdMmYyyyToIso(raw.fechaNacimiento),
      genero: raw.genero as CreatePacientePayload['genero'],
      telefono: raw.telefono.trim(),
      email: raw.email.trim(),
      grupoSanguineo: raw.grupoSanguineo || undefined,
      direccion: raw.direccion.trim() || undefined,
    };

    this.clinicApi.createPaciente(payload).subscribe({
      next: (res) => {
        this.submitting.set(false);
        this.toastService.showSuccess(
          res.message || 'Paciente registrado exitosamente en la clínica.'
        );
        this.resetForm();
        this.pacienteCreated.emit();
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        const msg =
          err.error?.message || 'Error al registrar el paciente. Revise los campos ingresados.';
        this.backendError.set(msg);
        this.toastService.showError(msg);
      },
    });
  }

  resetForm(): void {
    this.submitted.set(false);
    this.backendError.set('');
    this.cedulaYaRegistrada.set(false);
    this.form.reset({
      tipoDocumento: '',
      cedula: '',
      nombres: '',
      apellidos: '',
      fechaNacimiento: '',
      genero: '',
      telefono: '',
      email: '',
      grupoSanguineo: '',
      direccion: '',
    });
  }
}
