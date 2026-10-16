import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AppComponent], providers: [provideRouter([])] }).compileComponents();
  });

  it('pinta el router-outlet, el enlace para saltar al contenido y el contenedor de avisos', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('router-outlet')).not.toBeNull();
    expect(el.querySelector('.skip-link')?.textContent).toContain('Saltar al contenido');
    expect(el.querySelector('app-feedback-host')).not.toBeNull();
  });
});
