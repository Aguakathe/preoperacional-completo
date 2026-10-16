import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { FotosService } from './fotos.service';
import { AuthService } from './auth.service';
import { API } from './api';
import { FotoGuardada, Mantenimiento } from '../models/foto';
import { ADMIN, CONDUCTOR, conSesion, proveedoresDePrueba, tick } from '../../testing/ayudas';

const foto = (id: number, creadaPor = 'jperez', categoria: FotoGuardada['categoria'] = 'general'): FotoGuardada => ({
  id, mantenimientoId: 10, nombre: `f${id}.png`, tipo: 'image/png', tamano: 100, categoria,
  creadaEn: '2026-10-16T10:00:00', creadaPor, url: `api/fotos/archivo?id=${id}`
});
const inspeccion: Mantenimiento = {
  id: 10, placa: 'ABC12G', kilometraje: 100, fechaInspeccion: '2026-10-16', inspector: 'Luis',
  observaciones: null, creadoPor: 'jperez', creadoEn: '2026-10-16T10:00:00', fotoIds: [1, 2]
};

describe('FotosService', () => {
  let servicio: FotosService;
  let http: HttpTestingController;

  /** Al abrir sesión el servicio carga fotos e inspecciones solo; aquí se responden esas dos peticiones. */
  async function cargarCon(fotos: FotoGuardada[]): Promise<void> {
    TestBed.tick();
    http.expectOne(`${API}/fotos`).flush(fotos);
    http.expectOne(`${API}/mantenimientos`).flush([inspeccion]);
    await tick();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: proveedoresDePrueba() });
    http = TestBed.inject(HttpTestingController);
    servicio = TestBed.inject(FotosService);
    await conSesion(CONDUCTOR);
  });

  afterEach(() => http.verify());

  it('carga las fotos al iniciar sesión y arma la URL de cada imagen', async () => {
    await cargarCon([foto(1), foto(2)]);
    expect(servicio.fotos().map(f => f.url)).toEqual([
      '/preoperacional/api/fotos/archivo?id=1', '/preoperacional/api/fotos/archivo?id=2'
    ]);
    expect(servicio.mantenimientos()).toHaveLength(1);
  });

  it('se vacía al cerrar sesión (otro usuario no ve las fotos del anterior)', async () => {
    await cargarCon([foto(1)]);
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const auth = TestBed.inject(AuthService);
    const p = auth.logout();
    http.expectOne(`${API}/logout`).flush(null);
    await p;
    TestBed.tick();
    expect(servicio.fotos()).toEqual([]);
  });

  it('envía la inspección y las fotos en un solo multipart, con la categoría de cada foto en orden', async () => {
    await cargarCon([]);
    const a = new File(['a'], 'motor.png', { type: 'image/png' });
    const b = new File(['b'], 'llanta.png', { type: 'image/png' });
    const p = servicio.guardarInspeccion(
      { placa: 'ABC12G', kilometraje: 10, fechaInspeccion: '2026-10-16', inspector: 'Luis', observaciones: '  ' },
      [{ file: a, categoria: 'motor' }, { file: b, categoria: 'llantas' }]
    );
    const req = http.expectOne({ method: 'POST', url: `${API}/mantenimientos` });
    const form = req.request.body as FormData;
    const datos = JSON.parse(await (form.get('datos') as Blob).text());
    expect(datos.categorias).toEqual(['motor', 'llantas']);
    expect(datos.observaciones).toBeNull();
    expect(form.getAll('fotos')).toHaveLength(2);
    req.flush(inspeccion);
    await tick();
    http.expectOne(`${API}/fotos`).flush([foto(1), foto(2)]);
    http.expectOne(`${API}/mantenimientos`).flush([inspeccion]);
    expect((await p).ok).toBe(true);
    expect(servicio.fotos()).toHaveLength(2);
  });

  it('cambia la categoría al instante y la revierte si el servidor falla', async () => {
    await cargarCon([foto(1, 'jperez', 'general')]);
    const p = servicio.cambiarCategoria(1, 'frenos');
    expect(servicio.fotos()[0].categoria).toBe('frenos');
    http.expectOne({ method: 'PUT', url: `${API}/fotos` }).flush({ error: 'x' }, { status: 500, statusText: 'x' });
    const r = await p;
    expect(r.ok).toBe(false);
    expect(servicio.fotos()[0].categoria).toBe('general');
  });

  it('un conductor no puede mover ni borrar fotos ajenas (ni siquiera se envía la petición)', async () => {
    await cargarCon([foto(1, 'otro')]);
    expect((await servicio.cambiarCategoria(1, 'motor')).ok).toBe(false);
    expect((await servicio.eliminar(1)).ok).toBe(false);
    http.expectNone(`${API}/fotos`);
  });

  it('eliminar una inspección quita sus fotos de la galería', async () => {
    await cargarCon([foto(1), foto(2)]);
    const p = servicio.eliminarInspeccion(10);
    http.expectOne({ method: 'DELETE', url: `${API}/mantenimientos?id=10` }).flush(null);
    expect((await p).ok).toBe(true);
    expect(servicio.fotos()).toEqual([]);
    expect(servicio.mantenimientos()).toEqual([]);
  });

  it('si la carga falla expone el mensaje para reintentar', async () => {
    TestBed.tick();
    http.expectOne(`${API}/fotos`).error(new ProgressEvent('error'), { status: 0 });
    http.expectOne(`${API}/mantenimientos`).flush([]);
    await tick();
    expect(servicio.error()).toContain('No hay conexión');
  });
});

describe('FotosService con administrador', () => {
  it('el admin puede editar fotos de cualquiera', async () => {
    TestBed.configureTestingModule({ providers: proveedoresDePrueba() });
    const servicio = TestBed.inject(FotosService);
    await conSesion(ADMIN);
    expect(servicio.puedeEditar({ creadaPor: 'otro' })).toBe(true);
    TestBed.tick();
    TestBed.inject(HttpTestingController).match(() => true).forEach(r => r.flush([]));
  });
});
