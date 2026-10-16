import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';
import { API } from './api';
import { CONDUCTOR, conSesion, proveedoresDePrueba } from '../../testing/ayudas';

describe('sesionInterceptor', () => {
  let http: HttpTestingController;
  let cliente: HttpClient;
  let navigate: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: proveedoresDePrueba() });
    http = TestBed.inject(HttpTestingController);
    cliente = TestBed.inject(HttpClient);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    await conSesion(CONDUCTOR);
  });

  it('envía la cookie de sesión en las peticiones a la API', () => {
    void firstValueFrom(cliente.get(`${API}/fotos`)).catch(() => {});
    expect(http.expectOne(`${API}/fotos`).request.withCredentials).toBe(true);
  });

  it('un 401 en una ruta protegida cierra la sesión y lleva al login avisando que expiró', async () => {
    const p = firstValueFrom(cliente.get(`${API}/preoperacionales`)).catch(e => e);
    http.expectOne(`${API}/preoperacionales`).flush({ error: 'Debe iniciar sesión' }, { status: 401, statusText: 'x' });
    await p;
    expect(TestBed.inject(AuthService).isAuthenticated()).toBe(false);
    expect(navigate).toHaveBeenCalledWith(['/inicio/login'], { queryParams: { motivo: 'expirada' } });
  });

  it('un 401 al cambiar la contraseña (clave actual mala) NO cierra la sesión', async () => {
    const p = firstValueFrom(cliente.put(`${API}/password`, {})).catch(e => e);
    http.expectOne(`${API}/password`).flush({ error: 'x' }, { status: 401, statusText: 'x' });
    await p;
    expect(TestBed.inject(AuthService).isAuthenticated()).toBe(true);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('no toca peticiones que no son de la API', () => {
    void firstValueFrom(cliente.get('/assets/datos.json')).catch(() => {});
    expect(http.expectOne('/assets/datos.json').request.withCredentials).toBe(false);
  });
});
