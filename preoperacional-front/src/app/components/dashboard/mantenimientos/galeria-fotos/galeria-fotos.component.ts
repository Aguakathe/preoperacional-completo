import { Component, ChangeDetectionStrategy, ElementRef, computed, inject, signal } from '@angular/core';
import {
  CATEGORIAS_FOTO, CategoriaFotoId, FotoGuardada, MIME_FOTO_ID, contarPorCategoria, esCategoriaValida, iconoCategoria, nombreCategoria
} from '../../../../models/foto';
import { FotosService } from '../../../../services/fotos.service';
import { FeedbackService } from '../../../../shared/feedback.service';
import { fechaCorta, formatFileSize } from '../../../../shared/utils';
import { IconComponent } from '../../../../shared/icon.component';
import { PageHeaderComponent } from '../../../../shared/page-header.component';
import { CategoriasFotoComponent } from '../categorias-foto/categorias-foto.component';

/** Galería de fotos por categoría: la ven y filtran ambos roles. */
@Component({
    selector: 'app-galeria-fotos',
    templateUrl: './galeria-fotos.component.html',
    styleUrls: ['./galeria-fotos.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IconComponent, PageHeaderComponent, CategoriasFotoComponent]
})
export class GaleriaFotosComponent {
  private readonly fotosService = inject(FotosService);
  private readonly feedback = inject(FeedbackService);
  private readonly host: HTMLElement = inject(ElementRef).nativeElement;
  private focoPrevio: HTMLElement | null = null;

  readonly categorias = CATEGORIAS_FOTO;
  readonly nombreCategoria = nombreCategoria;
  readonly iconoCategoria = iconoCategoria;
  readonly formatFileSize = formatFileSize;
  readonly fechaCorta = fechaCorta;

  readonly cargando = this.fotosService.cargando;
  readonly error = this.fotosService.error;
  readonly categoriaFiltro = signal<CategoriaFotoId | null>(null);
  protected readonly inspeccionElegida = signal<number | 'todas'>('todas');
  protected readonly visorId = signal<number | null>(null);

  /** Inspecciones que tienen fotos, para el selector. */
  readonly inspecciones = computed(() => {
    const fotos = this.fotosService.fotos();
    const datos = new Map(this.fotosService.mantenimientos().map(m => [m.id, m]));
    const totales = new Map<number, number>();
    fotos.forEach(f => totales.set(f.mantenimientoId, (totales.get(f.mantenimientoId) ?? 0) + 1));
    return [...totales].map(([id, total]) => {
      const m = datos.get(id);
      return {
        id, total, datos: m ?? null,
        etiqueta: m ? `${m.placa} · ${fechaCorta(m.fechaInspeccion)} · ${m.inspector}` : 'Inspección sin datos'
      };
    });
  });

  /** Si la inspección elegida se queda sin fotos, se vuelve a "todas". */
  readonly inspeccionActiva = computed(() =>
    this.inspecciones().some(i => i.id === this.inspeccionElegida()) ? this.inspeccionElegida() : 'todas');

  private readonly fotosAlcance = computed(() => {
    const id = this.inspeccionActiva();
    const fotos = this.fotosService.fotos();
    return id === 'todas' ? fotos : fotos.filter(f => f.mantenimientoId === id);
  });

  /** Contadores en vivo del alcance elegido (no dependen del filtro de categoría). */
  readonly conteos = computed(() => contarPorCategoria(this.fotosAlcance()));
  readonly totalAlcance = computed(() => this.fotosAlcance().length);
  readonly totalGeneral = computed(() => this.fotosService.fotos().length);

  readonly vista = computed(() => {
    const filtro = this.categoriaFiltro();
    const placas = new Map(this.fotosService.mantenimientos().map(m => [m.id, m.placa]));
    return this.fotosAlcance()
      .filter(f => !filtro || f.categoria === filtro)
      .map(f => ({ foto: f, placa: placas.get(f.mantenimientoId) ?? '—', editable: this.fotosService.puedeEditar(f) }));
  });

  readonly indiceVisor = computed(() => this.vista().findIndex(v => v.foto.id === this.visorId()));
  readonly itemVisor = computed(() => this.vista()[this.indiceVisor()] ?? null);

  /** Inspección elegida en el selector (con sus datos), o null si se ven todas. */
  readonly inspeccionDetalle = computed(() => {
    const id = this.inspeccionActiva();
    return id === 'todas' ? null : this.inspecciones().find(i => i.id === id)?.datos ?? null;
  });

  protected cambiarInspeccion(event: Event): void {
    const valor = (event.target as HTMLSelectElement).value;
    this.inspeccionElegida.set(valor === 'todas' ? 'todas' : Number(valor));
  }

  protected reintentar(): void {
    void this.fotosService.recargar();
  }

  protected puedeEditarInspeccion(m: { creadoPor: string }): boolean {
    return this.fotosService.puedeEditar(m);
  }

  /** Borra la inspección elegida con todas sus fotos. */
  protected async eliminarInspeccion(m: { id: number; placa: string; fechaInspeccion: string; fotoIds: number[] }): Promise<void> {
    const n = this.fotosService.fotos().filter(f => f.mantenimientoId === m.id).length;
    const ok = await this.feedback.confirm({
      title: 'Eliminar inspección',
      message: `Se eliminará la inspección de ${m.placa} del ${fechaCorta(m.fechaInspeccion)} con sus ${n} ${n === 1 ? 'foto' : 'fotos'}. Esta acción no se puede deshacer.`,
      confirmText: 'Sí, eliminar',
      danger: true
    });
    if (!ok) return;
    const r = await this.fotosService.eliminarInspeccion(m.id);
    if (r.ok) {
      this.inspeccionElegida.set('todas');
      this.feedback.info('Inspección eliminada');
    } else {
      this.feedback.error(r.error ?? 'No se pudo eliminar la inspección.');
    }
  }

  protected async alElegirCategoria(foto: FotoGuardada, event: Event): Promise<void> {
    const select = event.target as HTMLSelectElement;
    const ok = await this.mover(foto.id, select.value);
    if (!ok) select.value = foto.categoria;
  }

  protected alSoltarEnCategoria(e: { categoria: CategoriaFotoId; fotoId: string }): void {
    void this.mover(Number(e.fotoId), e.categoria);
  }

  private async mover(fotoId: number, categoria: string): Promise<boolean> {
    if (!esCategoriaValida(categoria)) return false;
    const r = await this.fotosService.cambiarCategoria(fotoId, categoria);
    if (!r.ok) {
      this.feedback.error(r.error ?? 'No se pudo mover la foto.');
      return false;
    }
    this.feedback.info(`Foto movida a ${nombreCategoria(categoria)}`);
    return true;
  }

  protected async eliminar(foto: FotoGuardada): Promise<void> {
    const ok = await this.feedback.confirm({
      title: 'Eliminar foto',
      message: `Se eliminará ${foto.nombre} de forma permanente.`,
      confirmText: 'Sí, eliminar',
      danger: true
    });
    if (!ok) return;
    if (this.visorId() === foto.id) this.cerrarVisor();
    const r = await this.fotosService.eliminar(foto.id);
    if (!r.ok) this.feedback.error(r.error ?? 'No se pudo eliminar la foto.');
  }

  protected alArrastrar(event: DragEvent, foto: FotoGuardada): void {
    event.dataTransfer?.setData(MIME_FOTO_ID, String(foto.id));
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  // ---- Visor ampliado ----
  protected abrirVisor(foto: FotoGuardada): void {
    this.focoPrevio = document.activeElement as HTMLElement | null;
    this.visorId.set(foto.id);
    setTimeout(() => this.host.querySelector<HTMLElement>('.visor-cerrar')?.focus());
  }

  protected cerrarVisor(): void {
    this.visorId.set(null);
    this.focoPrevio?.focus?.();
    this.focoPrevio = null;
  }

  protected navegarVisor(paso: number): void {
    const lista = this.vista();
    if (lista.length < 2) return;
    const i = (this.indiceVisor() + paso + lista.length) % lista.length;
    this.visorId.set(lista[i].foto.id);
  }

  protected teclasVisor(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault();
      this.cerrarVisor();
    } else if (e.key === 'ArrowRight') {
      this.navegarVisor(1);
    } else if (e.key === 'ArrowLeft') {
      this.navegarVisor(-1);
    } else if (e.key === 'Tab') {
      const focables = Array.from(this.host.querySelectorAll<HTMLElement>('.visor button:not([disabled]), .visor select'));
      if (focables.length === 0) return;
      const primero = focables[0];
      const ultimo = focables[focables.length - 1];
      const activo = document.activeElement;
      if (e.shiftKey && activo === primero) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && activo === ultimo) { e.preventDefault(); primero.focus(); }
    }
  }
}
