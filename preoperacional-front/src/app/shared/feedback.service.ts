import { Injectable, signal } from '@angular/core';

export type ToastKind = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  /** Acción destructiva: el botón de confirmar se muestra en rojo. */
  danger?: boolean;
}

export interface ConfirmRequest extends Required<ConfirmOptions> {
  resolve: (aceptado: boolean) => void;
}

/**
 * Reemplazo de `alert()` y `confirm()` nativos.
 * Los diálogos nativos bloquean el hilo, no se pueden estilizar, rompen la experiencia en móvil
 * y los navegadores pueden suprimirlos. Esto muestra avisos (toasts) y un diálogo accesible.
 */
@Injectable({ providedIn: 'root' })
export class FeedbackService {
  readonly toasts = signal<Toast[]>([]);
  readonly confirmRequest = signal<ConfirmRequest | null>(null);

  private nextId = 1;
  private foco: HTMLElement | null = null;

  success(message: string): void { this.show('success', message); }
  error(message: string): void { this.show('error', message, 7000); }
  info(message: string): void { this.show('info', message); }
  warning(message: string): void { this.show('warning', message, 6000); }

  dismiss(id: number): void {
    this.toasts.update(lista => lista.filter(t => t.id !== id));
  }

  /** Devuelve una promesa: true si el usuario confirma, false si cancela o pulsa Esc. */
  confirm(options: ConfirmOptions): Promise<boolean> {
    this.confirmRequest()?.resolve(false);
    this.foco = typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null;
    return new Promise<boolean>(resolve => {
      this.confirmRequest.set({
        title: options.title ?? 'Confirmar acción',
        message: options.message,
        confirmText: options.confirmText ?? 'Aceptar',
        cancelText: options.cancelText ?? 'Cancelar',
        danger: options.danger ?? false,
        resolve
      });
    });
  }

  resolveConfirm(aceptado: boolean): void {
    const req = this.confirmRequest();
    if (!req) return;
    this.confirmRequest.set(null);
    req.resolve(aceptado);
    this.foco?.focus?.(); // devuelve el foco al elemento que abrió el diálogo
    this.foco = null;
  }

  private show(kind: ToastKind, message: string, duracionMs = 4500): void {
    const id = this.nextId++;
    // Máximo 4 avisos apilados para no tapar la pantalla
    this.toasts.update(lista => [...lista.slice(-3), { id, kind, message }]);
    setTimeout(() => this.dismiss(id), duracionMs);
  }
}
