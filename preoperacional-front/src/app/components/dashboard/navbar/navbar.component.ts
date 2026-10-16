import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
import { AuthService } from '../../../services/auth.service';
import { IconComponent } from '../../../shared/icon.component';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent]
})
export class NavbarComponent {
  private readonly authService = inject(AuthService);

  readonly usuario = this.authService.usuario;
  readonly nombre = this.authService.nombreVisible;
  readonly esAdmin = this.authService.esAdmin;
  /** Inicial para el avatar. */
  readonly inicial = computed(() => (this.nombre() || '?').charAt(0).toUpperCase());
  saliendo = false;

  async logout(): Promise<void> {
    this.saliendo = true;
    await this.authService.logout();
  }
}
