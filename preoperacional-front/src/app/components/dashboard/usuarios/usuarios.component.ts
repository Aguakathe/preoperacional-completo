import { Component, ChangeDetectionStrategy, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { UsuariosService } from '../../../services/usuarios.service';
import { mensajeError } from '../../../services/api';
import { FeedbackService } from '../../../shared/feedback.service';
import { IconComponent } from '../../../shared/icon.component';
import { PageHeaderComponent } from '../../../shared/page-header.component';
import { FuerzaPasswordComponent } from '../../../shared/fuerza-password.component';
import { CambiosUsuario, PASSWORD_MIN, Rol, UsuarioListado } from '../../../models/usuario';

/**
 * Administración de usuarios (solo admin): crear, activar/desactivar, cambiar rol y restablecer contraseña.
 * El servidor impide quedarse sin administradores activos y que el admin se desactive a sí mismo.
 */
@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DatePipe, IconComponent, PageHeaderComponent, FuerzaPasswordComponent]
})
export class UsuariosComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly servicio = inject(UsuariosService);
  private readonly feedback = inject(FeedbackService);
  readonly yo = inject(AuthService).usuario;
  readonly passwordMin = PASSWORD_MIN;

  readonly form = this.fb.nonNullable.group(
    {
      username: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9._-]+$/), Validators.maxLength(60)]],
      nombre: ['', Validators.maxLength(120)],
      rol: ['usuario' as Rol],
      password: ['', [Validators.required, Validators.minLength(PASSWORD_MIN)]],
      confirmPassword: ['', Validators.required]
    },
    { validators: UsuariosComponent.passwordsIguales }
  );

  readonly usuarios = signal<UsuarioListado[]>([]);
  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly creando = signal(false);
  /** Id del usuario con una acción en curso (deshabilita sus botones). */
  readonly ocupado = signal<number | null>(null);
  /** Id del usuario al que se le está restableciendo la contraseña (muestra el campo). */
  readonly restableciendo = signal<number | null>(null);
  readonly activos = computed(() => this.usuarios().filter(u => u.estado).length);

  showPassword = false;

  ngOnInit(): void {
    void this.cargar();
  }

  async cargar(): Promise<void> {
    this.cargando.set(true);
    this.error.set(null);
    try {
      this.usuarios.set(await this.servicio.listar());
    } catch (e) {
      this.error.set(mensajeError(e, 'No se pudo cargar la lista de usuarios'));
    } finally {
      this.cargando.set(false);
    }
  }

  mostrarError(campo: 'username' | 'password'): boolean {
    const c = this.form.controls[campo];
    return c.invalid && (c.touched || c.dirty);
  }

  mostrarErrorConfirmacion(): boolean {
    const c = this.form.controls.confirmPassword;
    return (c.touched || c.dirty) && (c.hasError('required') || this.form.hasError('notSame'));
  }

  async crear(): Promise<void> {
    if (this.creando()) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { username, nombre, rol, password } = this.form.getRawValue();
    this.creando.set(true);
    try {
      const r = await this.servicio.crear({ username: username.trim(), nombre: nombre.trim() || undefined, rol, password });
      if (!r.ok || !r.usuario) {
        this.feedback.error(r.error ?? 'No se pudo crear el usuario');
        return;
      }
      this.usuarios.update(l => [...l, r.usuario!].sort((a, b) => a.username.localeCompare(b.username)));
      this.feedback.success(`Usuario «${r.usuario.username}» creado`);
      this.form.reset({ rol: 'usuario' });
      this.showPassword = false;
    } finally {
      this.creando.set(false);
    }
  }

  esYo(u: UsuarioListado): boolean {
    return u.id === this.yo()?.id;
  }

  async cambiarEstado(u: UsuarioListado): Promise<void> {
    const activar = !u.estado;
    if (!activar) {
      const ok = await this.feedback.confirm({
        title: 'Desactivar usuario',
        message: `«${u.username}» no podrá iniciar sesión hasta que lo vuelvas a activar. Sus registros se conservan.`,
        confirmText: 'Desactivar',
        danger: true
      });
      if (!ok) return;
    }
    await this.aplicar(u, { idUsuario: u.id, estado: activar }, activar ? 'Usuario activado' : 'Usuario desactivado');
  }

  async cambiarRol(u: UsuarioListado, event: Event): Promise<void> {
    const select = event.target as HTMLSelectElement;
    const rol = select.value as Rol;
    const ok = await this.aplicar(u, { idUsuario: u.id, rol },
      rol === 'admin' ? `«${u.username}» ahora es administrador` : `«${u.username}» ahora es usuario`);
    if (!ok) select.value = u.rol;
  }

  async restablecer(u: UsuarioListado, campo: HTMLInputElement): Promise<void> {
    const password = campo.value;
    if (password.length < PASSWORD_MIN) {
      this.feedback.error(`La contraseña debe tener mínimo ${PASSWORD_MIN} caracteres`);
      campo.focus();
      return;
    }
    if (await this.aplicar(u, { idUsuario: u.id, password }, `Contraseña de «${u.username}» restablecida. Compártela de forma segura.`)) {
      this.restableciendo.set(null);
    }
  }

  private async aplicar(u: UsuarioListado, cambios: CambiosUsuario, mensaje: string): Promise<boolean> {
    this.ocupado.set(u.id);
    try {
      const r = await this.servicio.actualizar(cambios);
      if (!r.ok || !r.usuario) {
        this.feedback.error(r.error ?? 'No se pudo actualizar el usuario');
        return false;
      }
      this.usuarios.update(l => l.map(x => (x.id === u.id ? r.usuario! : x)));
      this.feedback.success(mensaje);
      return true;
    } finally {
      this.ocupado.set(null);
    }
  }

  private static passwordsIguales(group: AbstractControl): ValidationErrors | null {
    return group.get('password')?.value === group.get('confirmPassword')?.value ? null : { notSame: true };
  }
}
