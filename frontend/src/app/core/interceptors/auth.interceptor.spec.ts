import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { TOKEN_STORAGE_KEY, buildFakeJwt, logout } from '../../testing/test-helpers';

const API = 'http://localhost:3000/api';

describe('authInterceptor — JWT en rutas privadas', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  function configurar(): void {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  }

  afterEach(() => {
    httpMock?.verify();
    logout();
  });

  it('adjunta Authorization: Bearer <token> en una ruta privada', () => {
    const token = buildFakeJwt('Administrador');
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    configurar();

    http.get(`${API}/pacientes`).subscribe();

    const req = httpMock.expectOne(`${API}/pacientes`);
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
    req.flush({});
  });

  it('adjunta el token también en peticiones POST privadas', () => {
    const token = buildFakeJwt('Administrador');
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    configurar();

    http.post(`${API}/citas`, {}).subscribe();

    const req = httpMock.expectOne(`${API}/citas`);
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
    req.flush({});
  });

  it('adjunta el token del Paciente en /citas/mis-citas', () => {
    const token = buildFakeJwt('Paciente');
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    configurar();

    http.get(`${API}/citas/mis-citas`).subscribe();

    const req = httpMock.expectOne(`${API}/citas/mis-citas`);
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${token}`);
    req.flush({});
  });

  it('no adjunta Authorization si no hay sesión', () => {
    configurar();

    http.get(`${API}/pacientes`).subscribe();

    const req = httpMock.expectOne(`${API}/pacientes`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('no adjunta Authorization en el login, aunque exista un token guardado', () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, buildFakeJwt('Administrador'));
    configurar();

    http.post(`${API}/auth/login`, { email: 'a@a.com', password: 'x' }).subscribe();

    const req = httpMock.expectOne(`${API}/auth/login`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('no adjunta Authorization en la verificación pública de cédula', () => {
    localStorage.setItem(TOKEN_STORAGE_KEY, buildFakeJwt('Administrador'));
    configurar();

    http.get(`${API}/pacientes/verificar-cedula/1020304050`).subscribe();

    const req = httpMock.expectOne(`${API}/pacientes/verificar-cedula/1020304050`);
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });
});