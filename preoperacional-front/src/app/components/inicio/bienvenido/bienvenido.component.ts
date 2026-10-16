import { Component, ChangeDetectionStrategy } from '@angular/core';
import { IconComponent } from '../../../shared/icon.component';
import { RouterLink } from '@angular/router';

@Component({
    selector: 'app-bienvenido',
    templateUrl: './bienvenido.component.html',
    styleUrls: ['./bienvenido.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [IconComponent, RouterLink]
})
export class BienvenidoComponent {
  /** Puntos clave de la plataforma (se muestran como lista en la portada). */
  readonly funciones = [
    { icono: 'clipboard', texto: 'Preoperacional diario de la moto' },
    { icono: 'history', texto: 'Historial de inspecciones y alertas de seguridad' },
    { icono: 'camera', texto: 'Fotos del estado, ordenadas por categoría' },
    { icono: 'dollar', texto: 'Control de gastos y soportes de mantenimiento' }
  ];
}
