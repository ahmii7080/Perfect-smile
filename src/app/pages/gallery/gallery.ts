import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { SmileSvgComponent, SmileTreatment } from '../../components/smile-svg/smile-svg';
import { DataService } from '../../services/data.service';
import { SeoService } from '../../services/seo.service';
import { StructuredDataService } from '../../services/structured-data.service';
import {
  BreadcrumbComponent,
  BreadcrumbItem,
} from '../../components/breadcrumb/breadcrumb.component';

interface GalleryCase {
  category: string;
  title: string;
  description: string;
  treatment: SmileTreatment;
  icon: string;
  /** Optional uploaded BEFORE photo. If set, shown instead of the SVG illustration. */
  beforeImage?: string;
  afterImage?: string;
}

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [SmileSvgComponent, BreadcrumbComponent, NgOptimizedImage],
  templateUrl: './gallery.html',
  styleUrl: './gallery.scss',
})
export class GalleryPage implements OnInit {
  private data = inject(DataService);
  private seo = inject(SeoService);
  private structuredData = inject(StructuredDataService);

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', path: '/' },
    { label: 'Gallery', path: '/gallery' },
  ];

  constructor() {
    this.seo.set({
      // Title used to be "Smile Gallery — Before & After" (no city anchor).
      // Adding "Faisalabad" gets the page into local "veneers Faisalabad
      // before after" + "smile makeover Faisalabad" SERPs, which is exactly
      // who lands on this page from image-search.
      // Trimmed from the longer "Before & After Cases in Faisalabad"
      // phrasing — keeps headline keywords (smile, Faisalabad, before
      // & after) and leaves room for the brand suffix under 65 chars.
      title: 'Smile Gallery — Before & After in Faisalabad',
      description:
        'Real patient before-and-after smile transformations at The Perfect Smile, Faisalabad — veneers, whitening, implants, braces, crowns and full smile design cases.',
      path: '/gallery',
      keywords: [
        'smile gallery Faisalabad',
        'before after dental Faisalabad',
        'veneers before after Faisalabad',
        'smile makeover Faisalabad',
        'dental transformation FSD',
        'teeth whitening before after Faisalabad',
        'implant before after Faisalabad',
        'best smile design Faisalabad',
      ],
    });
    this.structuredData.setBreadcrumb(this.breadcrumbs);
  }

  filters = ['All', 'Veneers', 'Whitening', 'Implants', 'Braces', 'Crowns'];
  active = signal('All');
  cases = signal<GalleryCase[]>([]);

  /** Incremental reveal — show the first 10 cases, then 10 more per
   *  "Show more cases" click. Switching the category filter snaps the
   *  count back to 10 so the user starts at the top of the new bucket. */
  readonly BATCH = 10;
  visibleCount = signal(this.BATCH);

  filtered = computed(() => {
    const all = this.cases();
    return this.active() === 'All' ? all : all.filter((c) => c.category === this.active());
  });

  /** Currently-rendered slice of `filtered()`. Grows by `BATCH` per click. */
  visible = computed(() => this.filtered().slice(0, this.visibleCount()));
  /** True when at least one case is hidden behind "Show more". */
  hasMore = computed(() => this.filtered().length > this.visibleCount());

  lightbox = signal<GalleryCase | null>(null);

  ngOnInit() {
    this.data.getGalleryCases().subscribe((rows) => {
      this.cases.set(
        rows.map((r) => ({
          category: r.category,
          title: r.title,
          description: r.description,
          treatment: r.treatment as SmileTreatment,
          icon: r.icon,
          beforeImage: r.beforeImage,
          afterImage: r.afterImage,
        })),
      );
    });
  }

  setFilter(f: string) {
    this.active.set(f);
    this.visibleCount.set(this.BATCH);
  }
  showMore() {
    this.visibleCount.update((v) => v + this.BATCH);
  }
  open(c: GalleryCase) {
    this.lightbox.set(c);
    document.body.style.overflow = 'hidden';
  }
  close() {
    this.lightbox.set(null);
    document.body.style.overflow = '';
  }
}
