export type Rol = 'admin' | 'usuario';

/** Usuario con sesión iniciada (lo devuelve GET/POST /api/login). Nunca incluye la contraseña. */
export interface Sesion {
  id: number;
  username: string;
  nombre: string | null;
  rol: Rol;
}

/** Fila del listado de usuarios (GET /api/usuarios, solo admin). */
export interface UsuarioListado {
  id: number;
  username: string;
  nombre: string | null;
  email: string | null;
  rol: Rol;
  estado: boolean;
  fechaCreacion: string | null;
}

export interface NuevoUsuario {
  username: string;
  password: string;
  nombre?: string;
  rol: Rol;
}

/** Cambios de un usuario (PUT /api/usuarios): solo se envían los campos que cambian. */
export interface CambiosUsuario {
  idUsuario: number;
  nombre?: string;
  rol?: Rol;
  estado?: boolean;
  password?: string;
}

/** Resultado de una operación que puede fallar con un mensaje para el usuario. */
export interface ResultadoOperacion {
  ok: boolean;
  error?: string;
}

export const PASSWORD_MIN = 4;
