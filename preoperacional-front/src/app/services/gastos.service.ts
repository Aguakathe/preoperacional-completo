import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Gasto, GastoNuevo } from '../models/gasto';
import { ResultadoOperacion } from '../models/usuario';
import { AuthService } from './auth.service';
import { API, mensajeError, urlDelServidor } from './api';

/**
 * Gastos de mantenimiento guardados en el servidor, con sus documentos (facturas, recibos).
 * Se recarga al iniciar sesión y se vacía al cerrarla.
 */
@Injectable({ providedIn: 'root' })
export class GastosService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  readonly gastos = signal<Gasto[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);

  readonly total = computed(() => this.gastos().reduce((t, g) => t + (Number(g.valorGasto) || 0), 0));
  readonly promedio = computed(() => (this.gastos().length ? this.total() / this.gastos().length : 0));

  constructor() {
    effect(() => {
      const usuario = this.auth.usuario();
      untracked(() => (usuario ? void this.recargar() : this.gastos.set([])));
    });
  }

  /** Solo el admin o quien registró el gasto puede eliminarlo. */
  puedeEliminar(gasto: Gasto): boolean {
    return this.auth.esAdmin() || gasto.creadoPor === this.auth.usuario()?.username;
  }

  async recargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      const lista = await firstValueFrom(this.http.get<Gasto[]>(`${API}/gastos`));
      this.gastos.set(lista.map(g => this.conUrls(g)));
    } catch (e) {
      this.error.set(mensajeError(e, 'No se pudieron cargar los gastos'));
    } finally {
      this.cargando.set(false);
    }
  }

  /** Guarda el gasto y sus documentos en una sola petición (multipart). */
  async crear(datos: GastoNuevo, documentos: File[]): Promise<ResultadoOperacion & { gasto?: Gasto }> {
    const form = new FormData();
    form.append('datos', new Blob([JSON.stringify(datos)], { type: 'application/json' }));
    documentos.forEach(d => form.append('documentos', d, d.name));
    try {
      const gasto = this.conUrls(await firstValueFrom(this.http.post<Gasto>(`${API}/gastos`, form)));
      this.gastos.update(l => [gasto, ...l]);
      return { ok: true, gasto };
    } catch (e) {
      return { ok: false, error: mensajeError(e, 'No se pudo guardar el gasto') };
    }
  }

  async eliminar(id: number): Promise<ResultadoOperacion> {
    try {
      await firstValueFrom(this.http.delete(`${API}/gastos`, { params: { id } }));
      this.gastos.update(l => l.filter(g => g.id !== id));
      return { ok: true };
    } catch (e) {
      return { ok: false, error: mensajeError(e, 'No se pudo eliminar el gasto') };
    }
  }

  private conUrls(g: Gasto): Gasto {
    return { ...g, documentos: (g.documentos ?? []).map(d => ({ ...d, url: urlDelServidor(d.url) })) };
  }
}
