import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { BadgeComponent } from '../../atoms/badge/badge.component';
import { ButtonComponent } from '../../atoms/button/button.component';
import { LogoComponent } from '../../atoms/logo/logo.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LogoComponent, BadgeComponent, ButtonComponent],
  template: `
    <header class="pa-header">
      <div class="pa-header__topbar">
        <div class="pa-header__topbar-inner">
          @if (authService.user(); as user) {
            <span class="pa-header__user-name">{{ user.nombre }}</span>
            <app-badge
              [variant]="user.role === 'Administrador' ? 'primary' : 'success'"
              [text]="'Rol: ' + user.role"
            />
          } @else {
            <app-badge variant="neutral" text="Acceso Público" />
          }
        </div>
      </div>

      <div class="pa-header__container">
        <a routerLink="/" class="pa-header__brand">
          <app-logo subtitle="Portal de Atención Senior" />
        </a>

        <button
          type="button"
          class="pa-header__burger"
          (click)="toggleMobileMenu()"
          aria-label="Abrir o cerrar menú de navegación"
        >
          ☰ Menú
        </button>

        <nav class="pa-header__nav" [class.pa-header__nav--open]="mobileMenuOpen()">
          <!-- Enlaces del rol + botón de salir, juntos en la esquina derecha -->
          <div class="pa-header__actions">
            @if (authService.isAuthenticated()) {
              @if (authService.currentRole() === 'Administrador') {
                <a
                  routerLink="/admin"
                  routerLinkActive="pa-header__link--active"
                  [routerLinkActiveOptions]="{ exact: true }"
                  class="pa-header__link"
                  (click)="closeMobileMenu()"
                >
                  Panel General
                </a>
                <a
                  routerLink="/admin/medicos"
                  routerLinkActive="pa-header__link--active"
                  class="pa-header__link"
                  (click)="closeMobileMenu()"
                >
                  Médicos
                </a>
                <a
                  routerLink="/admin/pacientes"
                  routerLinkActive="pa-header__link--active"
                  class="pa-header__link"
                  (click)="closeMobileMenu()"
                >
                  Pacientes
                </a>
                <a
                  routerLink="/admin/citas"
                  routerLinkActive="pa-header__link--active"
                  class="pa-header__link"
                  (click)="closeMobileMenu()"
                >
                  Citas Médicas
                </a>
              }

              @if (authService.currentRole() === 'Paciente') {
                <a
                  routerLink="/paciente"
                  routerLinkActive="pa-header__link--active"
                  class="pa-header__link"
                  (click)="closeMobileMenu()"
                >
                  Mis Citas Médicas
                </a>
                <!--
                  <a
                    routerLink="/admin/medicos"
                    class="pa-header__link pa-header__link--guard-demo"
                    (click)="closeMobileMenu()"
                  >
                    Verificar Bloqueo Admin (/admin/medicos)
                  </a>
                -->
              }
            } @else {
              <a
                routerLink="/login"
                routerLinkActive="pa-header__link--active"
                class="pa-header__link"
                (click)="closeMobileMenu()"
              >
                Iniciar Sesión
              </a>
            }

            @if (authService.user()) {
              <app-button
                label="Salir de la Cuenta"
                variant="outline"
                size="sm"
                (clicked)="onLogout()"
              />
            }
          </div>
        </nav>
      </div>
    </header>
  `,
  styles: [
    `
      .pa-header {
        position: sticky;
        top: 0;
        z-index: 100;
        background-color: var(--pa-white);
        border-bottom: 2px solid var(--pa-border);
        box-shadow: var(--pa-shadow-sm);
      }

      .pa-header__container {
        max-width: 1360px;
        margin: 0 auto;
        padding: 1rem 1.5rem;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1.25rem;
      }

      .pa-header__brand {
        text-decoration: none;
      }

      .pa-header__nav {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 1.25rem;
        flex-wrap: wrap;
        margin-left: auto;
      }

      /* Enlaces del rol + botón "Salir de la Cuenta", alineados juntos a la derecha */
      .pa-header__actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.65rem;
        flex-wrap: wrap;
      }

      /* Todos los enlaces de navegación cumplen área táctil >= 48px */
      .pa-header__link {
        display: inline-flex;
        align-items: center;
        min-height: 48px;
        padding: 0.65rem 1.1rem;
        border-radius: var(--pa-radius-sm);
        font-size: 1.05rem;
        font-weight: 700;
        text-decoration: none;
        color: var(--pa-text-main);
        border: 2px solid transparent;
        transition:
          background-color var(--pa-transition),
          border-color var(--pa-transition);

        &:hover {
          background-color: var(--pa-blue-50);
          border-color: var(--pa-blue-200);
          color: var(--pa-blue-900);
        }
      }

      .pa-header__link--active {
        background-color: var(--pa-blue-100);
        border-color: var(--pa-blue-600);
        color: var(--pa-blue-900);
      }

      /* Barra de sesión superior: nombre y rol en una sola línea, a la derecha */
      .pa-header__topbar {
        background-color: var(--pa-blue-50);
        border-bottom: 1px solid var(--pa-border);
      }

      .pa-header__topbar-inner {
        max-width: 1360px;
        margin: 0 auto;
        padding: 0.4rem 1.5rem;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.75rem;
        flex-wrap: wrap;
      }

      .pa-header__user-name {
        font-size: 0.98rem;
        font-weight: 800;
        color: var(--pa-blue-900);
      }

      .pa-header__burger {
        display: none;
        align-items: center;
        justify-content: center;
        min-height: 50px;
        min-width: 110px;
        padding: 0.6rem 1rem;
        border-radius: var(--pa-radius-sm);
        border: 2px solid var(--pa-blue-700);
        background: var(--pa-white);
        color: var(--pa-blue-900);
        font-size: 1.05rem;
        font-weight: 800;
        cursor: pointer;
      }

      @media (max-width: 1020px) {
        .pa-header__burger {
          display: inline-flex;
        }

        .pa-header__nav {
          display: none;
          width: 100%;
          flex-direction: column;
          align-items: stretch;
          padding-top: 1rem;
          border-top: 2px solid var(--pa-border);
        }

        .pa-header__nav--open {
          display: flex;
        }

        .pa-header__container {
          flex-wrap: wrap;
        }

        .pa-header__actions {
          flex-direction: column;
          align-items: stretch;
        }
      }
    `,
  ],
})
export class HeaderComponent {
  readonly authService = inject(AuthService);
  readonly mobileMenuOpen = signal(false);

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  onLogout(): void {
    this.closeMobileMenu();
    this.authService.logout();
  }
}