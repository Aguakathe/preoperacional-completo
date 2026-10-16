import { Component, ChangeDetectionStrategy, OnDestroy, OnInit, inject, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FeedbackService } from '../../../../shared/feedback.service';
import { PLACA_REGEX, formatFileSize, hoyLocal, nuevoId } from '../../../../shared/utils';
import { IconComponent } from '../../../../shared/icon.component';
import { PageHeaderComponent } from '../../../../shared/page-header.component';
import { PlacaDirective } from '../../../../shared/placa.directive';
import { ZonaCargaComponent } from '../../../../shared/zona-carga.component';
import {
  ACCEPT_FOTOS, CATEGORIAS_FOTO, CategoriaFotoId, ConteoCategorias, MAX_BYTES_FOTO, MAX_FOTOS, MIME_FOTO_ID,
  TIPOS_FOTO, contarPorCategoria, iconoCategoria, nombreCategoria
} from '../../../../models/foto';
import { FotosService } from '../../../../services/fotos.service';
import { AuthService } from '../../../../services/auth.service';
import { CategoriasFotoComponent } from '../categorias-foto/categorias-foto.component';

interface FotoPorSubir {
  id: string;
  file: File;
  name: string;
  size: number;
  preview: string; // URL de objeto (blob:) — debe liberarse con URL.revokeObjectURL
  category: CategoriaFotoId;
}

@Component({
  selector: 'app-fotos-estado',
  templateUrl: './fotos-estado.component.html',
  styleUrls: ['./fotos-estado.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [ReactiveFormsModule, IconComponent, PageHeaderComponent, PlacaDirective, ZonaCargaComponent, CategoriasFotoComponent]
})
export class FotosEstadoComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly feedback = inject(FeedbackService);
  private readonly fotosService = inject(FotosService);
  private readonly auth = inject(AuthService);
  private readonly zona = viewChild(ZonaCargaComponent);

  readonly fotosForm = this.fb.nonNullable.group({
    placa: ['', [Validators.required, Validators.pattern(PLACA_REGEX)]],
    kilometraje: this.fb.control<number | null>(null, [Validators.required, Validators.min(0)]),
    fechaInspeccion: ['', Validators.required],
    inspector: ['', Validators.required],
    observaciones: ['']
  });

  uploadedFiles: FotoPorSubir[] = [];
  readonly maxFotos = MAX_FOTOS;
  readonly acceptFotos = ACCEPT_FOTOS;
  /** No se puede inspeccionar en el futuro. */
  readonly hoy = hoyLocal();
  readonly formatFileSize = formatFileSize;

  readonly categorias = CATEGORIAS_FOTO;
  readonly nombreCategoria = nombreCategoria;
  readonly iconoCategoria = iconoCategoria;
  /** Categoría a la que irán las próximas fotos que se suban. */
  categoriaDestino: CategoriaFotoId | null = 'general';
  /** Contadores en vivo; se recalculan solo cuando cambian las fotos (referencia estable para el hijo OnPush). */
  conteos: ConteoCategorias = contarPorCategoria([]);
  guardando = false;

  ngOnInit(): void {
    this.valoresIniciales();
  }

  ngOnDestroy(): void {
    this.liberarPreviews();
  }

  mostrarError(campo: 'placa' | 'kilometraje' | 'fechaInspeccion' | 'inspector'): boolean {
    const c = this.fotosForm.controls[campo];
    return c.invalid && (c.touched || c.dirty);
  }

  // ---- Archivos ----

  triggerFileInput(): void {
    this.zona()?.abrir();
  }

  handleFiles(files: FileList, categoria: CategoriaFotoId = this.categoriaDestino ?? 'general'): void {
    const rechazos: string[] = [];
    let superoLimite = false;

    for (const file of Array.from(files)) {
      // Se agrega de forma síncrona: el límite se respeta aunque se elijan muchas fotos a la vez
      if (this.uploadedFiles.length >= MAX_FOTOS) {
        superoLimite = true;
        break;
      }
      const error = this.validateFile(file);
      if (error) {
        rechazos.push(error);
      } else if (this.uploadedFiles.some(f => f.name === file.name && f.size === file.size)) {
        rechazos.push(`${file.name} ya estaba agregada.`);
      } else {
        this.uploadedFiles.push({
          id: nuevoId(), file, name: file.name, size: file.size, preview: URL.createObjectURL(file), category: categoria
        });
      }
    }
    this.actualizarConteos();

    if (superoLimite) rechazos.push(`Solo se permiten ${MAX_FOTOS} fotos por inspección.`);
    if (rechazos.length > 0) {
      this.feedback.error(rechazos.join(' '));
    }
  }

  /** Devuelve el mensaje de error o null si el archivo es válido. */
  validateFile(file: File): string | null {
    if (file.size > MAX_BYTES_FOTO) return `${file.name} es demasiado grande (máximo 10 MB).`;
    if (!TIPOS_FOTO.includes(file.type)) return `${file.name} no es una imagen válida (solo JPG, PNG o WEBP).`;
    return null;
  }

  removePhoto(index: number): void {
    const [quitada] = this.uploadedFiles.splice(index, 1);
    if (quitada) {
      URL.revokeObjectURL(quitada.preview);
    }
    this.actualizarConteos();
  }

  // ---- Categorías ----

  /** Reasigna una foto aún sin guardar (desde su selector o arrastrándola sobre una categoría). */
  reasignar(fotoId: string, categoria: CategoriaFotoId): void {
    const foto = this.uploadedFiles.find(f => f.id === fotoId);
    if (!foto || foto.category === categoria) return;
    foto.category = categoria;
    this.actualizarConteos();
  }

  onCategoriaSelect(foto: FotoPorSubir, event: Event): void {
    this.reasignar(foto.id, (event.target as HTMLSelectElement).value as CategoriaFotoId);
  }

  onArchivosEnCategoria(e: { categoria: CategoriaFotoId; archivos: FileList }): void {
    this.categoriaDestino = e.categoria;
    this.handleFiles(e.archivos, e.categoria);
  }

  onFotoEnCategoria(e: { categoria: CategoriaFotoId; fotoId: string }): void {
    this.reasignar(e.fotoId, e.categoria);
  }

  onFotoDragStart(event: DragEvent, foto: FotoPorSubir): void {
    event.dataTransfer?.setData(MIME_FOTO_ID, foto.id);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  private actualizarConteos(): void {
    this.conteos = contarPorCategoria(this.uploadedFiles.map(f => ({ categoria: f.category })));
  }

  // ---- Validación y progreso ----

  isFormValid(): boolean {
    return this.fotosForm.valid && this.uploadedFiles.length > 0;
  }

  getFormProgress(): number {
    const v = this.fotosForm.getRawValue();
    const pasos = [
      !!v.placa && v.kilometraje !== null && !!v.fechaInspeccion && !!v.inspector, // 1) datos (0 km es válido)
      this.uploadedFiles.length > 0,                                              // 2) fotos
      !!v.observaciones                                                           // 3) observaciones (opcional)
    ];
    return Math.round((pasos.filter(Boolean).length / pasos.length) * 100);
  }

  // ---- Envío ----

  async onSubmit(): Promise<void> {
    if (this.guardando) return;
    if (!this.fotosForm.valid) {
      this.fotosForm.markAllAsTouched();
      this.feedback.error('Revisa los campos marcados en rojo.');
      return;
    }
    if (this.uploadedFiles.length === 0) {
      this.feedback.error('Sube al menos una foto del estado de la moto.');
      return;
    }

    this.guardando = true;
    try {
      const { placa, kilometraje, fechaInspeccion, inspector, observaciones } = this.fotosForm.getRawValue();
      const resultado = await this.fotosService.guardarInspeccion(
        { placa, kilometraje, fechaInspeccion, inspector: inspector.trim(), observaciones },
        this.uploadedFiles.map(f => ({ file: f.file, categoria: f.category }))
      );
      if (!resultado.ok) {
        this.feedback.error(resultado.error ?? 'No se pudieron guardar las fotos.');
        return;
      }
      this.feedback.success(`Inspección guardada con ${this.uploadedFiles.length} ${this.uploadedFiles.length === 1 ? 'foto' : 'fotos'}. Ya está en la galería.`);
      this.resetForm();
    } finally {
      this.guardando = false;
    }
  }

  /** Solo pregunta si hay algo que perder. */
  async limpiarFormulario(): Promise<void> {
    if (this.uploadedFiles.length > 0 || this.fotosForm.dirty) {
      const ok = await this.feedback.confirm({
        title: 'Limpiar formulario',
        message: 'Se quitarán las fotos y se borrarán los datos ingresados.',
        confirmText: 'Sí, limpiar',
        danger: true
      });
      if (!ok) return;
    }
    this.resetForm();
  }

  private resetForm(): void {
    this.liberarPreviews();
    this.uploadedFiles = [];
    this.actualizarConteos();
    this.fotosForm.reset();
    this.valoresIniciales();
  }

  /** Fecha de hoy y, como inspector, el nombre de quien tiene la sesión (se puede cambiar). */
  private valoresIniciales(): void {
    const nombre = this.auth.usuario()?.nombre?.trim();
    this.fotosForm.patchValue({ fechaInspeccion: hoyLocal(), ...(nombre ? { inspector: nombre } : {}) });
  }

  private liberarPreviews(): void {
    this.uploadedFiles.forEach(f => URL.revokeObjectURL(f.preview));
  }
}
