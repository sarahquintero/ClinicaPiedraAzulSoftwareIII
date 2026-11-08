import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { AdminDashboardPageComponent } from './pages/admin-dashboard/admin-dashboard-page.component';
import { LoginPageComponent } from './pages/login/login-page.component';
import { NotFoundPageComponent } from './pages/not-found/not-found-page.component';
import { PacienteDashboardPageComponent } from './pages/paciente-dashboard/paciente-dashboard-page.component';
import { UnauthorizedPageComponent } from './pages/unauthorized/unauthorized-page.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: LoginPageComponent,
    title: 'Iniciar Sesión — Clínica Piedra Azul',
  },
  {
    path: 'admin',
    component: AdminDashboardPageComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Administrador'], section: 'all' },
    title: 'Panel Administrador — Clínica Piedra Azul',
  },
  {
    path: 'admin/medicos',
    component: AdminDashboardPageComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Administrador'], section: 'medicos' },
    title: 'Gestión de Médicos — Clínica Piedra Azul',
  },
  {
    path: 'admin/pacientes',
    component: AdminDashboardPageComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Administrador'], section: 'pacientes' },
    title: 'Gestión de Pacientes — Clínica Piedra Azul',
  },
  {
    path: 'admin/citas',
    component: AdminDashboardPageComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Administrador'], section: 'citas' },
    title: 'Gestión de Citas — Clínica Piedra Azul',
  },
  {
    path: 'paciente',
    component: PacienteDashboardPageComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['Paciente'] },
    title: 'Portal del Paciente — Clínica Piedra Azul',
  },
  {
    path: 'unauthorized',
    component: UnauthorizedPageComponent,
    title: 'Acceso No Autorizado (403) — Clínica Piedra Azul',
  },
  {
    path: '**',
    component: NotFoundPageComponent,
    title: 'Página No Encontrada (404) — Clínica Piedra Azul',
  },
];
