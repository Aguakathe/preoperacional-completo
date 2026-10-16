import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { IconComponent } from './icon.component';

/**
 * Encabezado de página uniforme en todo el panel: ícono, título y subtítulo.
 * `nivel` define el encabezado HTML (2 = sección principal, 3 = subsección) para mantener
 * una jerarquía correcta para lectores de pantalla. Lo que se proyecte dentro va a la derecha (acciones).
 */
@Component({
  selector: 'app-page-header',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-header">
      <div class="badge-icon" aria-hidden="true"><app-icon [name]="icono()" /></div>
      <div class="textos">
        @if (nivel() === 2) {
          <h2 class="page-title" [id]="tituloId()">{{ titulo() }}</h2>
        } @else {
          <h3 class="page-title" [id]="tituloId()">{{ titulo() }}</h3>
        }
        @if (subtitulo()) { <p class="page-subtitle">{{ subtitulo() }}</p> }
      </div>
      <div class="acciones"><ng-content /></div>
    </header>
  `,
  styles: [`
    :host { display: block; }
    .textos { flex: 1; min-width: 0; }
    .acciones { display: flex; flex-wrap: wrap; gap: .5rem; }
    .acciones:empty { display: none; }
    @media (max-width: 640px) { .page-header { flex-wrap: wrap; } .acciones { width: 100%; } }
  `]
})
export class PageHeaderComponent {
  readonly icono = input.required<string>();
  readonly titulo = input.required<string>();
  readonly subtitulo = input('');
  readonly nivel = input<2 | 3>(2);
  readonly tituloId = input<string | null>(null);
}
