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
    <header class="page-header" [class.page-header-sub]="nivel() === 3">
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
    /* Subsección (nivel 3): más liviano, para no repetir el mismo peso visual del encabezado principal */
    .page-header-sub { gap: .75rem; margin-bottom: 1.1rem; padding-bottom: .9rem; border-bottom: 1px dashed var(--c-border-strong); }
    .page-header-sub .badge-icon {
      width: 40px; height: 40px; font-size: 1.25rem; border-radius: var(--radius-sm);
      background: var(--c-primary-50); color: var(--c-primary-600); box-shadow: inset 0 0 0 1px var(--c-primary-100);
    }
    .page-header-sub .page-title { font-size: 1.12rem; font-weight: 700; color: var(--c-primary); }
    .page-header-sub .page-subtitle { font-size: .88rem; }
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