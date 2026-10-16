import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { authGuard, guestGuard } from './auth.guard';
import { ADMIN, conSesion, proveedoresDePrueba } from '../../testing/ayudas';

describe('guards de autenticación', () => {
  const route = {} as ActivatedRouteSnapshot;
  const state = {} as RouterStateSnapshot;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: proveedoresDePrueba() });
  });

  it('authGuard redirige al login si no hay sesión', () => {
    const resultado = TestBed.runInInjectionContext(() => authGuard(route, state));
    expect(resultado instanceof UrlTree).toBe(true);
    expect(String(resultado)).toBe('/inicio/login');
  });

  it('authGuard permite el paso con sesión', async () => {
    await conSesion(ADMIN);
    expect(TestBed.runInInjectionContext(() => authGuard(route, state))).toBe(true);
  });

  it('guestGuard manda al panel a quien ya inició sesión', async () => {
    await conSesion(ADMIN);
    expect(String(TestBed.runInInjectionContext(() => guestGuard(route, state)))).toBe('/dashboard');
  });

  it('guestGuard deja ver el login sin sesión', () => {
    expect(TestBed.runInInjectionContext(() => guestGuard(route, state))).toBe(true);
  });
});
