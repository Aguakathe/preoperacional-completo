import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { CambiarPasswordComponent } from './cambiar-password.component';
import { API } from '../../../services/api';
import { CONDUCTOR, conSesion, proveedoresDePrueba } from '../../../../testing/ayudas';

describe('CambiarPasswordComponent (Mi cuenta)', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CambiarPasswordComponent], providers: proveedoresDePrueba() }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    await conSesion(CONDUCTOR);
  });

  afterEach(() => http.verify());

  function crear() {
    const fixture = TestBed.createComponent(CambiarPasswordComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('muestra los datos de la cuenta', () => {
    const el: HTMLElement = crear().nativeElement;
    expect(el.querySelector('.perfil')?.textContent).toContain('Juan Pérez');
    expect(el.querySelector('.perfil')?.textContent).toContain('jperez');
  });

  it('cambia la contraseña y limpia el formulario', async () => {
    const c = crear().componentInstance;
    c.form.setValue({ currentPassword: '123456', newPassword: 'nueva123', confirmPassword: 'nueva123' });
    const p = c.actualizarContrasena();
    const req = http.expectOne({ method: 'PUT', url: `${API}/password` });
    expect(req.request.body).toEqual({ passwordActual: '123456', passwordNueva: 'nueva123' });
    req.flush({ mensaje: 'ok' });
    await p;
    expect(c.form.controls.currentPassword.value).toBe('');
    expect(c.errorMessage).toBe('');
  });

  it('muestra el error si la contraseña actual es incorrecta', async () => {
    const fixture = crear();
    const c = fixture.componentInstance;
    c.form.setValue({ currentPassword: 'mala', newPassword: 'nueva123', confirmPassword: 'nueva123' });
    const p = c.actualizarContrasena();
    http.expectOne(`${API}/password`).flush({ error: 'La contraseña actual es incorrecta' }, { status: 403, statusText: 'x' });
    await p;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.alert-error')?.textContent).toContain('La contraseña actual es incorrecta');
  });

  it('no envía si la confirmación no coincide', async () => {
    const c = crear().componentInstance;
    c.form.setValue({ currentPassword: '123456', newPassword: 'nueva123', confirmPassword: 'otra' });
    await c.actualizarContrasena();
    expect(c.mostrarErrorConfirmacion()).toBe(true);
    http.expectNone(`${API}/password`);
  });
});
