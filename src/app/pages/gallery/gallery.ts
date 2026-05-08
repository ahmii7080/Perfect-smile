import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SmileSvgComponent, SmileTreatment } from '../../components/smile-svg/smile-svg';
import { DataService } from '../../services/data.service';

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
  imports: [CommonModule, SmileSvgComponent],
  templateUrl: './gallery.html',
  styleUrl: './gallery.scss'
})
export class GalleryPage implements OnInit {
  private data = inject(DataService);

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
