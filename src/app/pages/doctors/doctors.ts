import { Component, OnInit, inject, signal } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '../../services/data.service';
import { Doctor } from '../../models/doctor.model';
import { SeoService } from '../../services/seo.service';
import { StructuredDataService } from '../../services/structured-data.service';
import {
  BreadcrumbComponent,
  BreadcrumbItem,
} from '../../components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-doctors',
  standalone: true,
  imports: [RouterLink, BreadcrumbComponent, NgOptimizedImage],
  templateUrl: './doctors.html',
  styleUrl: './doctors.scss',
})
export class DoctorsPage implements OnInit {
  private data = inject(DataService);
  private seo = inject(SeoService);
  private structuredData = inject(StructuredDataService);

  doctors = signal<Doctor[]>([]);

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', path: '/' },
    { label: 'Doctors', path: '/doctors' },
  ];

  constructor() {
    // Page-level SEO. Per-doctor headline updates after data resolves
    // (below) so the H1 + meta both reflect the doctor's actual name.
    this.seo.set({
      title: 'Our Dentist in Faisalabad — Dr. Faizan Sheikh',
      description:
        'Meet Dr. Faizan Sheikh — BDS, multi-disciplinary dental specialist at The Perfect Smile Faisalabad. Diplomas in Crown & Bridge, Orthodontics and Implantology.',
      path: '/doctors',
    });
    this.structuredData.setBreadcrumb(this.breadcrumbs);
  }

  ngOnInit() {
    this.data.getDoctors().subscribe((list) => this.doctors.set(list));
  }
}
