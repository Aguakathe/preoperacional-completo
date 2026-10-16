import { TestBed } from '@angular/core/testing';
import { conteoVacio } from '../../../../models/foto';
import { CategoriasFotoComponent } from './categorias-foto.component';

describe('CategoriasFotoComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CategoriasFotoComponent] }).compileComponents();
  });

  function crear(modo: 'filtro' | 'destino' = 'filtro') {
    const fixture = TestBed.createComponent(CategoriasFotoComponent);
    fixture.componentRef.setInput('conteos', { ...conteoVacio(), motor: 3, frenos: 1 });
    fixture.componentRef.setInput('modo', modo);
    fixture.detectChanges();
    return fixture;
  }

  it('muestra exactamente las 8 categorías con su contador', () => {
    const el: HTMLElement = crear().nativeElement;
    const tiles = el.querySelectorAll('.tile');
    expect(tiles.length).toBe(8);
    expect(el.querySelector('.total')?.textContent).toContain('4');
    expect(tiles[1].getAttribute('aria-label')).toBe('Motor: 3 fotos');
  });

  it('en modo filtro un segundo clic quita el filtro', () => {
    const fixture = crear();
    const tile = fixture.nativeElement.querySelectorAll('.tile')[1] as HTMLButtonElement;
    tile.click();
    expect(fixture.componentInstance.seleccion()).toBe('motor');
    tile.click();
    expect(fixture.componentInstance.seleccion()).toBeNull();
  });

  it('en modo destino siempre queda una categoría elegida', () => {
    const fixture = crear('destino');
    const tile = fixture.nativeElement.querySelectorAll('.tile')[3] as HTMLButtonElement;
    tile.click();
    tile.click();
    expect(fixture.componentInstance.seleccion()).toBe('frenos');
  });
});
