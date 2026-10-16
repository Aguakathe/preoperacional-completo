import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { FotosService } from '../../../services/fotos.service';
import { IconComponent } from '../../../shared/icon.component';
import { PageHeaderComponent } from '../../../shared/page-header.component';
import { FotosEstadoComponent } from './fotos-estado/fotos-estado.component';
import { GaleriaFotosComponent } from './galeria-fotos/galeria-fotos.component';
import { GastosMantenimientoComponent } from './gastos-mantenimiento/gastos-mantenimiento.component';

type SubPestana = 'fotos' | 'galeria' | 'gastos';

@Component({
    selector: 'app-mantenimientos',
    templateUrl: './mantenimientos.component.html',
    styleUrls: ['./mantenimientos.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [IconComponent, PageHeaderComponent, FotosEstadoComponent, GaleriaFotosComponent, GastosMantenimientoComponent]
})
export class MantenimientosComponent {
  /** Total de fotos guardadas: se muestra como contador vivo en la pestaña Galería. */
  readonly totalFotos = inject(FotosService).fotos;

  activeTab: SubPestana = 'fotos';

  /** Igual que en el dashboard: el sub-panel se crea al visitarlo y luego se conserva (no se pierden los datos escritos). */
  readonly visitadas = new Set<SubPestana>(['fotos']);

  readonly pestanas: { id: SubPestana; etiqueta: string; icono: string }[] = [
    { id: 'fotos', etiqueta: 'Fotos de estado', icono: 'camera' },
    { id: 'galeria', etiqueta: 'Galería', icono: 'images' },
    { id: 'gastos', etiqueta: 'Gastos de mantenimiento', icono: 'dollar' }
  ];

  setActiveTab(tab: SubPestana): void {
    this.activeTab = tab;
    this.visitadas.add(tab);
  }

  onTabKeydown(event: KeyboardEvent, indice: number): void {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const total = this.pestanas.length;
    const destino = (indice + (event.key === 'ArrowRight' ? 1 : total - 1)) % total;
    this.setActiveTab(this.pestanas[destino].id);
    (document.getElementById('subtab-' + this.pestanas[destino].id) as HTMLElement | null)?.focus();
  }
}
