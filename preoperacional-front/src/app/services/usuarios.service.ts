import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CambiosUsuario, NuevoUsuario, UsuarioListado } from '../models/usuario';
import { API, mensajeError } from './api';

export interface ResultadoUsuario {
  ok: boolean;
  usuario?: UsuarioListado;
  error?: string;
}

/** Administración de usuarios (solo admin; el servidor responde 403 a los demás). */
@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly http = inject(HttpClient);

  listar(): Promise<UsuarioListado[]> {
    return firstValueFrom(this.http.get<UsuarioListado[]>(`${API}/usuarios`));
  }

  async crear(datos: NuevoUsuario): Promise<ResultadoUsuario> {
    try {
      const usuario = await firstValueFrom(this.http.post<UsuarioListado>(`${API}/usuarios`, datos));
      return { ok: true, usuario };
    } catch (e) {
      return { ok: false, error: mensajeError(e, 'No se pudo crear el usuario') };
    }
  }

  async actualizar(cambios: CambiosUsuario): Promise<ResultadoUsuario> {
    try {
      const usuario = await firstValueFrom(this.http.put<UsuarioListado>(`${API}/usuarios`, cambios));
      return { ok: true, usuario };
    } catch (e) {
      return { ok: false, error: mensajeError(e, 'No se pudo actualizar el usuario') };
    }
  }
}
