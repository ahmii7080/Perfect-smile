import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DataService } from '../../services/data.service';
import { ServiceItem } from '../../models/service.model';
import { SeoService } from '../../services/seo.service';
import { StructuredDataService } from '../../services/structured-data.service';
import { BreadcrumbComponent, BreadcrumbItem } from '../../components/breadcrumb/breadcrumb.component';
import { RelatedServicesComponent } from '../../components/related-services/related-services.component';

@Component({
  selector: 'app-service-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, BreadcrumbComponent, RelatedServicesComponent],
  templateUrl: './service-detail.html',
  styleUrl: './service-detail.scss'
})
export class ServiceDetailPage implements OnInit {
  private route          = inject(ActivatedRoute);
  private data           = inject(DataService);
  private seo            = inject(SeoService);
  private structuredData = inject(StructuredDataService);

  service     = signal<ServiceItem | undefined>(undefined);
  related     = signal<ServiceItem[]>([]);
  openFaq     = signal<number>(0);
  breadcrumbs = signal<BreadcrumbItem[]>([]);

  ngOnInit() {
    // The resolver has already fetched `service` before the route activated,
    // so the data is available synchronously from `snapshot.data`. This is
    // what makes the per-service SEO tags + JSON-LD land in the prerendered
    // HTML reliably — no waiting on an async subscription.
    const snapshot = this.route.snapshot;
    const slug     = snapshot.paramMap.get('slug') ?? '';
    const s        = snapshot.data['service'] as ServiceItem | undefined;

    this.service.set(s);
    this.applySeo(slug, s);

    // Related services list — non-critical for SEO, can stay async.
    this.data.getServices().subscribe(list => {
      this.related.set(list.filter(x => x.slug !== slug).slice(0, 3));
    });
  }

  toggleFaq(i: number) {
    this.openFaq.set(this.openFaq() === i ? -1 : i);
  }

  /**
   * Drive title + description + canonical + JSON-LD off the loaded service.
   * Falls back to a clearly-marked 404 surface (noindex) when the slug doesn't
   * resolve — prevents thin "Service not found" pages from getting indexed.
   */
  private applySeo(slug: string, s: ServiceItem | undefined): void {
    const path = `/services/${slug}`;

    if (!s) {
      this.seo.set({
        title:       'Service Not Found',
        description: 'The requested dental service could not be found at The Perfect Smile clinic.',
        path,
        noindex:     true
      });
      this.breadcrumbs.set([
        { label: 'Home',     path: '/' },
        { label: 'Services', path: '/services' }
      ]);
      return;
    }

    // Trim the SEO description to ~155 chars — long summaries get truncated
    // in SERP and lose the "Faisalabad" hook at the end.
    const seedSummary = s.summary || s.tagline || s.title;
    const description = this.truncate(
      `${seedSummary} Affordable, expert ${s.title.toLowerCase()} treatment in Faisalabad at The Perfect Smile Dental Clinic.`,
      158
    );

    this.seo.set({
      title:       `${s.title} in Faisalabad`,
      description,
      path
    });

    // MedicalProcedure → Schema.org rich result for medical services
    this.structuredData.setMedicalProcedure({
      name:        s.title,
      slug:        s.slug,
      description: seedSummary,
      steps:       s.procedure ?? []
    });

    // FAQPage → expandable FAQ accordions can show directly inside Google SERP
    if (s.faqs?.length) {
      this.structuredData.setFaqPage(
        s.faqs.map(f => ({ question: f.q, answer: f.a }))
      );
    }

    const crumbs: BreadcrumbItem[] = [
      { label: 'Home',     path: '/' },
      { label: 'Services', path: '/services' },
      { label: s.title,    path }
    ];
    this.breadcrumbs.set(crumbs);
    this.structuredData.setBreadcrumb(crumbs);
  }

  private truncate(text: string, max: number): string {
    return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
  }
}
