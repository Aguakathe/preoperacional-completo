import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { API } from './api';

/** Rutas donde un 401 es una respuesta normal (credenciales malas), no una sesión vencida. */
const RUTAS_LIBRES = ['/login', '/logout', '/password'];

/**
 * - Envía la cookie de sesión en todas las peticiones a la API (necesario si el front y la API
 *   están en orígenes distintos; con el proxy de Angular no hace daño).
 * - Si el servidor responde 401 en una ruta protegida, la sesión venció: se vuelve al login con aviso.
 */
export const sesionInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.startsWith(API)) {
    return next(req);
  }
  const auth = inject(AuthService);
  return next(req.clone({ withCredentials: true })).pipe(
    catchError((error: unknown) => {
      const ruta = req.url.slice(API.length).split('?')[0];
      if (error instanceof HttpErrorResponse && error.status === 401 && !RUTAS_LIBRES.includes(ruta)) {
        auth.sesionExpirada();
      }
      return throwError(() => error);
    })
  );
};
