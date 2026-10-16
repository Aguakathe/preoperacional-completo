import { TestBed } from '@angular/core/testing';
import { EnvironmentProviders, Provider } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { sesionInterceptor } from '../app/services/sesion.interceptor';
import { AuthService } from '../app/services/auth.service';
import { API } from '../app/services/api';
import { Sesion } from '../app/models/usuario';

/** Proveedores comunes de las pruebas: rutas vacías y un HttpClient falso (con el interceptor real). */
export function proveedoresDePrueba(): (Provider | EnvironmentProviders)[] {
  return [
    provideRouter([]),
    provideHttpClient(withInterceptors([sesionInterceptor])),
    provideHttpClientTesting()
  ];
}

export const ADMIN: Sesion = { id: 1, username: 'admin', nombre: 'Administrador', rol: 'admin' };
export const CONDUCTOR: Sesion = { id: 2, username: 'jperez', nombre: 'Juan Pérez', rol: 'usuario' };

/**
 * Deja una sesión abierta como si el servidor la hubiera devuelto al arrancar.
 * Responde además las peticiones que los servicios hacen solos al iniciar sesión (fotos, gastos...).
 */
export async function conSesion(usuario: Sesion = ADMIN): Promise<void> {
  const auth = TestBed.inject(AuthService);
  const http = TestBed.inject(HttpTestingController);
  const promesa = auth.restaurarSesion();
  http.expectOne(`${API}/login`).flush(usuario);
  await promesa;
}

/** Responde con lista vacía todas las peticiones GET pendientes a la URL indicada (si las hay). */
export function responderVacio(url: string): void {
  const http = TestBed.inject(HttpTestingController);
  http.match(r => r.method === 'GET' && r.url === `${API}${url}`).forEach(r => r.flush([]));
}

/** Espera a que se resuelvan las promesas pendientes (los servicios usan async/await sobre HttpClient). */
export function tick(): Promise<void> {
  return new Promise(r => setTimeout(r));
}
