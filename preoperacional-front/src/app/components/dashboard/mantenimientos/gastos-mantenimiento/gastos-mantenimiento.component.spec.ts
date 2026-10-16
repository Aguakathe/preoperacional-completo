import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { GastosMantenimientoComponent } from './gastos-mantenimiento.component';
import { GastosService } from '../../../../services/gastos.service';
import { API } from '../../../../services/api';
import { Gasto } from '../../../../models/gasto';
import { CONDUCTOR, conSesion, proveedoresDePrueba, tick } from '../../../../../testing/ayudas';

const gasto = (id: number, placa: string, valor: number, creadoPor = 'jperez'): Gasto => ({
  id, placa, kilometraje: 1000, fechaGasto: '2026-10-10', tipoGasto: 'preventivo', descripcion: `Gasto ${id}`,
  proveedor: 'Taller', valorGasto: valor, formaPago: 'efectivo', creadoPor, fechaCreacion: '2026-10-16T10:00:00', documentos: []
});

describe('GastosMantenimientoComponent', () => {
  async function crear(lista: Gasto[]) {
    await TestBed.configureTestingModule({ imports: [GastosMantenimientoComponent], providers: proveedoresDePrueba() }).compileComponents();
    await conSesion(CONDUCTOR);
    const fixture = TestBed.createComponent(GastosMantenimientoComponent);
    fixture.detectChanges();
    TestBed.tick();
    TestBed.inject(HttpTestingController).expectOne(`${API}/gastos`).flush(lista);
    await tick();
    fixture.detectChanges();
    return fixture;
  }

  const datosValidos = {
    placa: 'ABC12D', kilometraje: 1000, fechaGasto: '2026-01-10', tipoGasto: 'preventivo', descripcion: ' Aceite ',
    proveedor: 'Taller', valorGasto: 50000, formaPago: 'efectivo', numeroFactura: '', fechaVencimiento: '',
    kilometrajeAnterior: null, proximoMantenimiento: null, observaciones: ''
  };

  it('el resumen y la lista se calculan sobre el filtro de placa', async () => {
    const fixture = await crear([gasto(1, 'ABC12G', 100000), gasto(2, 'XYZ98A', 50000)]);
    const c = fixture.componentInstance;
    expect(c.totalGastos()).toBe(150000);
    c.filtrarPorPlaca({ target: { value: 'xyz' } } as unknown as Event);
    expect(c.gastosFiltrados().map(g => g.id)).toEqual([2]);
    expect(c.totalGastos()).toBe(50000);
    expect(c.promedioGastos()).toBe(50000);
  });

  it('valida la coherencia de kilometrajes antes de enviar', async () => {
    const c = (await crear([])).componentInstance;
    c.gastosForm.setValue({ ...datosValidos, kilometrajeAnterior: 2000 });
    expect(c.gastosForm.hasError('kmAnterior')).toBe(true);
    c.gastosForm.patchValue({ kilometrajeAnterior: 500, proximoMantenimiento: 1000 });
    expect(c.gastosForm.hasError('kmProximo')).toBe(true);
  });

  it('rechaza documentos que no son PDF/JPG/PNG o pesan más de 5 MB', async () => {
    const c = (await crear([])).componentInstance;
    expect(c.validateFile(new File(['x'], 'a.txt', { type: 'text/plain' }))).toContain('no es válido');
    expect(c.validateFile(new File(['x'], 'f.pdf', { type: 'application/pdf' }))).toBeNull();
  });

  it('envía el gasto limpio (sin espacios ni opcionales vacíos) con sus documentos', async () => {
    const c = (await crear([])).componentInstance;
    const crearGasto = vi.spyOn(TestBed.inject(GastosService), 'crear').mockResolvedValue({ ok: true });
    c.gastosForm.setValue(datosValidos);
    const pdf = new File(['%PDF'], 'factura.pdf', { type: 'application/pdf' });
    c.handleFiles([pdf] as unknown as FileList);
    await c.onSubmit();
    const [datos, docs] = crearGasto.mock.calls[0];
    expect(datos.descripcion).toBe('Aceite');
    expect(datos.numeroFactura).toBeUndefined();
    expect(docs).toEqual([pdf]);
    expect(c.uploadedFiles).toEqual([]);
  });

  it('solo muestra "eliminar" en los gastos propios', async () => {
    const fixture = await crear([gasto(1, 'ABC12G', 100, 'jperez'), gasto(2, 'ABC12G', 100, 'otro')]);
    const filas = fixture.nativeElement.querySelectorAll('.registros .registro');
    expect(filas[0].querySelector('.btn-peligro')).not.toBeNull();
    expect(filas[1].querySelector('.btn-peligro')).toBeNull();
  });
});
