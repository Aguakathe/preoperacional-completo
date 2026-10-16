import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { ADMIN, CONDUCTOR, conSesion, proveedoresDePrueba } from '../../../testing/ayudas';
import { Sesion } from '../../models/usuario';

describe('DashboardComponent', () => {
  async function crear(usuario: Sesion, seccion: string | null = null) {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        ...proveedoresDePrueba(),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(seccion ? { seccion } : {}) } } }
      ]
    }).compileComponents();
    await conSesion(usuario);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    // Las secciones piden sus datos al abrirse; aquí se responden vacías
    TestBed.inject(HttpTestingController).match(() => true).forEach(r => r.flush([]));
    return { fixture, navigate };
  }

  const pestanas = (el: HTMLElement) => Array.from(el.querySelectorAll('[role=tab]')).map(t => t.textContent?.trim());

  it('el admin ve la pestaña Usuarios', async () => {
    const { fixture } = await crear(ADMIN);
    expect(pestanas(fixture.nativeElement)).toEqual(['Preoperacional', 'Historial', 'Mantenimientos', 'Usuarios', 'Mi cuenta']);
  });

  it('un conductor no ve Usuarios ni puede abrirla aunque la pida en la URL', async () => {
    const { fixture } = await crear(CONDUCTOR, 'usuarios');
    expect(pestanas(fixture.nativeElement)).not.toContain('Usuarios');
    expect(fixture.componentInstance.activeTab).toBe('preoperacional');
  });

  it('abre la sección que viene en la URL (?seccion=historial) al recargar', async () => {
    const { fixture } = await crear(CONDUCTOR, 'historial');
    expect(fixture.componentInstance.activeTab).toBe('historial');
    expect(fixture.nativeElement.querySelector('#panel-historial:not([hidden]) app-historial')).not.toBeNull();
  });

  it('al cambiar de pestaña la guarda en la URL y conserva los paneles visitados', async () => {
    const { fixture, navigate } = await crear(ADMIN);
    fixture.componentInstance.setActiveTab('cuenta');
    fixture.detectChanges();
    expect(navigate).toHaveBeenCalledWith([], expect.objectContaining({ queryParams: { seccion: 'cuenta' }, replaceUrl: true }));
    // El preoperacional sigue montado (oculto): no se pierde lo escrito
    expect(fixture.nativeElement.querySelector('#panel-preoperacional[hidden] app-preoperacional')).not.toBeNull();
  });

  it('se navega entre pestañas con las flechas del teclado', async () => {
    const { fixture } = await crear(ADMIN);
    fixture.componentInstance.onTabKeydown(new KeyboardEvent('keydown', { key: 'ArrowLeft' }), 0);
    expect(fixture.componentInstance.activeTab).toBe('cuenta');
    fixture.componentInstance.onTabKeydown(new KeyboardEvent('keydown', { key: 'Home' }), 4);
    expect(fixture.componentInstance.activeTab).toBe('preoperacional');
  });
});
