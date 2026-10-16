import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { FotosEstadoComponent } from './fotos-estado.component';
import { FotosService } from '../../../../services/fotos.service';
import { CONDUCTOR, conSesion, proveedoresDePrueba } from '../../../../../testing/ayudas';

describe('FotosEstadoComponent', () => {
  beforeEach(async () => {
    (URL as unknown as { createObjectURL: unknown }).createObjectURL = vi.fn(() => 'blob:fake');
    (URL as unknown as { revokeObjectURL: unknown }).revokeObjectURL = vi.fn();
    await TestBed.configureTestingModule({ imports: [FotosEstadoComponent], providers: proveedoresDePrueba() }).compileComponents();
    await conSesion(CONDUCTOR);
  });

  function crear() {
    const fixture = TestBed.createComponent(FotosEstadoComponent);
    fixture.detectChanges();
    TestBed.inject(HttpTestingController).match(() => true).forEach(r => r.flush([]));
    return fixture;
  }

  const lista = (...files: File[]) => files as unknown as FileList;
  const imagen = (n: string, size = 10) => new File(['x'.repeat(size)], n, { type: 'image/jpeg' });

  it('precarga la fecha de hoy y al inspector con el nombre de la cuenta', () => {
    const c = crear().componentInstance;
    expect(c.fotosForm.controls.fechaInspeccion.value).toBe(c.hoy);
    expect(c.fotosForm.controls.inspector.value).toBe('Juan Pérez');
  });

  it('valida tipo y tamaño de cada foto', () => {
    const c = crear().componentInstance;
    expect(c.validateFile(new File(['x'], 'a.pdf', { type: 'application/pdf' }))).toContain('no es una imagen válida');
    expect(c.validateFile(imagen('ok.jpg'))).toBeNull();
  });

  it('no acepta más de 10 fotos ni duplicados, y las agrega a la categoría elegida', () => {
    const c = crear().componentInstance;
    c.categoriaDestino = 'motor';
    c.handleFiles(lista(...Array.from({ length: 12 }, (_, i) => imagen(`f${i}.jpg`))));
    expect(c.uploadedFiles.length).toBe(10);
    expect(c.conteos.motor).toBe(10);
    c.removePhoto(0);
    c.handleFiles(lista(imagen('f1.jpg')));
    expect(c.uploadedFiles.length).toBe(9);
  });

  it('envía la inspección con la categoría de cada foto y limpia al terminar', async () => {
    const c = crear().componentInstance;
    const guardar = vi.spyOn(TestBed.inject(FotosService), 'guardarInspeccion').mockResolvedValue({ ok: true });
    c.fotosForm.patchValue({ placa: 'ABC12G', kilometraje: 0 });
    c.handleFiles(lista(imagen('a.jpg')));
    c.reasignar(c.uploadedFiles[0].id, 'frenos');
    await c.onSubmit();
    expect(guardar).toHaveBeenCalledWith(
      expect.objectContaining({ placa: 'ABC12G', kilometraje: 0, inspector: 'Juan Pérez' }),
      [expect.objectContaining({ categoria: 'frenos' })]
    );
    expect(c.uploadedFiles).toEqual([]);
  });

  it('sin fotos no se envía nada', async () => {
    const c = crear().componentInstance;
    const guardar = vi.spyOn(TestBed.inject(FotosService), 'guardarInspeccion');
    c.fotosForm.patchValue({ placa: 'ABC12G', kilometraje: 10 });
    await c.onSubmit();
    expect(guardar).not.toHaveBeenCalled();
  });

  it('los campos tienen ids propios (no chocan con el preoperacional, que sigue montado)', () => {
    const el: HTMLElement = crear().nativeElement;
    expect(el.querySelector('#f-placa')).not.toBeNull();
    expect(el.querySelector('#kilometraje')).toBeNull();
  });
});
