/**
 * Formulario preoperacional: catálogos y tipos.
 * Las listas son las mismas que valida el back-end (util/Catalogos.java): si se cambia un texto aquí,
 * hay que cambiarlo allá también.
 */

export type SiNo = 'si' | 'no';
export type EstadoChequeo = 'buen_estado' | 'mal_estado';
export type ClaveCategoria = 'documentacion' | 'estadoGeneral' | 'estadoMecanico' | 'estadoSistemas';

export const DOCUMENTACION = ['Licencia de Conducción', 'Licencia de Tránsito vehículo', 'Seguro Obligatorio', 'Revisión tecnicomecánica'];
export const ESTADO_GENERAL = [
  'Llantas y Rines (Labrado y presión)',
  'Espejos Retrovisores izquierdo y derecho',
  'Cojinería y asientos',
  'Estado del tanque de combustible',
  'Tubo de escape/exhosto',
  'Reposapies'
];
export const ESTADO_MECANICO = [
  'Funcionamiento del Clutch',
  'Funcionamiento de frenos',
  'Funcionamiento acelerador',
  'Nivel aceite motor',
  'Nivel líquido de frenos',
  'Fuga de líquidos (gasolina, aceite)',
  'Funcionamiento dirección',
  'Estado de Batería',
  'Amortiguadores',
  'Estado de guayas'
];
export const ESTADO_SISTEMAS = [
  'Luces altas y bajas',
  'Luces direccionales delanteros y traseros',
  'Luces traseras (cocuyos)',
  'Stop y Luz de freno',
  'Velocímetro',
  'Odómetro',
  'Encendido',
  'Testigos de tablero',
  'Bocina',
  'Herramientas básicas',
  'Casco con visor acrílico (marcado con placa)',
  'Chaleco reflectivo'
];

export const PREGUNTAS_SALUD = [
  'No estando bajo efecto del alcohol',
  'No estando bajo efectos de sustancias alucinógenas o psicoactivas',
  'Haciendo uso de gafas si le han sido recetadas',
  'Estando sin fatiga por horas de conducción o con sueño',
  'No estando bajo el efecto de medicamentos que produzcan somnolencia, fatiga o disminuyan las capacidades para la conducción',
  'Siendo consciente de No usar distractores en la conducción (celular, alimentación, maquillarse, etc)',
  'Conociendo y comprometiéndose al respeto de las políticas y lineamientos de seguridad y salud en el trabajo y seguridad vial de NCR y al cumplimiento de las normas de tránsito'
];

/**
 * Categorías del paso 6, en orden. `desde` reproduce la numeración del formato en papel:
 * documentación 1-4 y, aparte, el vehículo 1-28 (general 1-6, mecánico 7-16, sistemas 17-28).
 */
export const CATEGORIAS_PREOPERACIONAL: readonly {
  clave: ClaveCategoria; titulo: string; etiquetaPerfecto: string; items: string[]; desde: number;
}[] = [
  { clave: 'documentacion', titulo: 'Documentación no vigente', etiquetaPerfecto: 'Documentación en perfecto estado', items: DOCUMENTACION, desde: 1 },
  { clave: 'estadoGeneral', titulo: 'Estado general del vehículo', etiquetaPerfecto: 'Estado general en perfecto estado', items: ESTADO_GENERAL, desde: 1 },
  { clave: 'estadoMecanico', titulo: 'Estado mecánico', etiquetaPerfecto: 'Estado mecánico en perfecto estado', items: ESTADO_MECANICO, desde: 7 },
  { clave: 'estadoSistemas', titulo: 'Sistemas y accesorios del vehículo', etiquetaPerfecto: 'Sistemas y accesorios en perfecto estado', items: ESTADO_SISTEMAS, desde: 17 }
];

export function tituloCategoria(clave: string): string {
  return CATEGORIAS_PREOPERACIONAL.find(c => c.clave === clave)?.titulo ?? clave;
}

export interface SaludItem {
  pregunta: string;
  respuesta: SiNo | '';
}

export interface CategoriaNoCumple {
  perfectoEstado: boolean;
  elementos: string[];
}

/** Cuerpo de POST /api/preoperacionales (los mismos campos que valida el servidor). */
export interface PreoperacionalNuevo {
  conoceCampana: SiNo;
  qlid: string;
  nombreCompleto: string;
  placaMoto: string;
  kilometraje: number;
  documentacionVigente: EstadoChequeo;
  estadoGeneralVehiculo: EstadoChequeo;
  estadoSistemasAccesorios: EstadoChequeo;
  saludItems: SaludItem[];
  elementosMalEstado: SiNo;
  elementosNoCumplen: Record<ClaveCategoria, CategoriaNoCumple> | null;
  confirmaciones: { confirmacionInsegura: SiNo; confirmacionInspeccion: SiNo } | null;
}

/** Preoperacional guardado. En el listado no vienen saludItems, elementosNoCumplen ni confirmaciones. */
export interface Preoperacional extends Omit<PreoperacionalNuevo, 'saludItems' | 'elementosNoCumplen' | 'confirmaciones'> {
  id: number;
  fechaEnvio: string;
  registradoPor: string;
  aptoParaConducir: boolean;
  totalNoCumplen: number;
  saludItems?: SaludItem[];
  elementosNoCumplen?: Record<ClaveCategoria, CategoriaNoCumple>;
  confirmaciones?: { confirmacionInsegura: SiNo; confirmacionInspeccion: SiNo };
}

export interface FiltrosPreoperacional {
  placa?: string;
  desde?: string;
  hasta?: string;
}
