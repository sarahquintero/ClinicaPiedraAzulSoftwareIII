import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { LoginResponse, SessionUser, UserRole } from '../models/clinic.models';

const TOKEN_STORAGE_KEY = 'pa_jwt_token';
const API_BASE_URL = 'http://localhost:3000/api';

interface DecodedJwtPayload {
  sub?: string;
  id?: string;
  nombre?: string;
  email?: string;
  role?: UserRole;
  pacienteId?: string | null;
  exp?: number;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly tokenSignal = signal<string | null>(this.readStoredToken());
  private readonly pendingLoginTransition = signal<boolean>(false);

  readonly user = computed<SessionUser | null>(() => {
    const token = this.tokenSignal();
    if (!token) {
      return null;
    }
    return this.parseUserFromToken(token);
  });

  readonly isAuthenticated = computed<boolean>(() => this.user() !== null);
  readonly currentRole = computed<UserRole | null>(() => this.user()?.role ?? null);

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${API_BASE_URL}/auth/login`, { email, password })
      .pipe(
        tap((response) => {
          if (response.token) {
            this.setSessionFromToken(response.token);
            this.pendingLoginTransition.set(true);
          }
        })
      );
  }

  consumeLoginTransition(): boolean {
    if (this.pendingLoginTransition()) {
      this.pendingLoginTransition.set(false);
      return true;
    }
    return false;
  }

  getToken(): string | null {
    const token = this.tokenSignal();
    if (!token) {
      return null;
    }
    const parsed = this.parseUserFromToken(token);
    if (!parsed) {
      this.clearSession();
      return null;
    }
    return token;
  }

  setSessionFromToken(token: string): SessionUser | null {
    const parsed = this.parseUserFromToken(token);
    if (!parsed) {
      this.clearSession();
      return null;
    }
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    this.tokenSignal.set(token);
    return parsed;
  }

  logout(): void {
    this.clearSession();
    void this.router.navigate(['/login']);
  }

  clearSession(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    this.tokenSignal.set(null);
  }

  private readStoredToken(): string | null {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  }

  private parseUserFromToken(token: string): SessionUser | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }

      const payloadJson = this.decodeBase64Url(parts[1]);
      const decoded = JSON.parse(payloadJson) as DecodedJwtPayload;

      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        return null;
      }

      if (decoded.role !== 'Administrador' && decoded.role !== 'Paciente') {
        return null;
      }

      return {
        id: decoded.id ?? decoded.sub ?? 'anon',
        nombre: decoded.nombre ?? decoded.email ?? 'Usuario Clínica',
        email: decoded.email ?? '',
        role: decoded.role,
        pacienteId: decoded.pacienteId ?? null,
      };
    } catch {
      return null;
    }
  }

  private decodeBase64Url(base64Url: string): string {
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
}
