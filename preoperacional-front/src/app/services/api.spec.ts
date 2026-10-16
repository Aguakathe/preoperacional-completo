import { HttpErrorResponse } from '@angular/common/http';
import { mensajeError, parametros, urlDelServidor } from './api';

describe('utilidades de la API', () => {
  it('convierte las URL relativas del back-end en rutas del navegador', () => {
    expect(urlDelServidor('api/fotos/archivo?id=5')).toBe('/preoperacional/api/fotos/archivo?id=5');
    expect(urlDelServidor('/api/gastos/documento?id=1')).toBe('/preoperacional/api/gastos/documento?id=1');
  });

  it('usa el mensaje {"error": ...} del servidor', () => {
    const e = new HttpErrorResponse({ status: 400, error: { error: 'Placa inválida' } });
    expect(mensajeError(e)).toBe('Placa inválida');
  });

  it('explica que el servidor está apagado cuando no hay respuesta', () => {
    expect(mensajeError(new HttpErrorResponse({ status: 0 }))).toContain('No hay conexión con el servidor');
  });

  it('da mensajes claros para 413 y 5xx sin cuerpo', () => {
    expect(mensajeError(new HttpErrorResponse({ status: 413 }))).toContain('tamaño máximo');
    expect(mensajeError(new HttpErrorResponse({ status: 500 }))).toContain('servidor tuvo un problema');
    expect(mensajeError(new Error('x'), 'Por defecto')).toBe('Por defecto');
  });

  it('omite los parámetros vacíos', () => {
    expect(parametros({ placa: 'ABC12G', desde: '', hasta: undefined, id: 0 })).toEqual({ placa: 'ABC12G', id: '0' });
  });
});
