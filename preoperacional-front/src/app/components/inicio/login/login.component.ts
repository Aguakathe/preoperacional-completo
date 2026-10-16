import { Component, ChangeDetectionStrategy, inject, input } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { FeedbackService } from '../../../shared/feedback.service';
import { IconComponent } from '../../../shared/icon.component';
import { FuerzaPasswordComponent } from '../../../shared/fuerza-password.component';
import { PASSWORD_MIN } from '../../../models/usuario';

type Modo = 'acceso' | 'cambio';
type CampoVisible = 'actual' | 'nueva' | 'confirmar';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [RouterLink, IconComponent, ReactiveFormsModule, FuerzaPasswordComponent]
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly feedback = inject(FeedbackService);

  /** ?motivo=expirada cuando el servidor cerró la sesión por inactividad. */
  readonly motivo = input<string | undefined>();
  readonly servidorNoDisponible = this.authService.servidorNoDisponible;
  readonly passwordMin = PASSWORD_MIN;

  /** "acceso": iniciar sesión · "cambio": cambiar contraseña (en la misma tarjeta). */
  modo: Modo = 'acceso';

  readonly login = this.fb.nonNullable.group({
    usuario: ['', Validators.required],
    password: ['', Validators.required]
  });

  readonly cambio = this.fb.nonNullable.group(
    {
      usuario: ['', Validators.required],
      actual: ['', Validators.required],
      nueva: ['', [Validators.required, Validators.minLength(PASSWORD_MIN)]],
      confirmar: ['', Validators.required]
    },
    { validators: LoginComponent.coinciden }
  );

  showPassword = false;
  visibles: Record<CampoVisible, boolean> = { actual: false, nueva: false, confirmar: false };
  errorMessage = '';
  enviando = false;

  mostrarError(campo: 'usuario' | 'password'): boolean {
    const c = this.login.controls[campo];
    return c.invalid && (c.touched || c.dirty);
  }

  mostrarErrorCambio(campo: 'usuario' | 'actual' | 'nueva'): boolean {
    const c = this.cambio.controls[campo];
    return c.invalid && (c.touched || c.dirty);
  }

  mostrarErrorConfirmar(): boolean {
    const c = this.cambio.controls.confirmar;
    return (c.touched || c.dirty) && (c.hasError('required') || this.cambio.hasError('noCoinciden'));
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  alternarVisibilidad(campo: CampoVisible): void {
    this.visibles[campo] = !this.visibles[campo];
  }

  irACambio(): void {
    this.cambio.reset({ usuario: this.login.controls.usuario.value });
    this.errorMessage = '';
    this.modo = 'cambio';
    this.enfocar(this.cambio.controls.usuario.value ? 'cambio-actual' : 'cambio-usuario');
  }

  irAAcceso(): void {
    this.errorMessage = '';
    this.modo = 'acceso';
    this.enfocar('usuario');
  }

  async onSubmit(): Promise<void> {
    if (this.enviando) return;
    if (this.login.invalid) {
      this.login.markAllAsTouched();
      return;
    }
    const { usuario, password } = this.login.getRawValue();
    this.enviando = true;
    try {
      const r = await this.authService.login(usuario, password);
      if (r.ok) {
        this.errorMessage = '';
        await this.router.navigate(['/dashboard']);
      } else {
        this.errorMessage = r.error ?? 'Usuario o contraseña incorrectos';
      }
    } finally {
      this.enviando = false;
    }
  }

  async onSubmitCambio(): Promise<void> {
    if (this.enviando) return;
    if (this.cambio.invalid) {
      this.cambio.markAllAsTouched();
      return;
    }
    const { usuario, actual, nueva } = this.cambio.getRawValue();
    this.enviando = true;
    try {
      const resultado = await this.authService.cambiarPasswordConCredenciales(usuario, actual, nueva);
      if (!resultado.ok) {
        this.errorMessage = resultado.error ?? 'No se pudo cambiar la contraseña';
        return;
      }
      // Se vuelve al acceso con el usuario ya escrito: solo falta la nueva contraseña
      this.feedback.success('Contraseña actualizada. Inicia sesión con la nueva.');
      this.login.reset({ usuario: usuario.trim(), password: '' });
      this.cambio.reset();
      this.visibles = { actual: false, nueva: false, confirmar: false };
      this.errorMessage = '';
      this.modo = 'acceso';
      this.enfocar('password');
    } finally {
      this.enviando = false;
    }
  }

  private enfocar(id: string): void {
    setTimeout(() => document.getElementById(id)?.focus());
  }

  private static coinciden(group: AbstractControl): ValidationErrors | null {
    return group.get('nueva')?.value === group.get('confirmar')?.value ? null : { noCoinciden: true };
  }
}
