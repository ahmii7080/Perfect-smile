import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-whatsapp-popup',
  standalone: true,
  imports: [],
  templateUrl: './whatsapp-popup.html',
  styleUrl: './whatsapp-popup.scss',
})
export class WhatsappPopupComponent {
  open = signal(false);
  readonly waUrl =
    'https://wa.me/923247734135?text=Hi!%20I%27d%20like%20to%20book%20an%20appointment.';

  toggle() {
    this.open.update((v) => !v);
  }
  close() {
    this.open.set(false);
  }
}
