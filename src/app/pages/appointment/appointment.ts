import { Component, OnInit, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { ServiceItem } from '../../models/service.model';
import { Doctor } from '../../models/doctor.model';
import { SeoService } from '../../services/seo.service';
import { StructuredDataService } from '../../services/structured-data.service';
import {
  BreadcrumbComponent,
  BreadcrumbItem,
} from '../../components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-appointment',
  standalone: true,
  imports: [ReactiveFormsModule, BreadcrumbComponent, NgOptimizedImage],
  templateUrl: './appointment.html',
  styleUrl: './appointment.scss',
})
export class AppointmentPage implements OnInit {
  private fb = inject(FormBuilder);
  private data = inject(DataService);
  private seo = inject(SeoService);
  private structuredData = inject(StructuredDataService);

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', path: '/' },
    { label: 'Appointment', path: '/appointment' },
  ];

  constructor() {
    this.seo.set({
      title: 'Book Appointment — Dentist Faisalabad',
      description:
        'Book your dental appointment at The Perfect Smile, Faisalabad. Free consultation. Confirm instantly on WhatsApp. Open Mon–Sat 5pm–10pm.',
      path: '/appointment',
      keywords: [
        'book dental appointment Faisalabad',
        'dental appointment FSD',
        'free dental consultation Faisalabad',
        'WhatsApp dentist Faisalabad',
        'dentist near me booking',
        'dental appointment near D Ground',
        'walk-in dentist Faisalabad',
      ],
    });
    this.structuredData.setBreadcrumb(this.breadcrumbs);
  }

  services = signal<ServiceItem[]>([]);
  doctors = signal<Doctor[]>([]);

  // Clinic hours: Mon–Sat 5 PM – 10 PM, Sunday closed.
  // Slots stop at 9 PM so the last appointment finishes by closing.
  timeSlots = ['05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM'];

  today = new Date().toISOString().slice(0, 10);

  form: FormGroup = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    phone: ['', [Validators.required, Validators.pattern(/^[+0-9\-\s()]{8,18}$/)]],
    email: ['', [Validators.required, Validators.email]],
    service: ['', Validators.required],
    doctor: ['dr-faizan-sheikh'],
    date: ['', Validators.required],
    timeSlot: ['', Validators.required],
    message: [''],
  });

  ngOnInit() {
    this.data.getServices().subscribe((list) => this.services.set(list));
    this.data.getDoctors().subscribe((list) => {
      this.doctors.set(list);
      if (list[0]) this.form.patchValue({ doctor: list[0].slug });
    });
  }

  pickSlot(slot: string) {
    this.form.patchValue({ timeSlot: slot });
  }

  invalid(field: string) {
    const c = this.form.get(field);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  /**
   * Validate form, build a WhatsApp message with all booking details,
   * and open WhatsApp on the patient's phone addressed to clinic reception.
   * This is the only submission path — there is no email/server flow.
   */
  bookViaWhatsApp() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.value;

    const serviceTitle = this.services().find((s) => s.slug === v.service)?.title ?? v.service;
    const doctorLabel =
      this.doctors().find((d) => d.slug === v.doctor)?.name ?? 'Dr. Muhammad Faizan Sheikh';

    const lines = [
      '*Appointment Request — The Perfect Smile*',
      '',
      `*Name:* ${v.fullName}`,
      `*Phone:* ${v.phone}`,
      `*Email:* ${v.email}`,
      `*Service:* ${serviceTitle}`,
      `*Doctor:* ${doctorLabel}`,
      `*Date:* ${v.date}`,
      `*Time:* ${v.timeSlot}`,
    ];
    if (v.message && v.message.trim()) {
      lines.push('', `*Message:* ${v.message}`);
    }
    lines.push('', 'Please confirm my appointment. Thank you.');

    const text = encodeURIComponent(lines.join('\n'));
    window.open(`https://wa.me/923247734135?text=${text}`, '_blank', 'noopener');
  }
}
