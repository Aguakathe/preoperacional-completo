import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FeedbackHostComponent } from './shared/feedback-host.component';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    imports: [RouterOutlet, FeedbackHostComponent]
})
export class AppComponent {
  saltarAlContenido(event: Event): void {
    event.preventDefault();
    document.getElementById('contenido')?.focus();
  }
}
