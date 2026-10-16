import { Component, ChangeDetectionStrategy, computed, input } from '@angular/core';
import { ETIQUETAS_FORTALEZA, nivelFortaleza } from './utils';

/**
 * Indicador orientativo de la seguridad de una contraseña (4 barras + etiqueta).
 * Antes estaba copiado, con su CSS, en el login y en "Cambiar contraseña".
 * Solo guía: no bloquea el envío.
 */
@Component({
  selector: 'app-fuerza-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fuerza" [attr.data-nivel]="nivel()" aria-live="polite">
      <span class="barras" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
      @if (nivel() > 0) { <span>Seguridad: {{ etiqueta() }}</span> }
    </div>
  `,
  styles: [`
    .fuerza { display: flex; align-items: center; gap: .6rem; min-height: 1.15rem; font-size: .8rem; color: var(--c-text-muted); }
    .barras { display: inline-grid; grid-template-columns: repeat(4, 28px); gap: 4px; }
    .barras i { height: 5px; border-radius: 3px; background: var(--c-border); transition: background-color .2s; }
    .fuerza[data-nivel='1'] i:nth-child(-n+1) { background: var(--c-danger); }
    .fuerza[data-nivel='2'] i:nth-child(-n+2) { background: #d98a00; }
    .fuerza[data-nivel='3'] i:nth-child(-n+3) { background: #5aa300; }
    .fuerza[data-nivel='4'] i:nth-child(-n+4) { background: var(--c-success); }
  `]
})
export class FuerzaPasswordComponent {
  readonly password = input('');
  protected readonly nivel = computed(() => nivelFortaleza(this.password()));
  protected readonly etiqueta = computed(() => ETIQUETAS_FORTALEZA[this.nivel()]);
}
