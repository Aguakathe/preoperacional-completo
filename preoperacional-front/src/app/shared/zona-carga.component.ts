import { Component, ChangeDetectionStrategy, ElementRef, input, output, signal, viewChild } from '@angular/core';
import { IconComponent } from './icon.component';

/**
 * Zona para subir archivos: clic, teclado (Enter / Espacio) o arrastrar y soltar.
 * Antes estaba duplicada (HTML + TS + CSS) en "Fotos de estado" y en "Gastos".
 * Emite los archivos elegidos; la validación (tipo, tamaño, cantidad) la hace quien la usa.
 * Lo que se proyecte dentro se muestra bajo el título (ej. la categoría de destino).
 */
@Component({
  selector: 'app-zona-carga',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="zona" role="button" tabindex="0"
      [attr.aria-label]="titulo() + ': arrastra los archivos aquí o presiona Enter para seleccionarlos'"
      [class.encima]="encima()"
      (click)="abrir()"
      (keydown.enter)="abrir()"
      (keydown.space)="$event.preventDefault(); abrir()"
      (dragover)="alArrastrar($event)" (dragleave)="encima.set(false)" (drop)="alSoltar($event)">
      <app-icon name="upload" class="icono" />
      <p class="titulo">Arrastra {{ objeto() }} aquí o <span class="link">haz clic para seleccionar</span></p>
      <ng-content />
      <p class="ayuda">{{ ayuda() }}</p>
    </div>
    <!-- Fuera de la zona clicable para que el clic programático no se propague de vuelta a ella -->
    <input #entrada type="file" class="sr-only" tabindex="-1" aria-hidden="true"
      [attr.accept]="accept()" [multiple]="multiple()" (change)="alElegir($event)">
  `,
  styles: [`
    :host { display: block; }
    .zona {
      display: flex; flex-direction: column; align-items: center; gap: .35rem; text-align: center;
      padding: 1.75rem 1rem; cursor: pointer;
      background: var(--c-primary-50); border: 2px dashed var(--c-primary-600); border-radius: var(--radius);
      transition: background-color .15s, border-color .15s, transform .15s;
    }
    .zona:hover, .zona.encima { background: var(--c-primary-100); border-color: var(--c-primary); }
    .zona.encima { transform: scale(1.01); }
    .icono { font-size: 2.1rem; color: var(--c-primary); }
    .titulo { font-weight: 600; }
    .link { color: var(--c-primary); text-decoration: underline; }
    .ayuda { color: var(--c-text-muted); font-size: .86rem; }
  `]
})
export class ZonaCargaComponent {
  readonly titulo = input('Subir archivos');
  /** Qué se sube, para el texto: "las fotos", "los documentos"... */
  readonly objeto = input('los archivos');
  readonly ayuda = input('');
  readonly accept = input('');
  readonly multiple = input(true);
  readonly archivos = output<FileList>();

  protected readonly encima = signal(false);
  private readonly entrada = viewChild.required<ElementRef<HTMLInputElement>>('entrada');

  abrir(): void {
    this.entrada().nativeElement.click();
  }

  protected alElegir(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.archivos.emit(input.files);
    }
    input.value = ''; // permite volver a elegir el mismo archivo después de quitarlo
  }

  protected alArrastrar(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.encima.set(true);
  }

  protected alSoltar(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.encima.set(false);
    const archivos = event.dataTransfer?.files;
    if (archivos && archivos.length > 0) {
      this.archivos.emit(archivos);
    }
  }
}
