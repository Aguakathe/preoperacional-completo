import { Component, ChangeDetectionStrategy, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { FeedbackService } from '../../../../shared/feedback.service';
import { PLACA_REGEX, formatFileSize, hoyLocal } from '../../../../shared/utils';
import { IconComponent } from '../../../../shared/icon.component';
import { PageHeaderComponent } from '../../../../shared/page-header.component';
import { PlacaDirective, normalizarPlaca } from '../../../../shared/placa.directive';
import { ZonaCargaComponent } from '../../../../shared/zona-carga.component';
import { GastosService } from '../../../../services/gastos.service';
import {
  ACCEPT_DOCUMENTOS, FORMAS_PAGO, Gasto, GastoNuevo, MAX_BYTES_DOCUMENTO, TIPOS_DOCUMENTO, TIPOS_GASTO,
  etiquetaFormaPago, etiquetaTipoGasto
} from '../../../../models/gasto';

type CampoGasto =
  | 'placa' | 'kilometraje' | 'fechaGasto' | 'tipoGasto' | 'descripcion' | 'proveedor'
  | 'valorGasto' | 'formaPago';

const VISIBLES_INICIALES = 5;

/** Coherencia de kilometrajes (el servidor valida lo mismo). */
function kilometrajesCoherentes(group: AbstractControl): ValidationErrors | null {
  const km = group.get('kilometraje')?.value as number | null;
  const anterior = group.get('kilometrajeAnterior')?.value as number | null;
  const proximo = group.get('proximoMantenimiento')?.value as number | null;
  const errores: ValidationErrors = {};
  if (km !== null && anterior !== null && anterior > km) errores['kmAnterior'] = true;
  if (km !== null && proximo !== null && proximo <= km) errores['kmProximo'] = true;
  return Object.keys(errores).length ? errores : null;
}

@Component({
  selector: 'app-gastos-mantenimiento',
  templateUrl: './gastos-mantenimiento.component.html',
  styleUrls: ['./gastos-mantenimiento.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe, DecimalPipe, IconComponent, PageHeaderComponent, PlacaDirective, ZonaCargaComponent]
})
export class GastosMantenimientoComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly feedback = inject(FeedbackService);
  private readonly gastosService = inject(GastosService);
  private readonly zona = viewChild(ZonaCargaComponent);

  readonly tiposGasto = TIPOS_GASTO;
  readonly formasPago = FORMAS_PAGO;
  readonly etiquetaTipo = etiquetaTipoGasto;
  readonly etiquetaPago = etiquetaFormaPago;
  readonly acceptDocumentos = ACCEPT_DOCUMENTOS;

  readonly gastosForm = this.fb.nonNullable.group(
    {
      placa: ['', [Validators.required, Validators.pattern(PLACA_REGEX)]],
      kilometraje: this.fb.control<number | null>(null, [Validators.required, Validators.min(0)]),
      fechaGasto: ['', Validators.required],
      tipoGasto: ['', Validators.required],
      descripcion: ['', Validators.required],
      proveedor: ['', Validators.required],
      valorGasto: this.fb.control<number | null>(null, [Validators.required, Validators.min(0.01)]),
      formaPago: ['', Validators.required],
      numeroFactura: [''],
      fechaVencimiento: [''],
      kilometrajeAnterior: this.fb.control<number | null>(null, Validators.min(0)),
      proximoMantenimiento: this.fb.control<number | null>(null, Validators.min(0)),
      observaciones: ['']
    },
    { validators: kilometrajesCoherentes }
  );

  /** Documentos elegidos para el gasto que se está registrando. */
  uploadedFiles: File[] = [];
  guardando = false;
  readonly hoy = hoyLocal();
  readonly formatFileSize = formatFileSize;

  // ---- Listado (viene del servidor) ----
  readonly cargando = this.gastosService.cargando;
  readonly error = this.gastosService.error;
  readonly filtroPlaca = signal('');
  readonly mostrarTodos = signal(false);

  /** Gastos del filtro, más recientes primero; los totales se calculan sobre el filtro. */
  readonly gastosFiltrados = computed(() => {
    const placa = this.filtroPlaca();
    const lista = this.gastosService.gastos();
    return placa ? lista.filter(g => g.placa.startsWith(placa)) : lista;
  });
  readonly totalGastos = computed(() => this.gastosFiltrados().reduce((t, g) => t + (Number(g.valorGasto) || 0), 0));
  readonly promedioGastos = computed(() => (this.gastosFiltrados().length ? this.totalGastos() / this.gastosFiltrados().length : 0));
  readonly gastosVisibles = computed(() =>
    this.mostrarTodos() ? this.gastosFiltrados() : this.gastosFiltrados().slice(0, VISIBLES_INICIALES));

  ngOnInit(): void {
    this.gastosForm.patchValue({ fechaGasto: hoyLocal() });
  }

  mostrarError(campo: CampoGasto): boolean {
    const c = this.gastosForm.controls[campo];
    return c.invalid && (c.touched || c.dirty);
  }

  filtrarPorPlaca(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = normalizarPlaca(input.value);
    this.filtroPlaca.set(input.value);
  }

  puedeEliminar(g: Gasto): boolean {
    return this.gastosService.puedeEliminar(g);
  }

  recargar(): void {
    void this.gastosService.recargar();
  }

  async eliminarGasto(gasto: Gasto): Promise<void> {
    const ok = await this.feedback.confirm({
      title: 'Eliminar gasto',
      message: `Se eliminará «${gasto.descripcion}» (${gasto.placa}) con sus documentos. Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      danger: true
    });
    if (!ok) return;
    const r = await this.gastosService.eliminar(gasto.id);
    if (r.ok) {
      this.feedback.info('Gasto eliminado');
    } else {
      this.feedback.error(r.error ?? 'No se pudo eliminar el gasto');
    }
  }

  // ---- Documentos ----

  triggerFileInput(): void {
    this.zona()?.abrir();
  }

  handleFiles(files: FileList): void {
    const rechazos: string[] = [];
    for (const file of Array.from(files)) {
      const error = this.validateFile(file);
      if (error) {
        rechazos.push(error);
      } else if (this.uploadedFiles.some(f => f.name === file.name && f.size === file.size)) {
        rechazos.push(`${file.name} ya estaba agregado.`);
      } else {
        this.uploadedFiles.push(file);
      }
    }
    if (rechazos.length > 0) {
      this.feedback.error(rechazos.join(' '));
    }
  }

  /** Devuelve el mensaje de error o null si el archivo es válido. */
  validateFile(file: File): string | null {
    if (file.size > MAX_BYTES_DOCUMENTO) return `${file.name} es demasiado grande (máximo 5 MB).`;
    if (!TIPOS_DOCUMENTO.includes(file.type)) return `${file.name} no es válido (solo PDF, JPG o PNG).`;
    return null;
  }

  removeDocument(index: number): void {
    this.uploadedFiles.splice(index, 1);
  }

  getFileIcon(fileType: string): string {
    return fileType.includes('image') ? 'image' : 'file';
  }

  // ---- Validación y progreso ----

  isFormValid(): boolean {
    return this.gastosForm.valid;
  }

  getFormProgress(): number {
    const v = this.gastosForm.getRawValue();
    const pasos = [
      !!v.placa && v.kilometraje !== null,                                         // moto (0 km es válido)
      !!v.fechaGasto && !!v.tipoGasto && !!v.descripcion && !!v.proveedor,          // gasto
      v.valorGasto !== null && !!v.formaPago,                                       // financiero
      v.kilometrajeAnterior !== null || v.proximoMantenimiento !== null || !!v.observaciones, // técnico (opcional)
      this.uploadedFiles.length > 0                                                 // documentos (opcional)
    ];
    return Math.round((pasos.filter(Boolean).length / pasos.length) * 100);
  }

  // ---- Envío ----

  async onSubmit(): Promise<void> {
    if (this.guardando) return;
    if (!this.isFormValid()) {
      this.gastosForm.markAllAsTouched();
      this.feedback.error('Revisa los campos marcados en rojo.');
      return;
    }

    const v = this.gastosForm.getRawValue();
    const datos: GastoNuevo = {
      placa: v.placa,
      kilometraje: Number(v.kilometraje),
      fechaGasto: v.fechaGasto,
      tipoGasto: v.tipoGasto,
      descripcion: v.descripcion.trim(),
      proveedor: v.proveedor.trim(),
      valorGasto: Number(v.valorGasto),
      formaPago: v.formaPago,
      numeroFactura: v.numeroFactura.trim() || undefined,
      fechaVencimiento: v.fechaVencimiento || undefined,
      kilometrajeAnterior: v.kilometrajeAnterior ?? undefined,
      proximoMantenimiento: v.proximoMantenimiento ?? undefined,
      observaciones: v.observaciones.trim() || undefined
    };

    this.guardando = true;
    try {
      const r = await this.gastosService.crear(datos, this.uploadedFiles);
      if (!r.ok) {
        this.feedback.error(r.error ?? 'No se pudo guardar el gasto');
        return;
      }
      this.feedback.success('Gasto de mantenimiento registrado');
      this.resetForm();
    } finally {
      this.guardando = false;
    }
  }

  /** Solo pregunta si hay algo que perder. */
  async limpiarFormulario(): Promise<void> {
    if (this.gastosForm.dirty || this.uploadedFiles.length > 0) {
      const ok = await this.feedback.confirm({
        title: 'Limpiar formulario',
        message: 'Se borrarán los datos ingresados y los documentos adjuntos.',
        confirmText: 'Sí, limpiar',
        danger: true
      });
      if (!ok) return;
    }
    this.resetForm();
  }

  private resetForm(): void {
    this.gastosForm.reset();
    this.uploadedFiles = [];
    this.gastosForm.patchValue({ fechaGasto: hoyLocal() });
  }
}
