/** Las 8 categorías de foto de un mantenimiento (ids estables: se guardan en la base de datos). */
export type CategoriaFotoId =
  | 'general' | 'motor' | 'llantas' | 'frenos' | 'luces' | 'carroceria' | 'interior' | 'documentos';

export interface CategoriaFoto {
  readonly id: CategoriaFotoId;
  readonly nombre: string;
  /** Nombre del ícono en IconComponent. */
  readonly icono: string;
}

export const CATEGORIAS_FOTO: readonly CategoriaFoto[] = [
  { id: 'general', nombre: 'Vista General', icono: 'moto' },
  { id: 'motor', nombre: 'Motor', icono: 'cog' },
  { id: 'llantas', nombre: 'Llantas', icono: 'wheel' },
  { id: 'frenos', nombre: 'Frenos', icono: 'brake' },
  { id: 'luces', nombre: 'Luces', icono: 'bulb' },
  { id: 'carroceria', nombre: 'Carrocería', icono: 'wrench' },
  { id: 'interior', nombre: 'Interior', icono: 'seat' },
  { id: 'documentos', nombre: 'Documentos', icono: 'file' }
];

export const CATEGORIA_POR_DEFECTO: CategoriaFotoId = 'general';

/** Límites de las fotos (los mismos que valida el servidor). */
export const MAX_FOTOS = 10;
export const MAX_BYTES_FOTO = 10 * 1024 * 1024;
export const TIPOS_FOTO = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const ACCEPT_FOTOS = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';

/** Tipo MIME propio para arrastrar una foto ya cargada hacia otra categoría. */
export const MIME_FOTO_ID = 'application/x-ncr-foto-id';

export type ConteoCategorias = Record<CategoriaFotoId, number>;

export function esCategoriaValida(valor: unknown): valor is CategoriaFotoId {
  return CATEGORIAS_FOTO.some(c => c.id === valor);
}

export function conteoVacio(): ConteoCategorias {
  return { general: 0, motor: 0, llantas: 0, frenos: 0, luces: 0, carroceria: 0, interior: 0, documentos: 0 };
}

export function contarPorCategoria(fotos: readonly { categoria: CategoriaFotoId }[]): ConteoCategorias {
  const conteo = conteoVacio();
  for (const f of fotos) {
    conteo[f.categoria]++;
  }
  return conteo;
}

export function nombreCategoria(id: CategoriaFotoId): string {
  return CATEGORIAS_FOTO.find(c => c.id === id)?.nombre ?? id;
}

export function iconoCategoria(id: CategoriaFotoId): string {
  return CATEGORIAS_FOTO.find(c => c.id === id)?.icono ?? 'image';
}

/** Foto guardada (GET /api/fotos). `url` ya viene lista para usar en un <img>. */
export interface FotoGuardada {
  id: number;
  mantenimientoId: number;
  nombre: string;
  tipo: string;
  tamano: number;
  categoria: CategoriaFotoId;
  creadaEn: string;
  creadaPor: string;
  url: string;
}

/** Inspección con fotos (GET /api/mantenimientos). */
export interface Mantenimiento {
  id: number;
  placa: string;
  kilometraje: number | null;
  fechaInspeccion: string;
  inspector: string;
  observaciones: string | null;
  creadoPor: string;
  creadoEn: string;
  fotoIds: number[];
}

/** Datos de la inspección que se envían junto con las fotos. */
export interface DatosInspeccion {
  placa: string;
  kilometraje: number | null;
  fechaInspeccion: string;
  inspector: string;
  observaciones: string;
}
