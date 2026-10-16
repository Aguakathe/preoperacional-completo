import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { FeedbackService } from '../../../shared/feedback.service';
import { IconComponent } from '../../../shared/icon.component';
import { PageHeaderComponent } from '../../../shared/page-header.component';
import { FuerzaPasswordComponent } from '../../../shared/fuerza-password.component';
import { PASSWORD_MIN } from '../../../models/usuario';

/** "Mi cuenta": datos de la sesión y cambio de contraseña (verificada por el servidor). */
@Component({
  selector: 'app-cambiar-password',
  templateUrl: './cambiar-password.component.html',
  styleUrls: ['./cambiar-password.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [IconComponent, ReactiveFormsModule, PageHeaderComponent, FuerzaPasswordComponent]
})
export class CambiarPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly feedback = inject(FeedbackService);

  readonly usuario = this.authService.usuario;
  readonly passwordMin = PASSWORD_MIN;

  readonly form = this.fb.nonNullable.group(
    {
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(PASSWORD_MIN)]],
      confirmPassword: ['', Validators.required]
    },
    { validators: CambiarPasswordComponent.passwordsIguales }
  );

  showCurrentPassword = false;
  showNewPassword = false;
  errorMessage = '';
  guardando = false;

  mostrarError(campo: 'currentPassword' | 'newPassword'): boolean {
    const c = this.form.controls[campo];
    return c.invalid && (c.touched || c.dirty);
  }

  mostrarErrorConfirmacion(): boolean {
    const c = this.form.controls.confirmPassword;
    return (c.touched || c.dirty) && (c.hasError('required') || this.form.hasError('notSame'));
  }

  async actualizarContrasena(): Promise<void> {
    if (this.guardando) return;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { currentPassword, newPassword } = this.form.getRawValue();
    this.guardando = true;
    try {
      const resultado = await this.authService.cambiarPassword(currentPassword, newPassword);
      if (!resultado.ok) {
        this.errorMessage = resultado.error ?? 'No se pudo actualizar la contraseña';
        return;
      }
      this.errorMessage = '';
      this.limpiarFormulario();
      this.feedback.success('Contraseña actualizada. Úsala la próxima vez que inicies sesión.');
    } finally {
      this.guardando = false;
    }
  }

  limpiarFormulario(): void {
    this.form.reset();
    this.showCurrentPassword = false;
    this.showNewPassword = false;
  }

  /** Solo pregunta si hay algo escrito. */
  async cancelarCambio(): Promise<void> {
    if (this.form.dirty) {
      const ok = await this.feedback.confirm({
        title: 'Descartar cambios',
        message: 'Se borrarán los datos escritos en este formulario.',
        confirmText: 'Descartar',
        cancelText: 'Seguir editando',
        danger: true
      });
      if (!ok) return;
    }
    this.limpiarFormulario();
    this.errorMessage = '';
  }

  private static passwordsIguales(group: AbstractControl): ValidationErrors | null {
    return group.get('newPassword')?.value === group.get('confirmPassword')?.value ? null : { notSame: true };
  }
}
