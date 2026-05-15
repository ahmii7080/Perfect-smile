import { Component, inject } from '@angular/core';

import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SeoService } from '../../services/seo.service';
import { StructuredDataService } from '../../services/structured-data.service';
import {
  BreadcrumbComponent,
  BreadcrumbItem,
} from '../../components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [ReactiveFormsModule, BreadcrumbComponent],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
})
export class ContactPage {
  private fb = inject(FormBuilder);
  private seo = inject(SeoService);
  private structuredData = inject(StructuredDataService);

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', path: '/' },
    { label: 'Contact', path: '/contact' },
  ];

  constructor() {
    this.seo.set({
      title: 'Contact — Dentist in Faisalabad',
      description:
        'Get in touch with The Perfect Smile Dental Clinic — adjacent Rehman Garden Gate No. 1, Stayana Road, Faisalabad. Call +92 324 7734135 or WhatsApp for fast appointment confirmation.',
      path: '/contact',
      keywords: [
        'dental clinic contact Faisalabad',
        'dentist phone number Faisalabad',
        'dental clinic address FSD',
        'dental clinic near D Ground',
        'dental clinic Stayana Road',
        'dental clinic Satyana Road Faisalabad',
        'WhatsApp dentist Faisalabad',
        'dentist directions Faisalabad',
      ],
    });
    this.structuredData.setBreadcrumb(this.breadcrumbs);
  }

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    subject: ['', Validators.required],
    message: ['', [Validators.required, Validators.minLength(10)]],
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
      v.message,
    ];
    const text = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/923247734135?text=${text}`, '_blank', 'noopener');
  }
}
