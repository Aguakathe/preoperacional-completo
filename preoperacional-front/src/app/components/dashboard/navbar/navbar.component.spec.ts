import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { NavbarComponent } from './navbar.component';
import { API } from '../../../services/api';
import { ADMIN, CONDUCTOR, conSesion, proveedoresDePrueba } from '../../../../testing/ayudas';

describe('NavbarComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [NavbarComponent], providers: proveedoresDePrueba() }).compileComponents();
  });

  it('muestra el nombre completo, el usuario y la insignia de admin', async () => {
    await conSesion(ADMIN);
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.user-name')?.textContent).toContain('Administrador');
    expect(el.querySelector('.user-login')?.textContent).toContain('admin');
    expect(el.querySelector('.avatar')?.textContent?.trim()).toBe('A');
    expect(el.querySelector('.admin-badge')).not.toBeNull();
  });

  it('un conductor no tiene insignia de admin y puede salir', async () => {
    await conSesion(CONDUCTOR);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.admin-badge')).toBeNull();

    const p = fixture.componentInstance.logout();
    TestBed.inject(HttpTestingController).expectOne(`${API}/logout`).flush(null);
    await p;
    expect(navigate).toHaveBeenCalledWith(['/inicio/login']);
  });
});
