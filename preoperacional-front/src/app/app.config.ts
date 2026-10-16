import {
  ApplicationConfig, LOCALE_ID, inject, provideAppInitializer, provideZoneChangeDetection
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { AuthService } from './services/auth.service';
import { sesionInterceptor } from './services/sesion.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection(),
    // Al cambiar de ruta se vuelve al inicio de la página
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' }), withComponentInputBinding()),
    // Todas las peticiones a la API pasan por el interceptor de sesión (cookie + 401 = sesión vencida)
    provideHttpClient(withInterceptors([sesionInterceptor])),
    { provide: LOCALE_ID, useValue: 'es-CO' },
    // Antes de pintar la app se pregunta al servidor si ya hay una sesión abierta (recargar la página no saca al usuario)
    provideAppInitializer(() => inject(AuthService).restaurarSesion())
  ]
};
