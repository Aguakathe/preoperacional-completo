import { Directive, ElementRef, HostListener, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * Campo de placa: siempre en MAYÚSCULAS, sin espacios ni símbolos y con máximo 6 caracteres.
 * Uso: <input appPlaca formControlName="placa">
 * Reemplaza el método onPlacaInput() que estaba copiado en tres componentes.
 */
@Directive({
  selector: 'input[appPlaca]',
  host: {
    class: 'placa',
    maxlength: '6',
    autocomplete: 'off',
    autocapitalize: 'characters',
    spellcheck: 'false'
  }
})
export class PlacaDirective {
  private readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef);
  private readonly control = inject(NgControl, { optional: true, self: true });

  @HostListener('input')
  normalizar(): void {
    const input = this.el.nativeElement;
    const limpio = normalizarPlaca(input.value);
    if (input.value !== limpio) {
      input.value = limpio;
    }
    this.control?.control?.setValue(limpio, { emitEvent: true });
  }
}

export function normalizarPlaca(valor: string): string {
  return (valor ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}
