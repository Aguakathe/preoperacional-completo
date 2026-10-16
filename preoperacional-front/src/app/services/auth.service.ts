import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { PASSWORD_MIN, ResultadoOperacion, Sesion } from '../models/usuario';
import { API, mensajeError } from './api';

/**
 * Sesión del usuario contra el back-end (cookie de sesión HttpOnly del servidor).
 *
 * - Al arrancar la app, `restaurarSesion()` pregunta al servidor si ya hay una sesión abierta,
 *   así recargar la página no saca al usuario (ver app.config.ts).
 * - Las contraseñas se validan y cifran en el servidor (BCrypt); el navegador nunca guarda nada.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly sesion = signal<Sesion | null>(null);
  /** Usuario con sesión (null si no hay). Los componentes reaccionan a sus cambios. */
  readonly usuario = this.sesion.asReadonly();
  readonly esAdmin = computed(() => this.sesion()?.rol === 'admin');
  /** Nombre para mostrar: el nombre completo si existe, si no el usuario. */
  readonly nombreVisible = computed(() => this.sesion()?.nombre?.trim() || this.sesion()?.username || '');
  /** true si al arrancar no se pudo contactar al servidor (se avisa en el login). */
  readonly servidorNoDisponible = signal(false);

  async restaurarSesion(): Promise<void> {
    try {
      // 200 con el usuario si hay sesión; 204 (cuerpo vacío) si no la hay
      this.sesion.set((await firstValueFrom(this.http.get<Sesion | null>(`${API}/login`))) ?? null);
      this.servidorNoDisponible.set(false);
    } catch (e) {
      this.sesion.set(null);
      this.servidorNoDisponible.set(e instanceof HttpErrorResponse && (e.status === 0 || e.status >= 500));
    }
  }

  async login(username: string, password: string): Promise<ResultadoOperacion> {
    try {
      const usuario = await firstValueFrom(this.http.post<Sesion>(`${API}/login`, { username: username.trim(), password }));
      this.sesion.set(usuario);
      this.servidorNoDisponible.set(false);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: mensajeError(e, 'No se pudo iniciar sesión') };
    }
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${API}/logout`, {}));
    } catch {
      // Aunque el servidor no responda, en el navegador se cierra la sesión igual
    }
    this.sesion.set(null);
    await this.router.navigate(['/inicio/login']);
  }

  /** La llama el interceptor cuando el servidor responde 401: la sesión venció (30 min sin actividad). */
  sesionExpirada(): void {
    if (!this.sesion()) return;
    this.sesion.set(null);
    void this.router.navigate(['/inicio/login'], { queryParams: { motivo: 'expirada' } });
  }

  isAuthenticated(): boolean {
    return this.sesion() !== null;
  }

  isAdmin(): boolean {
    return this.esAdmin();
  }

  getUsuarioActual(): Sesion | null {
    const s = this.sesion();
    return s ? { ...s } : null;
  }

  /** Cambia la contraseña del usuario con sesión activa (el servidor verifica la actual). */
  cambiarPassword(passwordActual: string, passwordNueva: string): Promise<ResultadoOperacion> {
    return this.enviarCambio({ passwordActual, passwordNueva }, passwordActual, passwordNueva);
  }

  /** Cambio desde la pantalla de login, sin sesión: exige usuario + contraseña actual. */
  cambiarPasswordConCredenciales(username: string, passwordActual: string, passwordNueva: string): Promise<ResultadoOperacion> {
    return this.enviarCambio({ username: username.trim(), passwordActual, passwordNueva }, passwordActual, passwordNueva);
  }

  private async enviarCambio(cuerpo: object, actual: string, nueva: string): Promise<ResultadoOperacion> {
    // Validación inmediata (el servidor vuelve a validar lo mismo)
    if (nueva.length < PASSWORD_MIN) {
      return { ok: false, error: `La nueva contraseña debe tener mínimo ${PASSWORD_MIN} caracteres` };
    }
    if (nueva === actual) {
      return { ok: false, error: 'La nueva contraseña debe ser distinta a la actual' };
    }
    try {
      await firstValueFrom(this.http.put(`${API}/password`, cuerpo));
      return { ok: true };
    } catch (e) {
      return { ok: false, error: mensajeError(e, 'No se pudo cambiar la contraseña') };
    }
  }
}
