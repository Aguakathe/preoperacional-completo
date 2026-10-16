import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { GaleriaFotosComponent } from './galeria-fotos.component';
import { API } from '../../../../services/api';
import { FotoGuardada, Mantenimiento } from '../../../../models/foto';
import { CONDUCTOR, conSesion, proveedoresDePrueba, tick } from '../../../../../testing/ayudas';

const foto = (id: number, mantenimientoId: number, categoria: FotoGuardada['categoria'], creadaPor = 'jperez'): FotoGuardada => ({
  id, mantenimientoId, nombre: `f${id}.jpg`, tipo: 'image/jpeg', tamano: 100, categoria,
  creadaEn: '2026-10-16T10:00:00', creadaPor, url: `api/fotos/archivo?id=${id}`
});
const insp = (id: number, placa: string, creadoPor = 'jperez'): Mantenimiento => ({
  id, placa, kilometraje: 100, fechaInspeccion: '2026-10-16', inspector: 'Luis', observaciones: 'Todo ok',
  creadoPor, creadoEn: '2026-10-16T10:00:00', fotoIds: []
});

describe('GaleriaFotosComponent', () => {
  let http: HttpTestingController;

  async function crear(fotos: FotoGuardada[], inspecciones: Mantenimiento[]) {
    await TestBed.configureTestingModule({ imports: [GaleriaFotosComponent], providers: proveedoresDePrueba() }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    await conSesion(CONDUCTOR);
    const fixture = TestBed.createComponent(GaleriaFotosComponent);
    fixture.detectChanges();
    TestBed.tick();
    http.expectOne(`${API}/fotos`).flush(fotos);
    http.expectOne(`${API}/mantenimientos`).flush(inspecciones);
    await tick();
    fixture.detectChanges();
    return fixture;
  }

  it('muestra un estado vacío que explica cómo empezar', async () => {
    const fixture = await crear([], []);
    expect(fixture.nativeElement.textContent).toContain('Aún no hay fotos');
  });

  it('filtra por categoría y por inspección', async () => {
    const fixture = await crear(
      [foto(1, 10, 'motor'), foto(2, 10, 'frenos'), foto(3, 20, 'motor')],
      [insp(10, 'ABC12G'), insp(20, 'XYZ98A')]
    );
    const c = fixture.componentInstance;
    expect(c.vista().length).toBe(3);
    c.categoriaFiltro.set('motor');
    expect(c.vista().length).toBe(2);
    (c as unknown as { cambiarInspeccion(e: Event): void }).cambiarInspeccion({ target: { value: '20' } } as unknown as Event);
    expect(c.vista().map(v => v.foto.id)).toEqual([3]);
    expect(c.inspeccionDetalle()?.placa).toBe('XYZ98A');
  });

  it('las fotos ajenas son de solo lectura para un conductor', async () => {
    const fixture = await crear([foto(1, 10, 'motor', 'otro'), foto(2, 10, 'motor', 'jperez')], [insp(10, 'ABC12G', 'otro')]);
    const c = fixture.componentInstance;
    expect(c.vista().map(v => v.editable)).toEqual([false, true]);
    expect(fixture.nativeElement.textContent).toContain('Subida por otro');
  });

  it('si la carga falla ofrece reintentar', async () => {
    await TestBed.configureTestingModule({ imports: [GaleriaFotosComponent], providers: proveedoresDePrueba() }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    await conSesion(CONDUCTOR);
    const fixture = TestBed.createComponent(GaleriaFotosComponent);
    fixture.detectChanges();
    TestBed.tick();
    http.expectOne(`${API}/fotos`).flush({ error: 'x' }, { status: 500, statusText: 'x' });
    http.expectOne(`${API}/mantenimientos`).flush([]);
    await tick();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No se pudieron cargar las fotos');
    expect(fixture.nativeElement.textContent).toContain('Reintentar');
  });
});
