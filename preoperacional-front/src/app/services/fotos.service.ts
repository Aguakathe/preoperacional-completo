import { Injectable, effect, inject, signal, untracked } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CategoriaFotoId, DatosInspeccion, FotoGuardada, Mantenimiento } from '../models/foto';
import { ResultadoOperacion } from '../models/usuario';
import { AuthService } from './auth.service';
import { API, mensajeError, urlDelServidor } from './api';

export interface ArchivoParaGuardar {
  file: File;
  categoria: CategoriaFotoId;
}

export interface ResultadoGuardado extends ResultadoOperacion {
  mantenimiento?: Mantenimiento;
}

/**
 * Inspecciones y fotos, guardadas en el servidor (MySQL).
 * El estado se expone con signals: la galería y los contadores se actualizan solos.
 * Se recarga al iniciar sesión y se vacía al cerrarla (un usuario nunca ve datos del anterior).
 */
@Injectable({ providedIn: 'root' })
export class FotosService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  readonly fotos = signal<FotoGuardada[]>([]);
  readonly mantenimientos = signal<Mantenimiento[]>([]);
  readonly cargando = signal(false);
  /** Mensaje si la última carga falló (la galería ofrece reintentar). */
  readonly error = signal<string | null>(null);

  constructor() {
    effect(() => {
      const usuario = this.auth.usuario();
      untracked(() => (usuario ? void this.recargar() : this.vaciar()));
    });
  }

  /** Administrador: todas las fotos. Usuario: solo las que subió él. */
  puedeEditar(item: { creadaPor?: string; creadoPor?: string }): boolean {
    const yo = this.auth.usuario()?.username;
    return this.auth.esAdmin() || (!!yo && (item.creadaPor ?? item.creadoPor) === yo);
  }

  async recargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      const [fotos, mantenimientos] = await Promise.all([
        firstValueFrom(this.http.get<FotoGuardada[]>(`${API}/fotos`)),
        firstValueFrom(this.http.get<Mantenimiento[]>(`${API}/mantenimientos`))
      ]);
      this.fotos.set(fotos.map(f => ({ ...f, url: urlDelServidor(f.url) })));
      this.mantenimientos.set(mantenimientos);
    } catch (e) {
      this.error.set(mensajeError(e, 'No se pudieron cargar las fotos'));
    } finally {
      this.cargando.set(false);
    }
  }

  /** Guarda la inspección y todas sus fotos en una sola petición (el servidor guarda todo o nada). */
  async guardarInspeccion(datos: DatosInspeccion, archivos: ArchivoParaGuardar[]): Promise<ResultadoGuardado> {
    const form = new FormData();
    const json = { ...datos, observaciones: datos.observaciones?.trim() || null, categorias: archivos.map(a => a.categoria) };
    form.append('datos', new Blob([JSON.stringify(json)], { type: 'application/json' }));
    archivos.forEach(a => form.append('fotos', a.file, a.file.name));
    try {
      const mantenimiento = await firstValueFrom(this.http.post<Mantenimiento>(`${API}/mantenimientos`, form));
      await this.recargar();
      return { ok: true, mantenimiento };
    } catch (e) {
      return { ok: false, error: mensajeError(e, 'No se pudieron guardar las fotos. Inténtalo de nuevo.') };
    }
  }

  /** Reasigna la categoría. Los contadores cambian al instante y se revierten si el servidor falla. */
  async cambiarCategoria(id: number, categoria: CategoriaFotoId): Promise<ResultadoOperacion> {
    const actual = this.fotos().find(f => f.id === id);
    if (!actual) return { ok: false, error: 'La foto ya no existe' };
    if (!this.puedeEditar(actual)) return { ok: false, error: 'Solo puedes mover las fotos que subiste tú' };
    if (actual.categoria === categoria) return { ok: true };

    const previa = actual.categoria;
    this.aplicarCategoria(id, categoria);
    try {
      await firstValueFrom(this.http.put(`${API}/fotos`, { idFoto: id, categoria }));
      return { ok: true };
    } catch (e) {
      this.aplicarCategoria(id, previa);
      return { ok: false, error: mensajeError(e, 'No se pudo guardar la categoría. Inténtalo de nuevo.') };
    }
  }

  async eliminar(id: number): Promise<ResultadoOperacion> {
    const actual = this.fotos().find(f => f.id === id);
    if (!actual) return { ok: true };
    if (!this.puedeEditar(actual)) return { ok: false, error: 'Solo puedes eliminar las fotos que subiste tú' };
    try {
      await firstValueFrom(this.http.delete(`${API}/fotos`, { params: { id } }));
    } catch (e) {
      return { ok: false, error: mensajeError(e, 'No se pudo eliminar la foto.') };
    }
    this.fotos.update(l => l.filter(f => f.id !== id));
    this.mantenimientos.update(l => l.map(m => ({ ...m, fotoIds: m.fotoIds.filter(f => f !== id) })));
    return { ok: true };
  }

  /** Borra una inspección completa con todas sus fotos (admin o quien la registró). */
  async eliminarInspeccion(id: number): Promise<ResultadoOperacion> {
    try {
      await firstValueFrom(this.http.delete(`${API}/mantenimientos`, { params: { id } }));
    } catch (e) {
      return { ok: false, error: mensajeError(e, 'No se pudo eliminar la inspección.') };
    }
    this.fotos.update(l => l.filter(f => f.mantenimientoId !== id));
    this.mantenimientos.update(l => l.filter(m => m.id !== id));
    return { ok: true };
  }

  private aplicarCategoria(id: number, categoria: CategoriaFotoId): void {
    this.fotos.update(l => l.map(f => (f.id === id ? { ...f, categoria } : f)));
  }

  private vaciar(): void {
    this.fotos.set([]);
    this.mantenimientos.set([]);
    this.error.set(null);
  }
}
