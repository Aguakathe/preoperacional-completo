import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';

/** URL base de la API (ej. /preoperacional/api). */
export const API = environment.apiUrl;

/**
 * El back-end devuelve las URL de archivos relativas a su contexto (ej. "api/fotos/archivo?id=5").
 * Esto las convierte en una ruta usable por el navegador (ej. "/preoperacional/api/fotos/archivo?id=5").
 */
export function urlDelServidor(relativa: string): string {
  const contexto = API.replace(/\/api\/?$/, '');
  return `${contexto}/${relativa.replace(/^\//, '')}`;
}

/**
 * Mensaje entendible para el usuario a partir de un error HTTP.
 * El back-end siempre responde {"error": "..."}; si no hay respuesta es que el servidor está apagado.
 */
export function mensajeError(error: unknown, porDefecto = 'Ocurrió un error. Inténtalo de nuevo.'): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'No hay conexión con el servidor. Verifica que el back-end (Tomcat) esté encendido.';
    }
    const cuerpo = error.error as { error?: unknown } | null;
    if (cuerpo && typeof cuerpo.error === 'string' && cuerpo.error.trim()) {
      return cuerpo.error;
    }
    if (error.status === 413) return 'Los archivos superan el tamaño máximo permitido.';
    if (error.status >= 500) return 'El servidor tuvo un problema. Inténtalo de nuevo en un momento.';
  }
  return porDefecto;
}

/** Convierte un objeto en parámetros de consulta, omitiendo los vacíos. */
export function parametros(valores: Record<string, string | number | null | undefined>): Record<string, string> {
  const salida: Record<string, string> = {};
  for (const [clave, valor] of Object.entries(valores)) {
    if (valor !== null && valor !== undefined && String(valor).trim() !== '') {
      salida[clave] = String(valor).trim();
    }
  }
  return salida;
}
