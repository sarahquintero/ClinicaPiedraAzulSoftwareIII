import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { BadgeComponent } from '../../shared/atoms/badge/badge.component';
import { ButtonComponent } from '../../shared/atoms/button/button.component';
import { LogoComponent } from '../../shared/atoms/logo/logo.component';
import { MedicosListComponent } from '../../shared/organisms/medicos-list/medicos-list.component';
import { MainLayoutComponent } from '../../shared/templates/main-layout/main-layout.component';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MainLayoutComponent,
    LogoComponent,
    ButtonComponent,
    BadgeComponent,
    MedicosListComponent,
  ],
  template: `
    <app-main-layout
      eyebrow="Atención Preferencial · Portal Accesible"
      pageTitle="Bienvenido a la Clínica Piedra Azul"
      pageDescription="Ingrese su correo electrónico y contraseña para consultar sus citas médicas o administrar el sistema hospitalario."
    >
      <div class="pa-login-centered">
        <section class="pa-form-card pa-login-box" aria-labelledby="login-title">
          <div class="pa-login-card__top">
            <app-logo subtitle="Ingreso Seguro" />
            <app-badge variant="primary" text="Portal Oficial" />
          </div>

          <div class="pa-form-card__header">
            <h2 id="login-title">Iniciar Sesión en su Cuenta</h2>
            <p>
              Escriba su correo electrónico y su contraseña.
            </p>
          </div>

          @if (guardNotice()) {
            <div class="pa-form-error" role="alert">
              <span class="pa-form-error__icon" aria-hidden="true">⚠️</span>
              <span>
                Para ingresar a <strong>{{ guardNotice() }}</strong> primero debe iniciar sesión.
              </span>
            </div>
          }

          @if (loginError()) {
            <div class="pa-form-error" role="alert">
              <span class="pa-form-error__icon" aria-hidden="true">⚠️</span>
              <span>{{ loginError() }}</span>
            </div>
          }

          <form [formGroup]="form" (ngSubmit)="onSubmit()" autocomplete="on" novalidate class="pa-login-form">
            <div class="pa-form-field">
              <label class="pa-form-label" for="login-email">
                Correo Electrónico <span class="pa-form-req">*</span>
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                class="pa-form-control"
                [class.pa-form-control--invalid]="isInvalid('email')"
                formControlName="email"
                placeholder="ejemplo@piedraazul.com"
                autocomplete="username"
              />
              @if (isInvalid('email')) {
                <div class="pa-form-error" role="alert">
                  <span class="pa-form-error__icon" aria-hidden="true">⚠️</span>
                  <span>Por favor ingrese un correo electrónico válido.</span>
                </div>
              }
            </div>

            <div class="pa-form-field">
              <label class="pa-form-label" for="login-password">
                Contraseña de Acceso <span class="pa-form-req">*</span>
              </label>
              <input
                id="login-password"
                name="password"
                type="password"
                class="pa-form-control"
                [class.pa-form-control--invalid]="isInvalid('password')"
                formControlName="password"
                placeholder="Escriba su contraseña"
                autocomplete="current-password"
              />
              @if (isInvalid('password')) {
                <div class="pa-form-error" role="alert">
                  <span class="pa-form-error__icon" aria-hidden="true">⚠️</span>
                  <span>La contraseña es obligatoria (mínimo 6 caracteres).</span>
                </div>
              }
            </div>

            <app-button
              [label]="loading() ? 'Verificando Credenciales...' : 'Ingresar a la Plataforma'"
              variant="primary"
              size="lg"
              type="submit"
              [fullWidth]="true"
              [disabled]="loading()"
            />
          </form>
        </section>
      </div>

      <!-- Directorio Público Real (GET /api/medicos) -->
      <app-medicos-list [adminMode]="false" />
    </app-main-layout>
  `,
  styles: [
    `
      .pa-login-centered {
        width: 100%;
        display: flex;
        justify-content: center;
      }

      .pa-login-box {
        width: 100%;
        max-width: 680px;
      }

      .pa-login-card__top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 0.85rem;
      }

      .pa-login-form {
        display: flex;
        flex-direction: column;
        gap: 1.35rem;
      }
    `,
  ],
})
export class LoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly submitted = signal(false);
  readonly loginError = signal('');

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly guardNotice = () => this.route.snapshot.queryParamMap.get('returnUrl');

  isInvalid(controlName: 'email' | 'password'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.touched || this.submitted());
  }

  onSubmit(): void {
    this.submitted.set(true);
    this.loginError.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const { email, password } = this.form.getRawValue();

    this.authService.login(email.trim(), password).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.toastService.showSuccess(`Bienvenido(a), ${res.user.nombre}.`);
        const target = res.user.role === 'Administrador' ? '/admin' : '/paciente';
        void this.router.navigate([target]);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        const msg =
          err.error?.message ||
          'Correo o contraseña incorrectos. Verifique sus datos e intente nuevamente.';
        this.loginError.set(msg);
        this.toastService.showError(msg);
      },
    });
  }
}
