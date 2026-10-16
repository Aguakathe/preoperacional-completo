import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { InicioComponent } from './inicio.component';

describe('InicioComponent', () => {
  it('es el contenedor de la zona pública con su propio router-outlet', async () => {
    await TestBed.configureTestingModule({ imports: [InicioComponent], providers: [provideRouter([])] }).compileComponents();
    const fixture = TestBed.createComponent(InicioComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('main#contenido router-outlet')).not.toBeNull();
  });
});
