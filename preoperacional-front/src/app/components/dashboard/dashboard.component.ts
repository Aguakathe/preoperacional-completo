import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { IconComponent } from '../../shared/icon.component';
import { NavbarComponent } from './navbar/navbar.component';
import { PreoperacionalComponent } from './preoperacional/preoperacional.component';
import { HistorialComponent } from './historial/historial.component';
import { MantenimientosComponent } from './mantenimientos/mantenimientos.component';
import { UsuariosComponent } from './usuarios/usuarios.component';
import { CambiarPasswordComponent } from './cambiar-password/cambiar-password.component';

export type Pestana = 'preoperacional' | 'historial' | 'mantenimientos' | 'usuarios' | 'cuenta';

interface PestanaDef {
  id: Pestana;
  etiqueta: string;
  icono: string;
  soloAdmin?: boolean;
}

const PESTANAS: PestanaDef[] = [
  { id: 'preoperacional', etiqueta: 'Preoperacional', icono: 'clipboard' },
  { id: 'historial', etiqueta: 'Historial', icono: 'history' },
  { id: 'mantenimientos', etiqueta: 'Mantenimientos', icono: 'wrench' },
  { id: 'usuarios', etiqueta: 'Usuarios', icono: 'users', soloAdmin: true },
  { id: 'cuenta', etiqueta: 'Mi cuenta', icono: 'user' }
];

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    NavbarComponent, IconComponent, PreoperacionalComponent, HistorialComponent,
    MantenimientosComponent, UsuariosComponent, CambiarPasswordComponent
  ]
})
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // El acceso al panel lo protege authGuard en las rutas.
  readonly isAdmin = this.authService.isAdmin();
  readonly pestanas = PESTANAS.filter(p => !p.soloAdmin || this.isAdmin);
  activeTab: Pestana = 'preoperacional';

  /**
   * Un panel, una vez abierto, se conserva oculto: lo escrito en el preoperacional (≈40 campos) no se
   * pierde por mirar otra sección. Carga perezosa: no se crea hasta la primera visita.
   */
  readonly visitadas = new Set<Pestana>();

  ngOnInit(): void {
    // La sección activa viaja en la URL (?seccion=historial): recargar la página no te devuelve al inicio
    const pedida = this.route.snapshot.queryParamMap.get('seccion');
    this.setActiveTab(this.esValida(pedida) ? pedida : 'preoperacional', false);
  }

  setActiveTab(tab: Pestana, actualizarUrl = true): void {
    if (!this.esValida(tab)) return; // "Usuarios" solo existe para admin
    this.activeTab = tab;
    this.visitadas.add(tab);
    if (actualizarUrl) {
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { seccion: tab === 'preoperacional' ? null : tab },
        replaceUrl: true
      });
    }
  }

  /** Navegación con flechas / Inicio / Fin entre pestañas (patrón WAI-ARIA Tabs). */
  onTabKeydown(event: KeyboardEvent, indice: number): void {
    const total = this.pestanas.length;
    let destino: number;
    switch (event.key) {
      case 'ArrowRight': destino = (indice + 1) % total; break;
      case 'ArrowLeft': destino = (indice - 1 + total) % total; break;
      case 'Home': destino = 0; break;
      case 'End': destino = total - 1; break;
      default: return;
    }
    event.preventDefault();
    this.setActiveTab(this.pestanas[destino].id);
    document.getElementById('tab-' + this.pestanas[destino].id)?.focus();
  }

  private esValida(tab: string | null): tab is Pestana {
    return this.pestanas.some(p => p.id === tab);
  }
}
