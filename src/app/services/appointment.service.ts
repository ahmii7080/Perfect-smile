import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Appointment } from '../models/appointment.model';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  private store: Appointment[] = [];

  submit(appt: Appointment): Observable<{ ok: true; reference: string }> {
    this.store.push(appt);
    const reference = 'PS-' + Date.now().toString().slice(-6);
    return of({ ok: true as const, reference }).pipe(delay(700));
  }

  list(): Appointment[] {
    return [...this.store];
  }
}
