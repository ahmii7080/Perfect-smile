import { Component, OnInit, inject, signal } from '@angular/core';

import { RouterLink } from '@angular/router';
import { DataService } from '../../services/data.service';
import { ServiceItem } from '../../models/service.model';
import { ServiceCardComponent } from '../../components/service-card/service-card';
import { SeoService } from '../../services/seo.service';
import { StructuredDataService } from '../../services/structured-data.service';
import {
  BreadcrumbComponent,
  BreadcrumbItem,
} from '../../components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [RouterLink, ServiceCardComponent, BreadcrumbComponent],
  templateUrl: './services.html',
  styleUrl: './services.scss',
})
export class ServicesPage implements OnInit {
  private data = inject(DataService);
  private seo = inject(SeoService);
  private structuredData = inject(StructuredDataService);

  services = signal<ServiceItem[]>([]);

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', path: '/' },
    { label: 'Services', path: '/services' },
  ];

  constructor() {
    this.seo.set({
      title: 'Dental Services in Faisalabad',
      description:
        'Complete dental services in Faisalabad — implants, braces & aligners, crown & bridge, cosmetic dentistry, scaling, whitening, root canal, kids dentistry and extractions.',
      path: '/services',
      keywords: [
        'dental services Faisalabad',
        'dental treatment FSD',
        'zirconia crown Faisalabad',
        'root canal Faisalabad',
        'dental implants Faisalabad',
        'braces Faisalabad',
        'teeth whitening FSD',
        'dental clinic near D Ground',
      ],
    });
    this.structuredData.setBreadcrumb(this.breadcrumbs);
  }

  ngOnInit() {
    this.data.getServices().subscribe((list) => this.services.set(list));
  }
}
