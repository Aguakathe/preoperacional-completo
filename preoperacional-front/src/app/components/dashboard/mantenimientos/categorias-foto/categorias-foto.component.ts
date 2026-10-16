import { Component, ChangeDetectionStrategy, computed, input, model, output, signal } from '@angular/core';
import { CATEGORIAS_FOTO, CategoriaFotoId, ConteoCategorias, MIME_FOTO_ID } from '../../../../models/foto';
import { IconComponent } from '../../../../shared/icon.component';

/**
 * Panel de las 8 categorías de foto con contador en vivo.
 * - modo "filtro": un clic filtra (otro clic quita el filtro).
 * - modo "destino": un clic elige dónde caerán las próximas fotos (siempre hay una elegida).
 * En ambos modos se puede soltar sobre una categoría: archivos del equipo (se suben ahí) o una foto
 * ya cargada (se reasigna). En móvil, el selector de cada foto cubre el mismo caso.
 */
@Component({
    selector: 'app-categorias-foto',
    templateUrl: './categorias-foto.component.html',
    styleUrls: ['./categorias-foto.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IconComponent]
})
export class CategoriasFotoComponent {
  readonly conteos = input.required<ConteoCategorias>();
  readonly seleccion = model<CategoriaFotoId | null>(null);
  readonly titulo = input('Categorías de fotos');
  readonly ayuda = input('');
  readonly modo = input<'filtro' | 'destino'>('filtro');

  readonly archivosSoltados = output<{ categoria: CategoriaFotoId; archivos: FileList }>();
  readonly fotoSoltada = output<{ categoria: CategoriaFotoId; fotoId: string }>();

  readonly categorias = CATEGORIAS_FOTO;
  readonly total = computed(() => Object.values(this.conteos()).reduce((a, b) => a + b, 0));
  readonly maximo = computed(() => Math.max(1, ...Object.values(this.conteos())));
  protected readonly sobre = signal<CategoriaFotoId | null>(null);

  protected elegir(id: CategoriaFotoId): void {
    this.seleccion.set(this.modo() === 'filtro' && this.seleccion() === id ? null : id);
  }

  protected etiqueta(nombre: string, n: number): string {
    return `${nombre}: ${n} ${n === 1 ? 'foto' : 'fotos'}`;
  }

  protected alArrastrar(e: DragEvent, id: CategoriaFotoId): void {
    const tipos = Array.from(e.dataTransfer?.types ?? []);
    if (!tipos.includes('Files') && !tipos.includes(MIME_FOTO_ID)) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = tipos.includes('Files') ? 'copy' : 'move';
    this.sobre.set(id);
  }

  protected alSoltar(e: DragEvent, id: CategoriaFotoId): void {
    e.preventDefault();
    this.sobre.set(null);
    const archivos = e.dataTransfer?.files;
    if (archivos && archivos.length > 0) {
      this.archivosSoltados.emit({ categoria: id, archivos });
      return;
    }
    const fotoId = e.dataTransfer?.getData(MIME_FOTO_ID);
    if (fotoId) this.fotoSoltada.emit({ categoria: id, fotoId });
  }
}
