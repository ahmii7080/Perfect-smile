import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SmileSvgComponent, SmileTreatment } from '../../components/smile-svg/smile-svg';
import { DataService } from '../../services/data.service';
import { SeoService } from '../../services/seo.service';
import { StructuredDataService } from '../../services/structured-data.service';
import { BreadcrumbComponent, BreadcrumbItem } from '../../components/breadcrumb/breadcrumb.component';

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
  imports: [CommonModule, SmileSvgComponent, BreadcrumbComponent],
  templateUrl: './gallery.html',
  styleUrl: './gallery.scss'
})
export class GalleryPage implements OnInit {
  private data           = inject(DataService);
  private seo            = inject(SeoService);
  private structuredData = inject(StructuredDataService);

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home',    path: '/' },
    { label: 'Gallery', path: '/gallery' }
  ];

  constructor() {
    this.seo.set({
      title: 'Smile Gallery — Before & After',
      description:
        'Real patient before-and-after smile transformations at The Perfect Smile, Faisalabad — veneers, whitening, implants, braces, crowns and full smile design cases.',
      path: '/gallery'
    });
    this.structuredData.setBreadcrumb(this.breadcrumbs);
  }

  filters = ['All', 'Veneers', 'Whitening', 'Implants', 'Braces', 'Crowns'];
  active  = signal('All');
  cases   = signal<GalleryCase[]>([]);

  filtered = computed(() => {
    const all = this.cases();
    return this.active() === 'All' ? all : all.filter(c => c.category === this.active());
  });

  lightbox = signal<GalleryCase | null>(null);

  ngOnInit() {
    this.data.getGalleryCases().subscribe(rows => {
      this.cases.set(rows.map(r => ({
        category:    r.category,
        title:       r.title,
        description: r.description,
        treatment:   r.treatment as SmileTreatment,
        icon:        r.icon,
        beforeImage: r.beforeImage,
        afterImage:  r.afterImage
      })));
    });
  }

  setFilter(f: string) { this.active.set(f); }
  open(c: GalleryCase) { this.lightbox.set(c); document.body.style.overflow = 'hidden'; }
  close()              { this.lightbox.set(null); document.body.style.overflow = ''; }
}
