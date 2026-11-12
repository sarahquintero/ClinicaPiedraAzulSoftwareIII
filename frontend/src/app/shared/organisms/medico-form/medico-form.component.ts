import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, DestroyRef, EventEmitter, Output, inject, signal } from '@angular/core';
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
import { ClinicApiService } from '../../../core/services/clinic-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { ButtonComponent } from '../../atoms/button/button.component';

const horarioLaboralValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const inicio = group.get('horaInicio')?.value as string | undefined;
  const fin = group.get('horaFin')?.value as string | undefined;
  if (inicio && fin && inicio >= fin) {
    return { rangoHorarioInvalido: true };
  }
  return null;
};

/**
 * Validador asíncrono reactivo para el campo `tarjetaProfesional`:
 * Consume GET /api/medicos/verificar-tarjeta/:tarjeta usando debounceTime(500) y switchMap.
 * Si la tarjeta ya está registrada (existe === true o disponible === false), retorna { tarjetaEnUso: true, tarjetaYaRegistrada: true }.
 */
export function tarjetaUnicaAsyncValidator(
  clinicApi: ClinicApiService,
  cdr: ChangeDetectorRef
): AsyncValidatorFn {
  return (control: AbstractControl): Observable<ValidationErrors | null> => {
    const tarjeta = String(control.value ?? '').trim();
    if (!tarjeta || tarjeta.length < 4) {
      return of(null);
    }

    return concat(of(tarjeta), NEVER).pipe(
      debounceTime(500),
      take(1),
      switchMap((valorTarjeta) =>
        clinicApi.verificarTarjeta(valorTarjeta).pipe(
          map((res) =>
            res.existe === true || res.disponible === false
              ? { tarjetaEnUso: true, tarjetaYaRegistrada: true }
              : null
          ),
          catchError(() => of(null)),
          tap(() => cdr.markForCheck())
        )
      )
    );
  };
}

@Component({
  selector: 'app-medico-form',
  standalone: true,
  imports: [ReactiveFormsModule, ButtonComponent],
  template: `
    <section class="pa-form-card" aria-labelledby="medico-form-title">
      <header class="pa-form-card__header">
        <h2 id="medico-form-title">Formulario de Registro de Médico Especialista</h2>
        <p>
          Complete todos los campos obligatorios (<span class="pa-form-req">*</span>) con letra
          clara para incorporar un nuevo médico a la Clínica Piedra Azul.
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
          <!-- Cédula -->
          <div class="pa-form-field">
            <label class="pa-form-label" for="medicoCedula">
              Número de Cédula del Médico <span class="pa-form-req">*</span>
            </label>
            <input
              id="medicoCedula"
              name="cedula"
              type="text"
              autocomplete="on"
              class="pa-form-control"
              [class.pa-form-control--invalid]="isInvalid('cedula')"
              formControlName="cedula"
              placeholder="Ej. 1045901234"
            />
            @if (isInvalid('cedula')) {
              <div class="pa-form-error" role="alert">
                <span class="pa-form-error__icon" aria-hidden="true">⚠️</span>
                <span>Ingrese una cédula válida (entre 5 y 20 caracteres alfanuméricos).</span>
              </div>
            }
          </div>

          <!-- Tarjeta Profesional con Validación Asíncrona Reactiva -->
          <div class="pa-form-field">
            <label class="pa-form-label" for="tarjetaProfesional">
              Tarjeta Profesional <span class="pa-form-req">*</span>
            </label>
            <input
              id="tarjetaProfesional"
              name="tarjetaProfesional"
              type="text"
              autocomplete="on"
              class="pa-form-control"
              [class.pa-form-control--invalid]="isTarjetaInvalid()"
              formControlName="tarjetaProfesional"
              placeholder="Ej. TP-77881-COL"
            />
            @if (tarjetaStatus() === 'PENDING' || form.controls.tarjetaProfesional.pending) {
              <div class="pa-form-pending" aria-live="polite">
                ⏳ Verificando disponibilidad de la tarjeta profesional...
              </div>
            }
            @if (
              form.controls.tarjetaProfesional.errors?.['tarjetaEnUso'] ||
              form.controls.tarjetaProfesional.errors?.['tarjetaYaRegistrada'] ||
              tarjetaYaRegistrada()
            ) {
              <div class="pa-form-error" role="alert">
                <span class="pa-form-error__icon" aria-hidden="true">⚠️</span>
                <span>Esta tarjeta profesional ya se encuentra registrada</span>
              </div>
            } @else if (isInvalid('tarjetaProfesional')) {
              <div class="pa-form-error" role="alert">
                <span class="pa-form-error__icon" aria-hidden="true">⚠️</span>
                <span>La tarjeta profesional es obligatoria (mínimo 4 caracteres).</span>
              </div>
            }
          </div>

          <!-- Nombres -->
          <div class="pa-form-field">
            <label class="pa-form-label" for="medicoNombres">
              Nombres Completos <span class="pa-form-req">*</span>
            </label>
            <input
              id="medicoNombres"
              name="nombres"
              type="text"
              autocomplete="given-name"
              class="pa-form-control"
              [class.pa-form-control--invalid]="isInvalid('nombres')"
              formControlName="nombres"
              placeholder="Ej. Santiago Alberto"
            />
            @if (isInvalid('nombres')) {
              <div class="pa-form-error" role="alert">
                <span class="pa-form-error__icon" aria-hidden="true">⚠️</span>
                <span>Ingrese los nombres del médico (mínimo 2 caracteres).</span>
              </div>
            }
          </div>

          <!-- Apellidos -->
          <div class="pa-form-field">
            <label class="pa-form-label" for="medicoApellidos">
              Apellidos Completos <span class="pa-form-req">*</span>
            </label>
            <input
              id="medicoApellidos"
              name="apellidos"
              type="text"
              autocomplete="family-name"
              class="pa-form-control"
              [class.pa-form-control--invalid]="isInvalid('apellidos')"
              formControlName="apellidos"
              placeholder="Ej. Mejía Restrepo"
            />
            @if (isInvalid('apellidos')) {
              <div class="pa-form-error" role="alert">
                <span class="pa-form-error__icon" aria-hidden="true">⚠️</span>
                <span>Ingrese los apellidos del médico (mínimo 2 caracteres).</span>
              </div>
            }
          </div>

          <!-- Especialidad -->
          <div class="pa-form-field">
            <label class="pa-form-label" for="especialidad">
              Especialidad Médica <span class="pa-form-req">*</span>
            </label>
            <input
              id="especialidad"
              name="especialidad"
              type="text"
              autocomplete="on"
              list="pa-especialidades-list"
              class="pa-form-control"
              [class.pa-form-control--invalid]="isInvalid('especialidad')"
              formControlName="especialidad"
              placeholder="Seleccione o escriba: Ej. Geriatría, Cardiología"
            />
            <datalist id="pa-especialidades-list">
              <option value="Cardiología"></option>
              <option value="Geriatría"></option>
              <option value="Medicina Interna"></option>
              <option value="Pediatría"></option>
              <option value="Dermatología"></option>
              <option value="Ortopedia"></option>
              <option value="Oftalmología"></option>
            </datalist>
            @if (isInvalid('especialidad')) {
              <div class="pa-form-error" role="alert">
                <span class="pa-form-error__icon" aria-hidden="true">⚠️</span>
                <span>Indique la especialidad médica (mínimo 3 caracteres).</span>
              </div>
            }
          </div>

          <!-- Consultorio -->
          <div class="pa-form-field">
            <label class="pa-form-label" for="consultorio">
              Consultorio Asignado <span class="pa-form-req">*</span>
            </label>
            <input
              id="consultorio"
              name="consultorio"
              type="text"
              autocomplete="on"
              class="pa-form-control"
              [class.pa-form-control--invalid]="isInvalid('consultorio')"
              formControlName="consultorio"
              placeholder="Ej. Consultorio 110 - Primer Piso"
            />
            @if (isInvalid('consultorio')) {
              <div class="pa-form-error" role="alert">
                <span class="pa-form-error__icon" aria-hidden="true">⚠️</span>
                <span>El número o ubicación del consultorio es obligatorio.</span>
              </div>
            }
          </div>

          <!-- Correo Electrónico -->
          <div class="pa-form-field">
            <label class="pa-form-label" for="medicoEmail">
              Correo Institucional <span class="pa-form-req">*</span>
            </label>
            <input
              id="medicoEmail"
              name="email"
              type="email"
              autocomplete="email"
              class="pa-form-control"
              [class.pa-form-control--invalid]="isInvalid('email')"
              formControlName="email"
              placeholder="Ej. s.mejia@piedraazul.com"
            />
            @if (isInvalid('email')) {
              <div class="pa-form-error" role="alert">
                <span class="pa-form-error__icon" aria-hidden="true">⚠️</span>
                <span>Ingrese un correo electrónico institucional válido.</span>
              </div>
            }
          </div>

          <!-- Teléfono -->
          <div class="pa-form-field">
            <label class="pa-form-label" for="medicoTelefono">
              Teléfono de Contacto <span class="pa-form-req">*</span>
            </label>
            <input
              id="medicoTelefono"
              name="telefono"
              type="tel"
              autocomplete="tel"
              class="pa-form-control"
              [class.pa-form-control--invalid]="isInvalid('telefono')"
              formControlName="telefono"
              placeholder="Ej. 3123456789"
            />
            @if (isInvalid('telefono')) {
              <div class="pa-form-error" role="alert">
                <span class="pa-form-error__icon" aria-hidden="true">⚠️</span>
                <span>Ingrese un teléfono válido (mínimo 7 dígitos).</span>
              </div>
            }
          </div>

          <!-- Días de Atención -->
          <div class="pa-form-field">
            <label class="pa-form-label" for="diasAtencion">
              Días de Atención <span class="pa-form-req">*</span>
            </label>
            <select
              id="diasAtencion"
              name="diasAtencion"
              class="pa-form-control"
              formControlName="diasAtencion"
            >
              <option value="LUN,MAR,MIE,JUE,VIE">Lunes a Viernes (LUN,MAR,MIE,JUE,VIE)</option>
              <option value="LUN,MIE,VIE">Lunes, Miércoles y Viernes (LUN,MIE,VIE)</option>
              <option value="MAR,JUE,SAB">Martes, Jueves y Sábado (MAR,JUE,SAB)</option>
            </select>
          </div>

          <!-- Franja Horaria -->
          <div class="pa-form-field">
            <label class="pa-form-label" for="horaInicio">
              Horario de Consulta (Inicio y Fin) <span class="pa-form-req">*</span>
            </label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
              <input
                id="horaInicio"
                name="horaInicio"
                type="time"
                class="pa-form-control"
                formControlName="horaInicio"
                aria-label="Hora de inicio"
              />
              <input
                id="horaFin"
                name="horaFin"
                type="time"
                class="pa-form-control"
                formControlName="horaFin"
                aria-label="Hora de finalización"
              />
            </div>
            @if (form.hasError('rangoHorarioInvalido') && (form.get('horaFin')?.touched || submitted())) {
              <div class="pa-form-error" role="alert">
                <span class="pa-form-error__icon" aria-hidden="true">⚠️</span>
                <span>La hora de inicio debe ser anterior a la hora de finalización.</span>
              </div>
            }
          </div>
        </div>

        <div class="pa-form-actions">
          <app-button
            label="Limpiar Formulario"
            variant="outline"
            type="button"
            (clicked)="resetForm()"
          />
          <app-button
            [label]="submitting() ? 'Guardando Médico...' : 'Guardar Nuevo Médico'"
            variant="secondary"
            type="submit"
            [disabled]="submitting() || form.pending"
          />
        </div>
      </form>
    </section>
  `,
})
export class MedicoFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly clinicApi = inject(ClinicApiService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  @Output() medicoCreated = new EventEmitter<void>();

  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly backendError = signal('');
  readonly tarjetaYaRegistrada = signal(false);

  readonly form = this.fb.nonNullable.group(
    {
      cedula: ['', [Validators.required, Validators.pattern(/^[0-9A-Za-z-]{5,20}$/)]],
      tarjetaProfesional: [
        '',
        {
          validators: [Validators.required, Validators.minLength(4)],
          asyncValidators: [tarjetaUnicaAsyncValidator(this.clinicApi, this.cdr)],
        },
      ],
      nombres: ['', [Validators.required, Validators.minLength(2)]],
      apellidos: ['', [Validators.required, Validators.minLength(2)]],
      especialidad: ['', [Validators.required, Validators.minLength(3)]],
      consultorio: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.required, Validators.minLength(7), Validators.maxLength(20)]],
      diasAtencion: ['LUN,MAR,MIE,JUE,VIE', [Validators.required]],
      horaInicio: ['08:00', [Validators.required]],
      horaFin: ['16:00', [Validators.required]],
    },
    { validators: [horarioLaboralValidator] }
  );

  readonly tarjetaStatus = toSignal(this.form.controls.tarjetaProfesional.statusChanges, {
    initialValue: 'INVALID',
  });

  constructor() {
    this.form.controls.tarjetaProfesional.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const c = this.form.controls.tarjetaProfesional;
        this.tarjetaYaRegistrada.set(
          c.hasError('tarjetaEnUso') || c.hasError('tarjetaYaRegistrada')
        );
        this.cdr.markForCheck();
      });

    this.form.controls.tarjetaProfesional.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const c = this.form.controls.tarjetaProfesional;
        if (!c.hasError('tarjetaEnUso') && !c.hasError('tarjetaYaRegistrada')) {
          this.tarjetaYaRegistrada.set(false);
        }
      });
  }

  isTarjetaInvalid(): boolean {
    const c = this.form.controls.tarjetaProfesional;
    return (
      Boolean(c.errors?.['tarjetaEnUso']) ||
      Boolean(c.errors?.['tarjetaYaRegistrada']) ||
      this.tarjetaYaRegistrada() ||
      (c.invalid && (c.touched || this.submitted()))
    );
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
    this.clinicApi.createMedico(this.form.getRawValue()).subscribe({
      next: (res) => {
        this.submitting.set(false);
        this.toastService.showSuccess(
          res.message || 'Médico especialista registrado exitosamente.'
        );
        this.resetForm();
        this.medicoCreated.emit();
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        const msg =
          err.error?.message || 'No fue posible registrar el médico. Verifique los datos.';
        this.backendError.set(msg);
        this.toastService.showError(msg);
      },
    });
  }

  resetForm(): void {
    this.submitted.set(false);
    this.backendError.set('');
    this.tarjetaYaRegistrada.set(false);
    this.form.reset({
      cedula: '',
      tarjetaProfesional: '',
      nombres: '',
      apellidos: '',
      especialidad: '',
      consultorio: '',
      email: '',
      telefono: '',
      diasAtencion: 'LUN,MAR,MIE,JUE,VIE',
      horaInicio: '08:00',
      horaFin: '16:00',
    });
  }
}
