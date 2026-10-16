import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { PlacaDirective, normalizarPlaca } from './placa.directive';

@Component({
  imports: [ReactiveFormsModule, PlacaDirective],
  template: `<input appPlaca [formControl]="placa">`
})
class Anfitrion {
  placa = new FormControl('');
}

describe('PlacaDirective', () => {
  it('normaliza: mayúsculas, sin símbolos y máximo 6 caracteres', () => {
    expect(normalizarPlaca('abc-12 g')).toBe('ABC12G');
    expect(normalizarPlaca('abc12gxyz')).toBe('ABC12G');
    expect(normalizarPlaca('')).toBe('');
  });

  it('actualiza el campo y el control del formulario al escribir', () => {
    const fixture = TestBed.createComponent(Anfitrion);
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.value = 'xyz 98a';
    input.dispatchEvent(new Event('input'));
    expect(input.value).toBe('XYZ98A');
    expect(fixture.componentInstance.placa.value).toBe('XYZ98A');
    expect(input.classList).toContain('placa');
    expect(input.getAttribute('maxlength')).toBe('6');
  });
});
