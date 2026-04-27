import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { AppointmentService } from '../../services/appointment.service';
import { ServiceItem } from '../../models/service.model';
import { Doctor } from '../../models/doctor.model';

@Component({
  selector: 'app-appointment',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './appointment.html',
  styleUrl: './appointment.scss'
})
export class AppointmentPage implements OnInit {
  private fb     = inject(FormBuilder);
  private data   = inject(DataService);
  private appts  = inject(AppointmentService);

  services = signal<ServiceItem[]>([]);
  doctors  = signal<Doctor[]>([]);

  timeSlots = ['10:00 AM', '12:00 PM', '02:00 PM', '04:00 PM', '06:00 PM'];

  toast = signal<{ ok: boolean; msg: string; ref?: string } | null>(null);
  submitting = signal(false);

  today = new Date().toISOString().slice(0, 10);

  form: FormGroup = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    phone:    ['', [Validators.required, Validators.pattern(/^[+0-9\-\s()]{8,18}$/)]],
    email:    ['', [Validators.required, Validators.email]],
    service:  ['', Validators.required],
    doctor:   ['any'],
    date:     ['', Validators.required],
    timeSlot: ['', Validators.required],
    message:  ['']
  });

  ngOnInit() {
    this.data.getServices().subscribe(list => this.services.set(list));
    this.data.getDoctors().subscribe(list => this.doctors.set(list));
  }

  pickSlot(slot: string) { this.form.patchValue({ timeSlot: slot }); }

  invalid(field: string) {
    const c = this.form.get(field);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.appts.submit(this.form.value).subscribe(res => {
      this.toast.set({ ok: true, msg: 'Appointment confirmed!', ref: res.reference });
      this.form.reset({ doctor: 'any' });
      this.submitting.set(false);
      setTimeout(() => this.toast.set(null), 6000);
    });
  }
}
