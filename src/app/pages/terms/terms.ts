import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../services/seo.service';
import { StructuredDataService } from '../../services/structured-data.service';
import { BreadcrumbComponent, BreadcrumbItem } from '../../components/breadcrumb/breadcrumb.component';
import { CLINIC_INFO } from '../../data/clinic-info';

/**
 * Terms of Service — site usage rules, appointment cancellation policy,
 * liability boundaries. Pairs with the Privacy Policy + Medical Disclaimer
 * for a complete legal triple (most patients won't read it, but its
 * absence is what triggers AdSense rejections, payment-gateway pushback,
 * and "shady site" Google reputation signals).
 */
@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [RouterLink, BreadcrumbComponent],
  templateUrl: './terms.html',
  styleUrl: '../legal-shared.scss',
})
export class TermsPage {
  private seo            = inject(SeoService);
  private structuredData = inject(StructuredDataService);

  readonly clinic = CLINIC_INFO;
  readonly lastUpdated = 'May 2026';

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', path: '/' },
    { label: 'Terms of Service', path: '/terms' },
  ];

  constructor() {
    this.seo.set({
      title: 'Terms of Service',
      description:
        'Terms governing your use of theperfectsmileclinic.com and the appointment-booking, WhatsApp consultation and content services offered by The Perfect Smile Dental Clinic Faisalabad.',
      path: '/terms',
    });
    this.structuredData.setBreadcrumb(this.breadcrumbs);
  }
}
