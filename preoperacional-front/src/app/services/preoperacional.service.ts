import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { FiltrosPreoperacional, Preoperacional, PreoperacionalNuevo } from '../models/preoperacional';
import { API, mensajeError, parametros } from './api';

export interface ResultadoPreoperacional {
  ok: boolean;
  registro?: Preoperacional;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class PreoperacionalService {
  private readonly http = inject(HttpClient);

  /** Aumenta cada vez que se crea o elimina un registro: el historial lo usa para refrescarse solo. */
  readonly version = signal(0);

  async enviar(datos: PreoperacionalNuevo): Promise<ResultadoPreoperacional> {
    try {
      const registro = await firstValueFrom(this.http.post<Preoperacional>(`${API}/preoperacionales`, datos));
      this.version.update(v => v + 1);
      return { ok: true, registro };
    } catch (e) {
      return { ok: false, error: mensajeError(e, 'No se pudo enviar el preoperacional') };
    }
  }

  /** Usuario: solo los suyos · admin: todos (lo decide el servidor). */
  listar(filtros: FiltrosPreoperacional = {}): Promise<Preoperacional[]> {
    return firstValueFrom(this.http.get<Preoperacional[]>(`${API}/preoperacionales`, {
      params: parametros({ placa: filtros.placa, desde: filtros.desde, hasta: filtros.hasta })
    }));
  }

  detalle(id: number): Promise<Preoperacional> {
    return firstValueFrom(this.http.get<Preoperacional>(`${API}/preoperacionales`, { params: { id } }));
  }

  /** Solo admin. */
  async eliminar(id: number): Promise<{ ok: boolean; error?: string }> {
    try {
      await firstValueFrom(this.http.delete(`${API}/preoperacionales`, { params: { id } }));
      this.version.update(v => v + 1);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: mensajeError(e, 'No se pudo eliminar el registro') };
    }
  }
}
