import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { BienvenidoComponent } from './bienvenido.component';

describe('BienvenidoComponent', () => {
  it('presenta las funciones de la plataforma y enlaza al login', async () => {
    await TestBed.configureTestingModule({ imports: [BienvenidoComponent], providers: [provideRouter([])] }).compileComponents();
    const fixture = TestBed.createComponent(BienvenidoComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelectorAll('.features li').length).toBe(4);
    expect(el.textContent).toContain('Historial');
    expect(el.querySelector('a.cta')?.getAttribute('href')).toBe('/inicio/login');
  });
});
