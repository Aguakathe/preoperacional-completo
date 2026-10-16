import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { API } from './api';
import { ADMIN, CONDUCTOR, proveedoresDePrueba } from '../../testing/ayudas';

describe('AuthService', () => {
  let auth: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: proveedoresDePrueba() });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('restaura la sesión que ya tenía el servidor (recargar la página no saca al usuario)', async () => {
    const p = auth.restaurarSesion();
    http.expectOne({ method: 'GET', url: `${API}/login` }).flush(ADMIN);
    await p;
    expect(auth.isAuthenticated()).toBe(true);
    expect(auth.esAdmin()).toBe(true);
    expect(auth.nombreVisible()).toBe('Administrador');
  });

  it('sin sesión el servidor responde 204 y la app queda sin usuario', async () => {
    const p = auth.restaurarSesion();
    http.expectOne(`${API}/login`).flush(null, { status: 204, statusText: 'No Content' });
    await p;
    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.servidorNoDisponible()).toBe(false);
  });

  it('también tolera un 401 (versiones anteriores del back-end)', async () => {
    const p = auth.restaurarSesion();
    http.expectOne(`${API}/login`).flush({ error: 'Sin sesión iniciada' }, { status: 401, statusText: 'x' });
    await p;
    expect(auth.isAuthenticated()).toBe(false);
    expect(auth.servidorNoDisponible()).toBe(false);
  });

  it('marca el servidor como no disponible si no responde', async () => {
    const p = auth.restaurarSesion();
    http.expectOne(`${API}/login`).error(new ProgressEvent('error'), { status: 0 });
    await p;
    expect(auth.servidorNoDisponible()).toBe(true);
  });

  it('inicia sesión enviando usuario (sin espacios) y contraseña', async () => {
    const p = auth.login('  jperez ', 'clave');
    const req = http.expectOne({ method: 'POST', url: `${API}/login` });
    expect(req.request.body).toEqual({ username: 'jperez', password: 'clave' });
    req.flush(CONDUCTOR);
    expect(await p).toEqual({ ok: true });
    expect(auth.usuario()).toEqual(CONDUCTOR);
    expect(auth.isAdmin()).toBe(false);
  });

  it('muestra el mensaje del servidor si las credenciales son incorrectas', async () => {
    const p = auth.login('admin', 'mala');
    http.expectOne(`${API}/login`).flush({ error: 'Usuario o contraseña incorrectos' }, { status: 401, statusText: 'x' });
    expect(await p).toEqual({ ok: false, error: 'Usuario o contraseña incorrectos' });
    expect(auth.isAuthenticated()).toBe(false);
  });

  it('cerrar sesión avisa al servidor, limpia el usuario y vuelve al login', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const login = auth.login('admin', '12345');
    http.expectOne(`${API}/login`).flush(ADMIN);
    await login;

    const p = auth.logout();
    http.expectOne({ method: 'POST', url: `${API}/logout` }).flush(null);
    await p;
    expect(auth.usuario()).toBeNull();
    expect(navigate).toHaveBeenCalledWith(['/inicio/login']);
  });

  it('cambiar la contraseña valida antes de enviar', async () => {
    expect((await auth.cambiarPassword('1234', '12')).error).toContain('mínimo');
    expect((await auth.cambiarPassword('1234', '1234')).error).toContain('distinta');
    http.expectNone(`${API}/password`);
  });

  it('cambio de contraseña desde el login envía el usuario y devuelve el error del servidor', async () => {
    const p = auth.cambiarPasswordConCredenciales(' usuario ', 'mala', 'nueva123');
    const req = http.expectOne({ method: 'PUT', url: `${API}/password` });
    expect(req.request.body).toEqual({ username: 'usuario', passwordActual: 'mala', passwordNueva: 'nueva123' });
    req.flush({ error: 'Usuario o contraseña actual incorrectos' }, { status: 403, statusText: 'x' });
    expect(await p).toEqual({ ok: false, error: 'Usuario o contraseña actual incorrectos' });
  });
});
