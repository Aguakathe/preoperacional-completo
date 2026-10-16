import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { UsuariosComponent } from './usuarios.component';
import { FeedbackService } from '../../../shared/feedback.service';
import { API } from '../../../services/api';
import { UsuarioListado } from '../../../models/usuario';
import { ADMIN, conSesion, proveedoresDePrueba, tick } from '../../../../testing/ayudas';

const lista: UsuarioListado[] = [
  { id: 1, username: 'admin', nombre: 'Administrador', email: null, rol: 'admin', estado: true, fechaCreacion: '2026-10-16T08:00:00' },
  { id: 2, username: 'jperez', nombre: 'Juan Pérez', email: null, rol: 'usuario', estado: true, fechaCreacion: '2026-10-16T08:00:00' }
];

describe('UsuariosComponent', () => {
  let http: HttpTestingController;

  async function crear() {
    await TestBed.configureTestingModule({ imports: [UsuariosComponent], providers: proveedoresDePrueba() }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    await conSesion(ADMIN);
    const fixture = TestBed.createComponent(UsuariosComponent);
    fixture.detectChanges();
    http.expectOne(`${API}/usuarios`).flush(lista);
    await tick();
    fixture.detectChanges();
    return fixture;
  }

  afterEach(() => http.verify());

  it('lista los usuarios; el propio admin no tiene controles para cambiarse a sí mismo', async () => {
    const fixture = await crear();
    const filas = fixture.nativeElement.querySelectorAll('.registro');
    expect(filas.length).toBe(2);
    expect(filas[0].textContent).toContain('Tú');
    expect(filas[0].querySelector('select')).toBeNull();
    expect(filas[1].querySelector('select')).not.toBeNull();
  });

  it('valida el usuario (sin espacios) y que las contraseñas coincidan', async () => {
    const c = (await crear()).componentInstance;
    c.form.patchValue({ username: 'juan perez', password: 'clave1', confirmPassword: 'otra' });
    expect(c.form.controls.username.invalid).toBe(true);
    expect(c.form.hasError('notSame')).toBe(true);
    await c.crear();
    http.expectNone(r => r.method === 'POST');
  });

  it('crea el usuario con el rol elegido y lo agrega a la lista', async () => {
    const fixture = await crear();
    const c = fixture.componentInstance;
    c.form.setValue({ username: 'mlopez', nombre: 'María López', rol: 'admin', password: 'clave1', confirmPassword: 'clave1' });
    const p = c.crear();
    const req = http.expectOne({ method: 'POST', url: `${API}/usuarios` });
    expect(req.request.body).toEqual({ username: 'mlopez', nombre: 'María López', rol: 'admin', password: 'clave1' });
    req.flush({ id: 3, username: 'mlopez', nombre: 'María López', email: null, rol: 'admin', estado: true, fechaCreacion: null });
    await p;
    expect(c.usuarios().map(u => u.username)).toEqual(['admin', 'jperez', 'mlopez']);
    expect(c.form.controls.rol.value).toBe('usuario');
  });

  it('desactivar pide confirmación y actualiza la fila', async () => {
    const c = (await crear()).componentInstance;
    vi.spyOn(TestBed.inject(FeedbackService), 'confirm').mockResolvedValue(true);
    const p = c.cambiarEstado(lista[1]);
    await tick();
    const req = http.expectOne({ method: 'PUT', url: `${API}/usuarios` });
    expect(req.request.body).toEqual({ idUsuario: 2, estado: false });
    req.flush({ ...lista[1], estado: false });
    await p;
    expect(c.usuarios()[1].estado).toBe(false);
  });

  it('si el servidor rechaza el cambio de rol, el selector vuelve al valor anterior', async () => {
    const c = (await crear()).componentInstance;
    const select = { value: 'admin' } as HTMLSelectElement;
    const p = c.cambiarRol(lista[1], { target: select } as unknown as Event);
    http.expectOne(`${API}/usuarios`).flush({ error: 'Debe quedar al menos un administrador activo' }, { status: 409, statusText: 'x' });
    await p;
    expect(select.value).toBe('usuario');
  });

  it('restablecer contraseña exige el mínimo de caracteres', async () => {
    const c = (await crear()).componentInstance;
    const campo = { value: '12', focus: vi.fn() } as unknown as HTMLInputElement;
    await c.restablecer(lista[1], campo);
    http.expectNone(`${API}/usuarios`);
    campo.value = 'nueva1';
    const p = c.restablecer(lista[1], campo);
    http.expectOne(`${API}/usuarios`).flush(lista[1]);
    await p;
    expect(c.restableciendo()).toBeNull();
  });
});
