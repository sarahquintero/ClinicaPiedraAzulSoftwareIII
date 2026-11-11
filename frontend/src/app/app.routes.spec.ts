import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { loginAs, logout } from './testing/test-helpers';

/**
 * Pruebas de acceso por URL (Guard 1: authGuard y Guard 2: roleGuard).
 * Se navega a cada URL y se verifica en qué ruta termina el usuario.
 */
describe('Rutas del frontend — control de acceso por URL', () => {
  let harness: RouterTestingHarness;
  let router: Router;

  beforeEach(async () => {
    logout();
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    });
    harness = await RouterTestingHarness.create();
    router = TestBed.inject(Router);
  });

  afterEach(() => logout());

  const urlActual = () => router.url.split('?')[0];

  //RUTAS PUBLICAS 
  describe('Rutas públicas (sin sesión)', () => {
    it('permite entrar a /login sin sesión', async () => {
      await harness.navigateByUrl('/login');
      expect(urlActual()).toBe('/login');
    });

    it('la raíz "/" redirige a /login', async () => {
      await harness.navigateByUrl('/');
      expect(urlActual()).toBe('/login');
    });

    it('permite ver /unauthorized sin sesión', async () => {
      await harness.navigateByUrl('/unauthorized');
      expect(urlActual()).toBe('/unauthorized');
    });

    it('una URL inexistente muestra la página 404 sin romper la app', async () => {
      await harness.navigateByUrl('/ruta-que-no-existe');
      expect(urlActual()).toBe('/ruta-que-no-existe');
    });
  });

  //RUTAS PRIVADAS — ACCESO PERMITIDO
  describe('Rutas privadas — acceso permitido por rol', () => {
    const rutasAdmin = ['/admin', '/admin/medicos', '/admin/pacientes', '/admin/citas'];

    for (const ruta of rutasAdmin) {
      it(`el Administrador puede entrar a ${ruta}`, async () => {
        loginAs('Administrador');
        await harness.navigateByUrl(ruta);
        expect(urlActual()).toBe(ruta);
      });
    }

    it('el Paciente puede entrar a /paciente', async () => {
      loginAs('Paciente');
      await harness.navigateByUrl('/paciente');
      expect(urlActual()).toBe('/paciente');
    });
  });

  //RUTAS PRIVADAS — ACCESO DENEGADO
  describe('Rutas privadas — acceso denegado', () => {
    const rutasPrivadas = ['/admin', '/admin/medicos', '/admin/pacientes', '/admin/citas', '/paciente'];

    for (const ruta of rutasPrivadas) {
      it(`Guard 1: sin sesión, ${ruta} redirige a /login`, async () => {
        await harness.navigateByUrl(ruta);
        expect(urlActual()).toBe('/login');
      });
    }

    it('Guard 1: conserva la URL solicitada en returnUrl', async () => {
      await harness.navigateByUrl('/admin/citas');
      expect(router.url).toContain('returnUrl=');
    });

    for (const ruta of ['/admin', '/admin/medicos', '/admin/pacientes', '/admin/citas']) {
      it(`Guard 2: un Paciente no puede entrar a ${ruta} (va a /unauthorized)`, async () => {
        loginAs('Paciente');
        await harness.navigateByUrl(ruta);
        expect(urlActual()).toBe('/unauthorized');
      });
    }

    it('Guard 2: un Administrador no puede entrar a /paciente (va a /unauthorized)', async () => {
      loginAs('Administrador');
      await harness.navigateByUrl('/paciente');
      expect(urlActual()).toBe('/unauthorized');
    });

    it('Guard 1: un token expirado se trata como sin sesión', async () => {
      const { buildFakeJwt, TOKEN_STORAGE_KEY } = await import('./testing/test-helpers');
      localStorage.setItem(TOKEN_STORAGE_KEY, buildFakeJwt('Administrador', -60));
      await harness.navigateByUrl('/admin');
      expect(urlActual()).toBe('/login');
    });

    it('Guard 1: un token malformado se trata como sin sesión', async () => {
      const { TOKEN_STORAGE_KEY } = await import('./testing/test-helpers');
      localStorage.setItem(TOKEN_STORAGE_KEY, 'esto-no-es-un-jwt');
      await harness.navigateByUrl('/paciente');
      expect(urlActual()).toBe('/login');
    });
  });
});