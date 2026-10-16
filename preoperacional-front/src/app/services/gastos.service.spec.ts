import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { GastosService } from './gastos.service';
import { API } from './api';
import { Gasto, GastoNuevo } from '../models/gasto';
import { ADMIN, CONDUCTOR, conSesion, proveedoresDePrueba, tick } from '../../testing/ayudas';

const nuevo: GastoNuevo = {
  placa: 'ABC12G', kilometraje: 16000, fechaGasto: '2026-10-10', tipoGasto: 'preventivo',
  descripcion: 'Aceite', proveedor: 'Taller', valorGasto: 85000, formaPago: 'efectivo'
};
const gasto = (id: number, valor: number, creadoPor = 'jperez'): Gasto => ({
  ...nuevo, id, valorGasto: valor, creadoPor, fechaCreacion: '2026-10-16T10:00:00',
  documentos: [{ id: 7, name: 'f.pdf', size: 10, type: 'application/pdf', url: 'api/gastos/documento?id=7' }]
});

describe('GastosService', () => {
  let servicio: GastosService;
  let http: HttpTestingController;

  async function cargarCon(lista: Gasto[]): Promise<void> {
    TestBed.tick();
    http.expectOne(`${API}/gastos`).flush(lista);
    await tick();
  }

  beforeEach(async () => {
    TestBed.configureTestingModule({ providers: proveedoresDePrueba() });
    http = TestBed.inject(HttpTestingController);
    servicio = TestBed.inject(GastosService);
    await conSesion(CONDUCTOR);
  });

  afterEach(() => http.verify());

  it('carga los gastos, arma las URL de los documentos y calcula total y promedio', async () => {
    await cargarCon([gasto(1, 100000), gasto(2, 50000)]);
    expect(servicio.total()).toBe(150000);
    expect(servicio.promedio()).toBe(75000);
    expect(servicio.gastos()[0].documentos[0].url).toBe('/preoperacional/api/gastos/documento?id=7');
  });

  it('crea el gasto con sus documentos en un multipart y lo agrega arriba de la lista', async () => {
    await cargarCon([gasto(1, 100)]);
    const pdf = new File(['%PDF'], 'factura.pdf', { type: 'application/pdf' });
    const p = servicio.crear(nuevo, [pdf]);
    const req = http.expectOne({ method: 'POST', url: `${API}/gastos` });
    const form = req.request.body as FormData;
    expect(JSON.parse(await (form.get('datos') as Blob).text())).toEqual(nuevo);
    expect((form.get('documentos') as File).name).toBe('factura.pdf');
    req.flush(gasto(2, 85000));
    expect((await p).ok).toBe(true);
    expect(servicio.gastos().map(g => g.id)).toEqual([2, 1]);
  });

  it('devuelve el error de validación del servidor', async () => {
    await cargarCon([]);
    const p = servicio.crear(nuevo, []);
    http.expectOne(`${API}/gastos`).flush({ error: 'El kilometraje anterior no puede ser mayor al actual' }, { status: 400, statusText: 'x' });
    expect(await p).toEqual({ ok: false, error: 'El kilometraje anterior no puede ser mayor al actual' });
  });

  it('solo el autor (o el admin) puede eliminar', async () => {
    await cargarCon([]);
    expect(servicio.puedeEliminar(gasto(1, 1, 'jperez'))).toBe(true);
    expect(servicio.puedeEliminar(gasto(1, 1, 'otro'))).toBe(false);
  });

  it('eliminar quita el gasto de la lista', async () => {
    await cargarCon([gasto(1, 100), gasto(2, 200)]);
    const p = servicio.eliminar(1);
    http.expectOne({ method: 'DELETE', url: `${API}/gastos?id=1` }).flush(null);
    await p;
    expect(servicio.gastos().map(g => g.id)).toEqual([2]);
  });
});

describe('GastosService con administrador', () => {
  it('el admin puede eliminar gastos de cualquiera', async () => {
    TestBed.configureTestingModule({ providers: proveedoresDePrueba() });
    const servicio = TestBed.inject(GastosService);
    await conSesion(ADMIN);
    TestBed.tick();
    TestBed.inject(HttpTestingController).expectOne(`${API}/gastos`).flush([]);
    expect(servicio.puedeEliminar(gasto(1, 1, 'otro'))).toBe(true);
  });
});
