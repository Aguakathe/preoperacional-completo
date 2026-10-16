import { Routes } from '@angular/router';
import { InicioComponent } from './components/inicio/inicio.component';
import { BienvenidoComponent } from './components/inicio/bienvenido/bienvenido.component';
import { LoginComponent } from './components/inicio/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { authGuard, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/inicio', pathMatch: 'full' },
  {
    path: 'inicio',
    component: InicioComponent,
    children: [
      { path: '', component: BienvenidoComponent, title: 'NCR Atleos · Bienvenido' },
      { path: 'login', component: LoginComponent, canActivate: [guestGuard], title: 'NCR Atleos · Iniciar sesión' }
    ]
  },
  // El panel maneja sus secciones con pestañas; la sección activa queda en la URL (?seccion=historial)
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard], title: 'NCR Atleos · Panel' },
  { path: '**', redirectTo: '/inicio' }
];
