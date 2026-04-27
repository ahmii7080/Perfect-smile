import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '../../services/data.service';
import { Doctor } from '../../models/doctor.model';
import { DoctorCardComponent } from '../../components/doctor-card/doctor-card';

@Component({
  selector: 'app-doctors',
  standalone: true,
  imports: [CommonModule, RouterLink, DoctorCardComponent],
  templateUrl: './doctors.html',
  styleUrl: './doctors.scss'
})
export class DoctorsPage implements OnInit {
  private data = inject(DataService);
  doctors = signal<Doctor[]>([]);
  selected = signal<Doctor | null>(null);

  ngOnInit() {
    this.data.getDoctors().subscribe(list => this.doctors.set(list));
  }

  open(d: Doctor) { this.selected.set(d); document.body.style.overflow = 'hidden'; }
  close()         { this.selected.set(null); document.body.style.overflow = ''; }
}
