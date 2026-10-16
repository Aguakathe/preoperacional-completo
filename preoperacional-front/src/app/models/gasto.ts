/** Gastos de mantenimiento: catálogos y tipos (los mismos que valida el back-end). */

export const TIPOS_GASTO = [
  { valor: 'preventivo', etiqueta: 'Mantenimiento preventivo' },
  { valor: 'correctivo', etiqueta: 'Mantenimiento correctivo' },
  { valor: 'repuestos', etiqueta: 'Repuestos' },
  { valor: 'lubricantes', etiqueta: 'Lubricantes' },
  { valor: 'neumaticos', etiqueta: 'Neumáticos' },
  { valor: 'bateria', etiqueta: 'Batería' },
  { valor: 'frenos', etiqueta: 'Sistema de frenos' },
  { valor: 'electrico', etiqueta: 'Sistema eléctrico' },
  { valor: 'otro', etiqueta: 'Otro' }
] as const;

export const FORMAS_PAGO = [
  { valor: 'efectivo', etiqueta: 'Efectivo' },
  { valor: 'tarjeta_credito', etiqueta: 'Tarjeta de crédito' },
  { valor: 'tarjeta_debito', etiqueta: 'Tarjeta de débito' },
  { valor: 'transferencia', etiqueta: 'Transferencia bancaria' },
  { valor: 'cheque', etiqueta: 'Cheque' },
  { valor: 'otro', etiqueta: 'Otro' }
] as const;

export const MAX_BYTES_DOCUMENTO = 5 * 1024 * 1024;
export const TIPOS_DOCUMENTO = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
export const ACCEPT_DOCUMENTOS = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';

export function etiquetaTipoGasto(valor: string): string {
  return TIPOS_GASTO.find(t => t.valor === valor)?.etiqueta ?? valor;
}

export function etiquetaFormaPago(valor: string): string {
  return FORMAS_PAGO.find(f => f.valor === valor)?.etiqueta ?? valor;
}

/** Documento adjunto ya guardado (factura, recibo...). `url` ya viene lista para abrirlo. */
export interface DocumentoGasto {
  id: number;
  name: string;
  size: number;
  type: string;
  url: string;
}

/** Campos del formulario de gasto (POST /api/gastos). */
export interface GastoNuevo {
  placa: string;
  kilometraje: number;
  fechaGasto: string;
  tipoGasto: string;
  descripcion: string;
  proveedor: string;
  valorGasto: number;
  formaPago: string;
  numeroFactura?: string;
  fechaVencimiento?: string;
  kilometrajeAnterior?: number;
  proximoMantenimiento?: number;
  observaciones?: string;
}

/** Gasto guardado (GET /api/gastos). */
export interface Gasto extends GastoNuevo {
  id: number;
  creadoPor: string;
  fechaCreacion: string;
  documentos: DocumentoGasto[];
}
