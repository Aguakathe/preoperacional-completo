import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { PreoperacionalService } from './preoperacional.service';
import { UsuariosService } from './usuarios.service';
import { API } from './api';
import { PreoperacionalNuevo } from '../models/preoperacional';
import { proveedoresDePrueba } from '../../testing/ayudas';

describe('PreoperacionalService', () => {
  let servicio: PreoperacionalService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: proveedoresDePrueba() });
    servicio = TestBed.inject(PreoperacionalService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('al enviar devuelve el registro guardado y avisa al historial (version)', async () => {
    const p = servicio.enviar({ placaMoto: 'ABC12G' } as PreoperacionalNuevo);
    http.expectOne({ method: 'POST', url: `${API}/preoperacionales` }).flush({ id: 5, aptoParaConducir: true });
    const r = await p;
    expect(r.ok).toBe(true);
    expect(r.registro?.id).toBe(5);
    expect(servicio.version()).toBe(1);
  });

  it('si el servidor rechaza el envío devuelve su mensaje y no cambia la versión', async () => {
    const p = servicio.enviar({} as PreoperacionalNuevo);
    http.expectOne(`${API}/preoperacionales`).flush({ error: '7) Responde las dos confirmaciones' }, { status: 400, statusText: 'x' });
    expect(await p).toEqual({ ok: false, error: '7) Responde las dos confirmaciones' });
    expect(servicio.version()).toBe(0);
  });

  it('lista con filtros enviando solo los que tienen valor', async () => {
    const p = servicio.listar({ placa: 'ABC12G', desde: '', hasta: '2026-10-31' });
    const req = http.expectOne(r => r.url === `${API}/preoperacionales`);
    expect(req.request.params.keys().sort()).toEqual(['hasta', 'placa']);
    req.flush([]);
    expect(await p).toEqual([]);
  });

  it('pide el detalle por id y elimina (solo admin) avisando al historial', async () => {
    const d = servicio.detalle(3);
    http.expectOne(`${API}/preoperacionales?id=3`).flush({ id: 3 });
    expect((await d).id).toBe(3);

    const e = servicio.eliminar(3);
    http.expectOne({ method: 'DELETE', url: `${API}/preoperacionales?id=3` }).flush(null);
    expect((await e).ok).toBe(true);
    expect(servicio.version()).toBe(1);
  });
});

describe('UsuariosService', () => {
  it('crea y actualiza usuarios devolviendo los errores del servidor', async () => {
    TestBed.configureTestingModule({ providers: proveedoresDePrueba() });
    const servicio = TestBed.inject(UsuariosService);
    const http = TestBed.inject(HttpTestingController);

    const c = servicio.crear({ username: 'jperez', password: 'clave', rol: 'usuario' });
    http.expectOne({ method: 'POST', url: `${API}/usuarios` }).flush({ error: 'El usuario ya existe' }, { status: 409, statusText: 'x' });
    expect(await c).toEqual({ ok: false, error: 'El usuario ya existe' });

    const a = servicio.actualizar({ idUsuario: 2, estado: false });
    const req = http.expectOne({ method: 'PUT', url: `${API}/usuarios` });
    expect(req.request.body).toEqual({ idUsuario: 2, estado: false });
    req.flush({ id: 2, username: 'jperez', estado: false });
    expect((await a).usuario?.estado).toBe(false);
    http.verify();
  });
});
