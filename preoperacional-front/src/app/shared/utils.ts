/** Placa de moto colombiana: 3 letras + 2 números + 1 letra (ej. ABC12G). */
export const PLACA_REGEX = /^[A-Z]{3}[0-9]{2}[A-Z]$/;

/**
 * Fecha de hoy (YYYY-MM-DD) en la zona horaria LOCAL del usuario.
 * CORRECCIÓN: antes se usaba `new Date().toISOString().split('T')[0]`, que devuelve la fecha en UTC;
 * en Colombia (UTC-5) después de las 19:00 el formulario mostraba la fecha de MAÑANA.
 */
export function hoyLocal(): string {
  const d = new Date();
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

/** Tamaño legible de archivo. Estaba duplicado en dos componentes. */
export function formatFileSize(bytes: number): string {
  if (!bytes) return '0 B';
  const unidades = ['B', 'KB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), unidades.length - 1);
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(1))} ${unidades[i]}`;
}

/** Desplaza suavemente la vista hasta un elemento por id (para llevar al usuario al campo pendiente). */
export function irA(id: string): void {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView?.({ behavior: 'smooth', block: 'center' }); // ?. por si el entorno (p. ej. jsdom) no lo implementa
  const foco = el.querySelector<HTMLElement>('input:not([type=hidden]), select, textarea, button');
  setTimeout(() => foco?.focus({ preventScroll: true }), 350);
}

/** Identificador único (UUID cuando el navegador lo soporta). */
export function nuevoId(): string {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Fecha ISO (YYYY-MM-DD) o ISO completa → "8 oct 2026" en formato colombiano. */
export function fechaCorta(valor: string): string {
  const soloFecha = /^\d{4}-\d{2}-\d{2}$/.test(valor);
  const d = soloFecha ? new Date(`${valor}T00:00:00`) : new Date(valor);
  return isNaN(d.getTime()) ? valor : d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Fortaleza orientativa 0-4 (longitud + variedad de caracteres). Solo guía visual, no bloquea. */
export function nivelFortaleza(password: string): number {
  if (!password) return 0;
  let puntos = 0;
  if (password.length >= 4) puntos++;
  if (password.length >= 8) puntos++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) puntos++;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) puntos++;
  return puntos;
}

export const ETIQUETAS_FORTALEZA = ['', 'Débil', 'Aceptable', 'Buena', 'Fuerte'];

/** Fecha y hora ISO → "16 oct 2026, 2:30 p. m." en formato colombiano. */
export function fechaHora(valor: string): string {
  const d = new Date(valor);
  return isNaN(d.getTime())
    ? valor
    : d.toLocaleString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}
