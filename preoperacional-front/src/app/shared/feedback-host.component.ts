import { Component, ChangeDetectionStrategy, ElementRef, HostListener, effect, inject, viewChild } from '@angular/core';
import { FeedbackService } from './feedback.service';
import { IconComponent } from './icon.component';

/** Se monta UNA sola vez en AppComponent: pinta los toasts y el diálogo de confirmación. */
@Component({
    selector: 'app-feedback-host',
    templateUrl: './feedback-host.component.html',
    styleUrls: ['./feedback-host.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [IconComponent]
})
export class FeedbackHostComponent {
  protected readonly feedback = inject(FeedbackService);
  private readonly cancelBtn = viewChild<ElementRef<HTMLButtonElement>>('cancelBtn');
  private readonly dialog = viewChild<ElementRef<HTMLElement>>('dialog');

  constructor() {
    // Al abrir el diálogo, el foco va al botón "Cancelar" (opción segura por defecto).
    effect(() => {
      if (this.feedback.confirmRequest()) {
        setTimeout(() => this.cancelBtn()?.nativeElement.focus());
      }
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.feedback.confirmRequest()) {
      this.feedback.resolveConfirm(false);
    }
  }

  /** Trampa de foco mínima: Tab/Shift+Tab ciclan dentro del diálogo. */
  onDialogKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const botones = Array.from(this.dialog()?.nativeElement.querySelectorAll<HTMLElement>('button') ?? []);
    if (botones.length === 0) return;
    const primero = botones[0];
    const ultimo = botones[botones.length - 1];
    if (event.shiftKey && document.activeElement === primero) {
      event.preventDefault();
      ultimo.focus();
    } else if (!event.shiftKey && document.activeElement === ultimo) {
      event.preventDefault();
      primero.focus();
    }
  }
}
