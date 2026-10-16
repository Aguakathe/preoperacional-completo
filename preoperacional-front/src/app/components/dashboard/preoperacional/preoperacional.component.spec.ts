import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { PreoperacionalComponent } from './preoperacional.component';
import { API } from '../../../services/api';
import { CONDUCTOR, conSesion, proveedoresDePrueba } from '../../../../testing/ayudas';

describe('PreoperacionalComponent', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PreoperacionalComponent], providers: proveedoresDePrueba() }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    await conSesion(CONDUCTOR);
    window.scrollTo = vi.fn() as typeof window.scrollTo;
  });

  afterEach(() => http.verify());

  function crear() {
    const fixture = TestBed.createComponent(PreoperacionalComponent);
    fixture.detectChanges();
    return fixture;
  }

  /** Responde todo el formulario "sin novedades". */
  function llenarSinNovedades(c: PreoperacionalComponent): void {
    c.conoceCampana = 'si';
    c.preoperacionalForm.setValue({ qlid: 'AB123', nombreCompleto: 'Juan Pérez', placaMoto: 'ABC12G', kilometraje: 0 });
    c.chequeos.forEach(ch => (ch.valor = 'buen_estado'));
    c.saludItems.forEach(s => (s.respuesta = 'si'));
    c.elementosMalEstado = 'no';
    c.confirmacionInsegura = 'si';
    c.confirmacionInspeccion = 'si';
  }

  it('precarga el nombre del conductor con el de la cuenta', () => {
    expect(crear().componentInstance.preoperacionalForm.controls.nombreCompleto.value).toBe('Juan Pérez');
  });

  it('el progreso llega a 100% y un kilometraje de 0 cuenta como respondido', () => {
    const c = crear().componentInstance;
    expect(c.getFormProgress()).toBe(0);
    llenarSinNovedades(c);
    expect(c.getFormProgress()).toBe(100);
    expect(c.isFormValid()).toBe(true);
  });

  it('detecta la incoherencia: mal estado en el paso 3 pero "todo bien" en el paso 5', () => {
    const c = crear().componentInstance;
    llenarSinNovedades(c);
    c.chequeos[2].valor = 'mal_estado';
    expect(c.incoherencia).toBe(true);
    expect(c.pendientes()[0].texto).toContain('Marcaste «Mal estado»');
  });

  it('con elementos en mal estado exige resolver cada categoría y reportar al menos uno', () => {
    const c = crear().componentInstance;
    llenarSinNovedades(c);
    c.elementosMalEstado = 'si';
    expect(c.pendientes()[0].id).toBe('sec-detalle');
    c.categorias.forEach(cat => c.onPerfectoChange(cat, 'si'));
    expect(c.pendientes()[0].texto).toContain('al menos un elemento');
    c.toggleItem(c.categorias[3], 'Bocina', { target: { checked: true } } as unknown as Event);
    expect(c.categorias[3].perfecto).toBe('no');
    expect(c.isFormValid()).toBe(true);
  });

  it('arma exactamente el cuerpo que espera el servidor', () => {
    const c = crear().componentInstance;
    llenarSinNovedades(c);
    const cuerpo = c.construirEnvio();
    expect(cuerpo).toMatchObject({
      conoceCampana: 'si', placaMoto: 'ABC12G', kilometraje: 0, elementosMalEstado: 'no',
      elementosNoCumplen: null, confirmaciones: { confirmacionInsegura: 'si', confirmacionInspeccion: 'si' }
    });
    expect(cuerpo.saludItems).toHaveLength(7);
  });

  it('al enviar muestra el resultado del servidor y limpia el formulario', async () => {
    const fixture = crear();
    const c = fixture.componentInstance;
    llenarSinNovedades(c);
    const p = c.onSubmit();
    http.expectOne({ method: 'POST', url: `${API}/preoperacionales` })
      .flush({ id: 1, placaMoto: 'ABC12G', fechaEnvio: '2026-10-16T08:00:00', aptoParaConducir: false, totalNoCumplen: 0 });
    await p;
    fixture.detectChanges();
    expect(c.ultimoEnvio?.id).toBe(1);
    expect(fixture.nativeElement.querySelector('.resultado-alerta')?.textContent).toContain('no debes conducir');
    expect(c.conoceCampana).toBe('');
  });

  it('si el servidor rechaza el envío conserva las respuestas para corregir', async () => {
    const c = crear().componentInstance;
    llenarSinNovedades(c);
    const p = c.onSubmit();
    http.expectOne(`${API}/preoperacionales`).flush({ error: 'Placa inválida' }, { status: 400, statusText: 'x' });
    await p;
    expect(c.ultimoEnvio).toBeNull();
    expect(c.conoceCampana).toBe('si');
  });

  it('no envía nada si faltan respuestas y muestra el resumen de pendientes', async () => {
    const fixture = crear();
    await fixture.componentInstance.onSubmit();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.pendientes')).not.toBeNull();
    http.expectNone(`${API}/preoperacionales`);
  });

  it('los radios con nombre dinámico tienen el atributo name en el HTML (navegación con flechas)', () => {
    const el: HTMLElement = crear().nativeElement;
    expect(el.querySelectorAll('input[name="chk_documentacion"]').length).toBe(2);
    expect(el.querySelectorAll('input[name="salud_0"]').length).toBe(2);
  });
});
