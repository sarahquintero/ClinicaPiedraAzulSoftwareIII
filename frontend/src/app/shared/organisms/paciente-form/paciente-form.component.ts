import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
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

const fechaNoFuturaValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const val = control.value as string;
  if (!val) {
    return null;
  }
  const parsed = new Date(val);
  if (Number.isNaN(parsed.getTime()) || parsed > new Date()) {
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

      <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate>
        <div class="pa-form-grid">
          <!-- Tipo de Documento -->
          <div class="pa-form-field">
            <label class="pa-form-label" for="pac-tipo-doc">
              Tipo de Documento <span class="pa-form-req">*</span>
            </label>
            <select
              id="pac-tipo-doc"
              class="pa-form-control"
              formControlName="tipoDocumento"
            >
              <option value="CC">Cédula de Ciudadanía (CC)</option>
              <option value="CE">Cédula de Extranjería (CE)</option>
              <option value="TI">Tarjeta de Identidad (TI)</option>
              <option value="PASAPORTE">Pasaporte</option>
            </select>
          </div>

          <!-- Cédula con Validación Asíncrona Reactiva -->
          <div class="pa-form-field">
            <label class="pa-form-label" for="pac-cedula">
              Número de Cédula / Documento <span class="pa-form-req">*</span>
            </label>
            <input
              id="pac-cedula"
              type="text"
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

            @if (form.controls.cedula.hasError('cedulaYaRegistrada')) {
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
            <label class="pa-form-label" for="pac-nombres">
              Nombres del Paciente <span class="pa-form-req">*</span>
            </label>
            <input
              id="pac-nombres"
              type="text"
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
            <label class="pa-form-label" for="pac-apellidos">
              Apellidos del Paciente <span class="pa-form-req">*</span>
            </label>
            <input
              id="pac-apellidos"
              type="text"
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

          <!-- Fecha de Nacimiento -->
          <div class="pa-form-field">
            <label class="pa-form-label" for="pac-nacimiento">
              Fecha de Nacimiento <span class="pa-form-req">*</span>
            </label>
            <input
              id="pac-nacimiento"
              type="date"
              class="pa-form-control"
              [class.pa-form-control--invalid]="isInvalid('fechaNacimiento')"
              formControlName="fechaNacimiento"
            />
            @if (isInvalid('fechaNacimiento')) {
              <div class="pa-form-error" role="alert">
                <span class="pa-form-error__icon" aria-hidden="true">⚠️</span>
                <span>Seleccione una fecha de nacimiento válida (no puede ser futura).</span>
              </div>
            }
          </div>

          <!-- Género -->
          <div class="pa-form-field">
            <label class="pa-form-label" for="pac-genero">
              Género <span class="pa-form-req">*</span>
            </label>
            <select
              id="pac-genero"
              class="pa-form-control"
              formControlName="genero"
            >
              <option value="F">Femenino (F)</option>
              <option value="M">Masculino (M)</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>

          <!-- Teléfono -->
          <div class="pa-form-field">
            <label class="pa-form-label" for="pac-telefono">
              Teléfono o Celular <span class="pa-form-req">*</span>
            </label>
            <input
              id="pac-telefono"
              type="tel"
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
            <label class="pa-form-label" for="pac-email">
              Correo Electrónico <span class="pa-form-req">*</span>
            </label>
            <input
              id="pac-email"
              type="email"
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
            <label class="pa-form-label" for="pac-rh">
              Grupo Sanguíneo y RH
            </label>
            <select
              id="pac-rh"
              class="pa-form-control"
              formControlName="grupoSanguineo"
            >
              <option value="O+">O Positivo (O+)</option>
              <option value="O-">O Negativo (O-)</option>
              <option value="A+">A Positivo (A+)</option>
              <option value="A-">A Negativo (A-)</option>
              <option value="B+">B Positivo (B+)</option>
              <option value="B-">B Negativo (B-)</option>
              <option value="AB+">AB Positivo (AB+)</option>
              <option value="AB-">AB Negativo (AB-)</option>
            </select>
          </div>

          <!-- Dirección -->
          <div class="pa-form-field">
            <label class="pa-form-label" for="pac-direccion">
              Dirección de Residencia
            </label>
            <input
              id="pac-direccion"
              type="text"
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
  `,
})
export class PacienteFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly clinicApi = inject(ClinicApiService);
  private readonly toastService = inject(ToastService);
  private readonly cdr = inject(ChangeDetectorRef);

  @Output() pacienteCreated = new EventEmitter<void>();

  readonly submitting = signal(false);
  readonly submitted = signal(false);
  readonly backendError = signal('');

  readonly form = this.fb.nonNullable.group({
    tipoDocumento: ['CC' as CreatePacientePayload['tipoDocumento'], [Validators.required]],
    cedula: [
      '',
      {
        validators: [Validators.required, Validators.pattern(/^[0-9A-Za-z-]{5,20}$/)],
        asyncValidators: [cedulaUnicaAsyncValidator(this.clinicApi, this.cdr)],
      },
    ],
    nombres: ['', [Validators.required, Validators.minLength(2)]],
    apellidos: ['', [Validators.required, Validators.minLength(2)]],
    fechaNacimiento: ['1952-05-14', [Validators.required, fechaNoFuturaValidator]],
    genero: ['F' as CreatePacientePayload['genero'], [Validators.required]],
    telefono: ['', [Validators.required, Validators.minLength(7), Validators.maxLength(20)]],
    email: ['', [Validators.required, Validators.email]],
    grupoSanguineo: ['O+'],
    direccion: [''],
  });

  readonly cedulaStatus = toSignal(this.form.controls.cedula.statusChanges, {
    initialValue: 'INVALID',
  });

  isCedulaInvalid(): boolean {
    const c = this.form.controls.cedula;
    return c.hasError('cedulaYaRegistrada') || (c.invalid && (c.touched || this.submitted()));
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
      tipoDocumento: raw.tipoDocumento,
      cedula: raw.cedula.trim(),
      nombres: raw.nombres.trim(),
      apellidos: raw.apellidos.trim(),
      fechaNacimiento: raw.fechaNacimiento,
      genero: raw.genero,
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
    this.form.reset({
      tipoDocumento: 'CC',
      cedula: '',
      nombres: '',
      apellidos: '',
      fechaNacimiento: '1952-05-14',
      genero: 'F',
      telefono: '',
      email: '',
      grupoSanguineo: 'O+',
      direccion: '',
    });
  }
}
