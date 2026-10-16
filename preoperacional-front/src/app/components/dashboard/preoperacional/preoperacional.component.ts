import { Component, ChangeDetectionStrategy, OnInit, inject, output } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { FeedbackService } from '../../../shared/feedback.service';
import { PLACA_REGEX, fechaHora, irA } from '../../../shared/utils';
import { IconComponent } from '../../../shared/icon.component';
import { PageHeaderComponent } from '../../../shared/page-header.component';
import { PlacaDirective } from '../../../shared/placa.directive';
import { AuthService } from '../../../services/auth.service';
import { PreoperacionalService } from '../../../services/preoperacional.service';
import {
  CATEGORIAS_PREOPERACIONAL, ClaveCategoria, DOCUMENTACION, ESTADO_GENERAL, ESTADO_SISTEMAS, EstadoChequeo,
  PREGUNTAS_SALUD, Preoperacional, PreoperacionalNuevo, SaludItem, SiNo
} from '../../../models/preoperacional';

/** Pregunta del paso 3 (estado general del vehículo). */
interface Chequeo {
  id: 'documentacion' | 'general' | 'sistemas';
  titulo: string;
  items: string[];
  valor: EstadoChequeo | '';
}

/** Categoría del paso 6: "perfecto estado" o lista de elementos que no cumplen. */
interface Categoria {
  clave: ClaveCategoria;
  titulo: string;
  etiquetaPerfecto: string;
  items: string[];
  desde: number;
  perfecto: '' | 'si' | 'no';
  seleccionados: string[];
}

export interface Pendiente {
  id: string;
  texto: string;
}

@Component({
  selector: 'app-preoperacional',
  templateUrl: './preoperacional.component.html',
  styleUrls: ['./preoperacional.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [ReactiveFormsModule, FormsModule, IconComponent, PageHeaderComponent, PlacaDirective]
})
export class PreoperacionalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly feedback = inject(FeedbackService);
  private readonly auth = inject(AuthService);
  private readonly preoperacionales = inject(PreoperacionalService);

  /** Pide al panel que muestre la pestaña Historial. */
  readonly verHistorial = output<void>();

  readonly preoperacionalForm = this.fb.nonNullable.group({
    qlid: ['', Validators.required],
    nombreCompleto: ['', Validators.required],
    placaMoto: ['', [Validators.required, Validators.pattern(PLACA_REGEX)]],
    kilometraje: this.fb.control<number | null>(null, [Validators.required, Validators.min(0)])
  });

  // 1) Campaña de prevención
  conoceCampana: SiNo | '' = '';

  // 3) Estado del vehículo
  readonly chequeos: Chequeo[] = [
    { id: 'documentacion', titulo: 'La documentación del vehículo y del conductor está vigente:', items: DOCUMENTACION, valor: '' },
    { id: 'general', titulo: 'Estado general: los siguientes elementos están en perfecto estado para operación y funcionamiento:', items: ESTADO_GENERAL, valor: '' },
    { id: 'sistemas', titulo: 'Estado de sistemas y accesorios del vehículo:', items: ESTADO_SISTEMAS, valor: '' }
  ];

  // 4) Certificación de salud
  saludItems: SaludItem[] = PREGUNTAS_SALUD.map(pregunta => ({ pregunta, respuesta: '' }));

  // 5) ¿Hay elementos en mal estado?
  elementosMalEstado: SiNo | '' = '';

  // 6) Detalle por categoría
  readonly categorias: Categoria[] = CATEGORIAS_PREOPERACIONAL.map(c => ({ ...c, perfecto: '', seleccionados: [] }));

  // 7) Confirmaciones
  confirmacionInsegura: SiNo | '' = '';
  confirmacionInspeccion: SiNo | '' = '';

  /** Se activa al intentar enviar con pendientes: muestra el resumen de lo que falta. */
  intentoEnvio = false;
  enviando = false;
  /** Último preoperacional guardado: se muestra una tarjeta de confirmación con el resultado. */
  ultimoEnvio: Preoperacional | null = null;

  readonly siNo = [
    { valor: 'si' as const, etiqueta: 'Sí' },
    { valor: 'no' as const, etiqueta: 'No' }
  ];

  readonly irA = irA;
  readonly fechaHora = fechaHora;

  ngOnInit(): void {
    this.precargarConductor();
  }

  mostrarError(campo: 'qlid' | 'nombreCompleto' | 'placaMoto' | 'kilometraje'): boolean {
    const c = this.preoperacionalForm.controls[campo];
    return c.invalid && (c.touched || c.dirty);
  }

  /** Selecciona/deselecciona un elemento que no cumple. Al marcar uno, la categoría pasa a "no está perfecta". */
  toggleItem(cat: Categoria, item: string, event: Event): void {
    const marcado = (event.target as HTMLInputElement).checked;
    if (marcado) {
      if (!cat.seleccionados.includes(item)) cat.seleccionados.push(item);
      cat.perfecto = 'no';
    } else {
      cat.seleccionados = cat.seleccionados.filter(i => i !== item);
    }
  }

  /** "Perfecto estado" borra los elementos marcados (no pueden coexistir). */
  onPerfectoChange(cat: Categoria, valor: 'si' | 'no'): void {
    cat.perfecto = valor;
    if (valor === 'si') {
      cat.seleccionados = [];
    }
  }

  // ---- Validación ----

  get hayMalEstadoEnChequeos(): boolean {
    return this.chequeos.some(c => c.valor === 'mal_estado');
  }

  /** Alguna respuesta de salud es "No": el conductor NO debe conducir. */
  get hayRiesgoSalud(): boolean {
    return this.saludItems.some(i => i.respuesta === 'no');
  }

  /** Contradicción: dijo "mal estado" en el paso 3 pero "todo en perfecto estado" en el paso 5. */
  get incoherencia(): boolean {
    return this.elementosMalEstado === 'no' && this.hayMalEstadoEnChequeos;
  }

  private categoriaResuelta(c: Categoria): boolean {
    return c.perfecto === 'si' || c.seleccionados.length > 0;
  }

  private get totalReportados(): number {
    return this.categorias.reduce((t, c) => t + c.seleccionados.length, 0);
  }

  /** Lista de lo que falta, en el orden del formulario (las mismas reglas valida el servidor). */
  pendientes(): Pendiente[] {
    const p: Pendiente[] = [];
    if (!this.conoceCampana) p.push({ id: 'sec-campana', texto: '1) Responde si conoces la campaña de prevención' });
    if (this.preoperacionalForm.invalid) p.push({ id: 'sec-datos', texto: '2) Completa los datos del conductor y de la moto' });
    if (this.chequeos.some(c => !c.valor)) p.push({ id: 'sec-estado', texto: '3) Indica el estado de documentación, estado general y sistemas' });
    if (this.saludItems.some(i => !i.respuesta)) p.push({ id: 'sec-salud', texto: '4) Responde todas las preguntas de salud' });
    if (!this.elementosMalEstado) {
      p.push({ id: 'sec-malestado', texto: '5) Indica si hay elementos en mal estado' });
    } else if (this.incoherencia) {
      p.push({ id: 'sec-malestado', texto: '5) Marcaste «Mal estado» en el punto 3: indica que hay elementos que no cumplen' });
    } else if (this.elementosMalEstado === 'si') {
      if (!this.categorias.every(c => this.categoriaResuelta(c))) {
        p.push({ id: 'sec-detalle', texto: '6) En cada categoría marca «perfecto estado» o los elementos que no cumplen' });
      } else if (this.totalReportados === 0) {
        p.push({ id: 'sec-detalle', texto: '6) Reporta al menos un elemento que no cumple' });
      }
    } else if (!this.confirmacionInsegura || !this.confirmacionInspeccion) {
      p.push({ id: 'sec-confirm', texto: '7) Responde las dos confirmaciones' });
    }
    return p;
  }

  isFormValid(): boolean {
    return this.pendientes().length === 0;
  }

  /** Porcentaje de avance (7 pasos). Un kilometraje de 0 es válido. */
  getFormProgress(): number {
    const f = this.preoperacionalForm.getRawValue();
    const datos = !!f.qlid && !!f.nombreCompleto && !!f.placaMoto && f.kilometraje !== null;
    const detalleSi = this.categorias.every(c => this.categoriaResuelta(c));

    const pasos = [
      !!this.conoceCampana,
      datos,
      this.chequeos.every(c => !!c.valor),
      this.saludItems.every(i => !!i.respuesta),
      !!this.elementosMalEstado,
      this.elementosMalEstado === 'si' ? detalleSi : this.elementosMalEstado === 'no',
      this.elementosMalEstado === 'no' ? !!this.confirmacionInsegura && !!this.confirmacionInspeccion : this.elementosMalEstado === 'si'
    ];
    return Math.round((pasos.filter(Boolean).length / pasos.length) * 100);
  }

  // ---- Envío ----

  /** Arma el cuerpo exacto que espera POST /api/preoperacionales. */
  construirEnvio(): PreoperacionalNuevo {
    const f = this.preoperacionalForm.getRawValue();
    const porClave = (clave: ClaveCategoria) => {
      const c = this.categorias.find(x => x.clave === clave)!;
      return { perfectoEstado: c.perfecto === 'si', elementos: [...c.seleccionados] };
    };
    const valor = (id: Chequeo['id']) => this.chequeos.find(c => c.id === id)!.valor as EstadoChequeo;

    return {
      conoceCampana: this.conoceCampana as SiNo,
      qlid: f.qlid.trim(),
      nombreCompleto: f.nombreCompleto.trim(),
      placaMoto: f.placaMoto,
      kilometraje: Number(f.kilometraje),
      documentacionVigente: valor('documentacion'),
      estadoGeneralVehiculo: valor('general'),
      estadoSistemasAccesorios: valor('sistemas'),
      saludItems: this.saludItems.map(i => ({ ...i })),
      elementosMalEstado: this.elementosMalEstado as SiNo,
      elementosNoCumplen: this.elementosMalEstado === 'si' ? {
        documentacion: porClave('documentacion'),
        estadoGeneral: porClave('estadoGeneral'),
        estadoMecanico: porClave('estadoMecanico'),
        estadoSistemas: porClave('estadoSistemas')
      } : null,
      confirmaciones: this.elementosMalEstado === 'no' ? {
        confirmacionInsegura: this.confirmacionInsegura as SiNo,
        confirmacionInspeccion: this.confirmacionInspeccion as SiNo
      } : null
    };
  }

  async onSubmit(): Promise<void> {
    if (this.enviando) return;
    if (!this.isFormValid()) {
      this.intentoEnvio = true;
      this.preoperacionalForm.markAllAsTouched();
      const primero = this.pendientes()[0];
      this.feedback.error('Faltan datos por completar: ' + primero.texto);
      irA(primero.id);
      return;
    }

    this.enviando = true;
    try {
      const r = await this.preoperacionales.enviar(this.construirEnvio());
      if (!r.ok || !r.registro) {
        // Se conservan las respuestas para que pueda corregir y reenviar
        this.feedback.error(r.error ?? 'No se pudo enviar el preoperacional');
        return;
      }
      // La tarjeta de resultado (arriba del formulario) es la confirmación: incluye si es apto o no para conducir
      this.ultimoEnvio = r.registro;
      this.resetForm();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      this.enviando = false;
    }
  }

  // ---- Limpieza ----

  /** Solo pide confirmación si el usuario ya escribió/respondió algo. */
  async limpiarFormulario(): Promise<void> {
    if (this.getFormProgress() > 0 || this.preoperacionalForm.dirty) {
      const ok = await this.feedback.confirm({
        title: 'Limpiar formulario',
        message: 'Se perderán todas las respuestas que has ingresado.',
        confirmText: 'Sí, limpiar',
        cancelText: 'Cancelar',
        danger: true
      });
      if (!ok) return;
    }
    this.resetForm();
  }

  /** Restablece todo sin pedir confirmación (se usa tras enviar). */
  private resetForm(): void {
    this.preoperacionalForm.reset();
    this.conoceCampana = '';
    this.chequeos.forEach(c => (c.valor = ''));
    this.saludItems.forEach(i => (i.respuesta = ''));
    this.elementosMalEstado = '';
    this.categorias.forEach(c => {
      c.perfecto = '';
      c.seleccionados = [];
    });
    this.confirmacionInsegura = '';
    this.confirmacionInspeccion = '';
    this.intentoEnvio = false;
    this.precargarConductor();
  }

  /** El nombre del conductor se precarga con el de la cuenta (se puede cambiar). */
  private precargarConductor(): void {
    const nombre = this.auth.usuario()?.nombre?.trim();
    if (nombre) {
      this.preoperacionalForm.controls.nombreCompleto.setValue(nombre);
    }
  }
}
