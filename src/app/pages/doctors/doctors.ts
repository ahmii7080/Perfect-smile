import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '../../services/data.service';
import { Doctor } from '../../models/doctor.model';

@Component({
  selector: 'app-doctors',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './doctors.html',
  styleUrl: './doctors.scss'
})
export class DoctorsPage implements OnInit {
  private data = inject(DataService);
  doctors = signal<Doctor[]>([]);

  ngOnInit() {
    this.data.getDoctors().subscribe(list => this.doctors.set(list));
  }
}
