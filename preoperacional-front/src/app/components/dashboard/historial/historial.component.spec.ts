import { TestBed } from '@angular/core/testing';
import { HttpTestingController, TestRequest } from '@angular/common/http/testing';
import { HistorialComponent } from './historial.component';
import { FeedbackService } from '../../../shared/feedback.service';
import { API } from '../../../services/api';
import { Preoperacional } from '../../../models/preoperacional';
import { ADMIN, CONDUCTOR, conSesion, proveedoresDePrueba, tick } from '../../../../testing/ayudas';
import { Sesion } from '../../../models/usuario';

const registro = (id: number, apto: boolean, noCumplen: number): Preoperacional => ({
  id, fechaEnvio: '2026-10-16T08:30:00', registradoPor: 'jperez', aptoParaConducir: apto, totalNoCumplen: noCumplen,
  conoceCampana: 'si', qlid: 'AB1', nombreCompleto: 'Juan Pérez', placaMoto: 'ABC12G', kilometraje: 15400,
  documentacionVigente: 'buen_estado', estadoGeneralVehiculo: 'buen_estado', estadoSistemasAccesorios: 'mal_estado',
  elementosMalEstado: noCumplen > 0 ? 'si' : 'no'
});

describe('HistorialComponent', () => {
  let http: HttpTestingController;

  async function crear(usuario: Sesion, lista: Preoperacional[]) {
    await TestBed.configureTestingModule({ imports: [HistorialComponent], providers: proveedoresDePrueba() }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    await conSesion(usuario);
    const fixture = TestBed.createComponent(HistorialComponent);
    fixture.detectChanges();
    TestBed.tick();
    http.expectOne(r => r.url === `${API}/preoperacionales`).flush(lista);
    await tick();
    fixture.detectChanges();
    return fixture;
  }

  afterEach(() => http.verify());

  it('lista los registros con su estado y calcula el resumen', async () => {
    const fixture = await crear(CONDUCTOR, [registro(1, true, 1), registro(2, false, 0)]);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelectorAll('.registro').length).toBe(2);
    expect(el.querySelector('.badge-danger')?.textContent).toContain('No apto');
    expect(fixture.componentInstance.noAptos()).toBe(1);
    expect(fixture.componentInstance.conNovedades()).toBe(1);
    // Un conductor no ve quién lo registró ni el botón de eliminar
    expect(el.textContent).not.toContain('por jperez');
    expect(el.querySelector('.btn-peligro')).toBeNull();
  });

  it('muestra un estado vacío útil cuando no hay registros', async () => {
    const fixture = await crear(CONDUCTOR, []);
    expect(fixture.nativeElement.textContent).toContain('Aún no hay preoperacionales');
  });

  it('busca con los filtros y no permite un rango de fechas al revés', async () => {
    const fixture = await crear(ADMIN, []);
    const c = fixture.componentInstance;
    const error = vi.spyOn(TestBed.inject(FeedbackService), 'error');

    c.filtros.setValue({ placa: '', desde: '2026-10-20', hasta: '2026-10-01' });
    await c.cargar();
    expect(error).toHaveBeenCalled();
    http.expectNone(r => r.url === `${API}/preoperacionales`);

    c.filtros.setValue({ placa: 'ABC12G', desde: '', hasta: '' });
    const p = c.cargar();
    const req: TestRequest = http.expectOne(r => r.url === `${API}/preoperacionales`);
    expect(req.request.params.get('placa')).toBe('ABC12G');
    req.flush([]);
    await p;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No hay registros con esos filtros');
  });

  it('el admin ve quién registró, abre el detalle y puede eliminar', async () => {
    const fixture = await crear(ADMIN, [registro(1, true, 1)]);
    const c = fixture.componentInstance;
    expect(fixture.nativeElement.textContent).toContain('por jperez');

    const abrir = c.abrir(registro(1, true, 1));
    http.expectOne(`${API}/preoperacionales?id=1`).flush({
      ...registro(1, true, 1),
      saludItems: [{ pregunta: 'P1', respuesta: 'si' }],
      elementosNoCumplen: {
        documentacion: { perfectoEstado: true, elementos: [] }, estadoGeneral: { perfectoEstado: true, elementos: [] },
        estadoMecanico: { perfectoEstado: true, elementos: [] }, estadoSistemas: { perfectoEstado: false, elementos: ['Bocina'] }
      }
    });
    await abrir;
    fixture.detectChanges();
    const modal: HTMLElement = fixture.nativeElement.querySelector('.modal');
    expect(modal.textContent).toContain('Bocina');
    expect(modal.getAttribute('role')).toBe('dialog');

    vi.spyOn(TestBed.inject(FeedbackService), 'confirm').mockResolvedValue(true);
    const eliminar = c.eliminar(registro(1, true, 1));
    await tick();
    http.expectOne({ method: 'DELETE', url: `${API}/preoperacionales?id=1` }).flush(null);
    await eliminar;
    expect(c.detalle()).toBeNull();
    // Tras eliminar, el historial se vuelve a cargar solo
    TestBed.tick();
    http.expectOne(r => r.url === `${API}/preoperacionales`).flush([]);
  });
});
