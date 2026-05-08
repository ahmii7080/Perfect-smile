import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact.html',
  styleUrl: './contact.scss'
})
export class ContactPage {
  private fb = inject(FormBuilder);

  form: FormGroup = this.fb.group({
    name:    ['', [Validators.required, Validators.minLength(2)]],
    email:   ['', [Validators.required, Validators.email]],
    subject: ['', Validators.required],
    message: ['', [Validators.required, Validators.minLength(10)]]
  });

  invalid(field: string) {
    const c = this.form.get(field);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  /**
   * Validate form, build a WhatsApp message, and redirect to clinic
   * reception number. Same UX pattern as the appointment page —
   * patient taps "Send" in WhatsApp on their own device.
   */
  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.value;
    const lines = [
      '*Contact — The Perfect Smile*',
      '',
      `*Name:* ${v.name}`,
      `*Email:* ${v.email}`,
      `*Subject:* ${v.subject}`,
      '',
      `*Message:*`,
      v.message
    ];
    const text = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/923247734135?text=${text}`, '_blank', 'noopener');
  }
}
