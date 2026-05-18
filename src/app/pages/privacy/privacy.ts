import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../services/seo.service';
import { StructuredDataService } from '../../services/structured-data.service';
import { BreadcrumbComponent, BreadcrumbItem } from '../../components/breadcrumb/breadcrumb.component';
import { CLINIC_INFO } from '../../data/clinic-info';

/**
 * Privacy Policy — patient data handling, cookies, third-party services.
 *
 * Standalone legal page (not blog-driven). Content is static and lives in
 * the template so changes go through code review like the rest of the
 * site — never accidentally edited via admin. SEO is `noindex: false`
 * (these pages need to be findable) but priority is intentionally low so
 * they don't compete with treatment pages in the SERP.
 */
@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [RouterLink, BreadcrumbComponent],
  templateUrl: './privacy.html',
  styleUrl: '../legal-shared.scss',
})
export class PrivacyPage {
  private seo            = inject(SeoService);
  private structuredData = inject(StructuredDataService);

  readonly clinic = CLINIC_INFO;
  /** Effective-from date — bump whenever the policy materially changes. */
  readonly lastUpdated = 'May 2026';

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', path: '/' },
    { label: 'Privacy Policy', path: '/privacy' },
  ];

  constructor() {
    this.seo.set({
      title: 'Privacy Policy',
      description:
        'How The Perfect Smile Dental Clinic Faisalabad collects, uses and protects your personal information when you visit our website or book an appointment.',
      path: '/privacy',
    });
    this.structuredData.setBreadcrumb(this.breadcrumbs);
  }
}
