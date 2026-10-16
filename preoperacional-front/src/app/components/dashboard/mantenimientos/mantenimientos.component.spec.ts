import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { MantenimientosComponent } from './mantenimientos.component';
import { CONDUCTOR, conSesion, proveedoresDePrueba } from '../../../../testing/ayudas';

describe('MantenimientosComponent', () => {
  it('tiene 3 subsecciones y crea cada una solo al visitarla', async () => {
    await TestBed.configureTestingModule({ imports: [MantenimientosComponent], providers: proveedoresDePrueba() }).compileComponents();
    await conSesion(CONDUCTOR);
    const fixture = TestBed.createComponent(MantenimientosComponent);
    fixture.detectChanges();
    TestBed.inject(HttpTestingController).match(() => true).forEach(r => r.flush([]));
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelectorAll('[role=tab]').length).toBe(3);
    expect(el.querySelector('app-fotos-estado')).not.toBeNull();
    expect(el.querySelector('app-gastos-mantenimiento')).toBeNull();

    fixture.componentInstance.setActiveTab('gastos');
    fixture.detectChanges();
    TestBed.inject(HttpTestingController).match(() => true).forEach(r => r.flush([]));
    expect(el.querySelector('#subpanel-gastos:not([hidden]) app-gastos-mantenimiento')).not.toBeNull();
    expect(el.querySelector('#subpanel-fotos[hidden]')).not.toBeNull();
  });
});
