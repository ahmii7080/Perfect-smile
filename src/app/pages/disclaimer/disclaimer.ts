import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../services/seo.service';
import { StructuredDataService } from '../../services/structured-data.service';
import { BreadcrumbComponent, BreadcrumbItem } from '../../components/breadcrumb/breadcrumb.component';
import { CLINIC_INFO } from '../../data/clinic-info';

/**
 * Medical Disclaimer — explicitly disclaims that website content is
 * professional medical/dental advice. Required for any health-niche site
 * to:
 *   1. Reduce legal exposure when patients act on blog content without
 *      consulting us.
 *   2. Pass AdSense / payment-gateway / professional-body review (medical
 *      sites without a disclaimer get flagged as misleading).
 *   3. Match the EAT (Expertise, Authoritativeness, Trustworthiness)
 *      signals Google explicitly looks for in YMYL ("Your Money or Your
 *      Life") niches like dentistry.
 */
@Component({
  selector: 'app-disclaimer',
  standalone: true,
  imports: [RouterLink, BreadcrumbComponent],
  templateUrl: './disclaimer.html',
  styleUrl: '../legal-shared.scss',
})
export class DisclaimerPage {
  private seo            = inject(SeoService);
  private structuredData = inject(StructuredDataService);

  readonly clinic = CLINIC_INFO;
  readonly lastUpdated = 'May 2026';

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', path: '/' },
    { label: 'Medical Disclaimer', path: '/disclaimer' },
  ];

  constructor() {
    this.seo.set({
      title: 'Medical Disclaimer',
      description:
        'Important medical information disclaimer for content on theperfectsmileclinic.com. Website information is educational only and is not a substitute for professional dental advice.',
      path: '/disclaimer',
    });
    this.structuredData.setBreadcrumb(this.breadcrumbs);
  }
}
