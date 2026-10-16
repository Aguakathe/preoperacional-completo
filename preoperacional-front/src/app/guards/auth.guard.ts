import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Bloquea rutas privadas (dashboard) si no hay sesión.
 * La sesión ya se consultó al servidor antes de arrancar la app (provideAppInitializer en app.config.ts),
 * por eso la verificación puede ser inmediata.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isAuthenticated() ? true : inject(Router).createUrlTree(['/inicio/login']);
};

/** Evita mostrar el login a quien ya inició sesión. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isAuthenticated() ? inject(Router).createUrlTree(['/dashboard']) : true;
};
