import { Component, ChangeDetectionStrategy, ElementRef, computed, effect, inject, signal, untracked } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { PreoperacionalService } from '../../../services/preoperacional.service';
import { mensajeError } from '../../../services/api';
import { FeedbackService } from '../../../shared/feedback.service';
import { IconComponent } from '../../../shared/icon.component';
import { PageHeaderComponent } from '../../../shared/page-header.component';
import { PlacaDirective } from '../../../shared/placa.directive';
import { fechaHora, hoyLocal } from '../../../shared/utils';
import { CATEGORIAS_PREOPERACIONAL, Preoperacional } from '../../../models/preoperacional';

/**
 * Historial de preoperacionales enviados.
 * Usuario: ve los suyos. Admin: ve los de todos, con quién los registró, y puede eliminarlos.
 */
@Component({
  selector: 'app-historial',
  templateUrl: './historial.component.html',
  styleUrls: ['./historial.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DecimalPipe, IconComponent, PageHeaderComponent, PlacaDirective]
})
export class HistorialComponent {
  private readonly servicio = inject(PreoperacionalService);
  private readonly feedback = inject(FeedbackService);
  private readonly fb = inject(FormBuilder);
  private readonly host: HTMLElement = inject(ElementRef).nativeElement;
  private focoPrevio: HTMLElement | null = null;

  readonly esAdmin = inject(AuthService).esAdmin;
  readonly hoy = hoyLocal();
  readonly fechaHora = fechaHora;
  readonly categorias = CATEGORIAS_PREOPERACIONAL;
  readonly etiquetasChequeo: Record<string, string> = { buen_estado: 'Buen estado', mal_estado: 'Mal estado' };

  readonly filtros = this.fb.nonNullable.group({ placa: '', desde: '', hasta: '' });

  readonly registros = signal<Preoperacional[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly filtrado = signal(false);

  readonly total = computed(() => this.registros().length);
  readonly noAptos = computed(() => this.registros().filter(r => !r.aptoParaConducir).length);
  readonly conNovedades = computed(() => this.registros().filter(r => r.totalNoCumplen > 0).length);

  /** Detalle abierto en el diálogo. */
  readonly detalle = signal<Preoperacional | null>(null);
  readonly cargandoDetalle = signal<number | null>(null);

  constructor() {
    // Se carga al abrir la pestaña y cada vez que se envía o elimina un preoperacional
    effect(() => {
      this.servicio.version();
      untracked(() => void this.cargar());
    });
  }

  async cargar(): Promise<void> {
    const { placa, desde, hasta } = this.filtros.getRawValue();
    if (desde && hasta && desde > hasta) {
      this.feedback.error('La fecha «desde» no puede ser posterior a «hasta».');
      return;
    }
    this.cargando.set(true);
    this.error.set(null);
    try {
      this.registros.set(await this.servicio.listar({ placa, desde, hasta }));
      this.filtrado.set(!!(placa || desde || hasta));
    } catch (e) {
      this.error.set(mensajeError(e, 'No se pudo cargar el historial'));
    } finally {
      this.cargando.set(false);
    }
  }

  limpiarFiltros(): void {
    this.filtros.reset();
    void this.cargar();
  }

  async abrir(r: Preoperacional): Promise<void> {
    this.focoPrevio = document.activeElement as HTMLElement | null;
    this.cargandoDetalle.set(r.id);
    try {
      this.detalle.set(await this.servicio.detalle(r.id));
      setTimeout(() => this.host.querySelector<HTMLElement>('.modal-cerrar')?.focus());
    } catch (e) {
      this.feedback.error(mensajeError(e, 'No se pudo abrir el registro'));
    } finally {
      this.cargandoDetalle.set(null);
    }
  }

  cerrar(): void {
    this.detalle.set(null);
    this.focoPrevio?.focus?.();
    this.focoPrevio = null;
  }

  async eliminar(r: Preoperacional): Promise<void> {
    const ok = await this.feedback.confirm({
      title: 'Eliminar preoperacional',
      message: `Se eliminará el registro de ${r.nombreCompleto} (${r.placaMoto}) del ${fechaHora(r.fechaEnvio)}. Esta acción no se puede deshacer.`,
      confirmText: 'Sí, eliminar',
      danger: true
    });
    if (!ok) return;
    const resultado = await this.servicio.eliminar(r.id);
    if (resultado.ok) {
      this.feedback.info('Registro eliminado');
      if (this.detalle()?.id === r.id) this.cerrar();
    } else {
      this.feedback.error(resultado.error ?? 'No se pudo eliminar el registro');
    }
  }

  elementosDe(p: Preoperacional, clave: string): string[] {
    return p.elementosNoCumplen?.[clave as keyof typeof p.elementosNoCumplen]?.elementos ?? [];
  }

  teclasModal(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault();
      this.cerrar();
    } else if (e.key === 'Tab') {
      const focables = Array.from(this.host.querySelectorAll<HTMLElement>('.modal button:not([disabled])'));
      if (focables.length === 0) return;
      const [primero, ultimo] = [focables[0], focables[focables.length - 1]];
      if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
    }
  }
}
