import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { LoginComponent } from './login.component';
import { API } from '../../../services/api';
import { ADMIN, proveedoresDePrueba, tick } from '../../../../testing/ayudas';

describe('LoginComponent', () => {
  let http: HttpTestingController;
  let navigate: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [LoginComponent], providers: proveedoresDePrueba() }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
  });

  afterEach(() => http.verify());

  function crear() {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('no llama al servidor si faltan datos y marca los campos', async () => {
    const c = crear().componentInstance;
    await c.onSubmit();
    expect(c.mostrarError('usuario')).toBe(true);
    http.expectNone(`${API}/login`);
  });

  it('navega al panel con credenciales correctas', async () => {
    const c = crear().componentInstance;
    c.login.setValue({ usuario: 'admin', password: '12345' });
    const p = c.onSubmit();
    expect(c.enviando).toBe(true);
    http.expectOne(`${API}/login`).flush(ADMIN);
    await p;
    expect(navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(c.enviando).toBe(false);
  });

  it('muestra el error del servidor y no navega', async () => {
    const fixture = crear();
    const c = fixture.componentInstance;
    c.login.setValue({ usuario: 'admin', password: 'mala' });
    const p = c.onSubmit();
    http.expectOne(`${API}/login`).flush({ error: 'Usuario o contraseña incorrectos' }, { status: 401, statusText: 'x' });
    await p;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.alert-error')?.textContent).toContain('Usuario o contraseña incorrectos');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('avisa cuando la sesión anterior venció (?motivo=expirada)', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.componentRef.setInput('motivo', 'expirada');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Tu sesión se cerró por inactividad');
  });

  it('el botón de visibilidad cambia el tipo del campo contraseña', () => {
    const fixture = crear();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('#password');
    expect(input.type).toBe('password');
    fixture.componentInstance.togglePasswordVisibility();
    fixture.detectChanges();
    expect(input.type).toBe('text');
  });

  it('cambia la contraseña sin sesión y vuelve al acceso con el usuario ya escrito', async () => {
    const fixture = crear();
    const c = fixture.componentInstance;
    c.login.patchValue({ usuario: 'usuario' });
    (fixture.nativeElement.querySelector('.enlace') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(c.modo).toBe('cambio');
    expect(c.cambio.controls.usuario.value).toBe('usuario');
    expect(fixture.nativeElement.querySelector('app-fuerza-password')).not.toBeNull();

    c.cambio.setValue({ usuario: 'usuario', actual: '123456', nueva: 'nueva123', confirmar: 'nueva123' });
    const p = c.onSubmitCambio();
    http.expectOne({ method: 'PUT', url: `${API}/password` }).flush({ mensaje: 'ok' });
    await p;
    await tick();
    expect(c.modo).toBe('acceso');
    expect(c.login.controls.usuario.value).toBe('usuario');
  });

  it('con confirmación distinta el formulario de cambio es inválido', () => {
    const c = crear().componentInstance;
    c.irACambio();
    c.cambio.setValue({ usuario: 'usuario', actual: '123456', nueva: 'nueva123', confirmar: 'otra' });
    expect(c.cambio.invalid).toBe(true);
  });
});
