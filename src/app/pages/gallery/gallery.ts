import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SmileSvgComponent, SmileTreatment } from '../../components/smile-svg/smile-svg';

interface GalleryCase {
  category: string;
  title: string;
  description: string;
  treatment: SmileTreatment;
  icon: string;
}

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, SmileSvgComponent],
  templateUrl: './gallery.html',
  styleUrl: './gallery.scss'
})
export class GalleryPage {
  filters = ['All', 'Veneers', 'Whitening', 'Implants', 'Braces', 'Crowns'];
  active  = signal('All');

  cases: GalleryCase[] = [
    { category: 'Veneers',   title: 'Full-arch porcelain veneers',
      description: '8 hand-layered porcelain veneers — closing diastema and balancing tooth proportions.',
      treatment: 'veneers', icon: 'fa-gem' },
    { category: 'Whitening', title: '6-shade in-chair whitening',
      description: 'Single 90-minute session — A3.5 to BL2.',
      treatment: 'whitening', icon: 'fa-sun' },
    { category: 'Implants',  title: 'Single-tooth implant + crown',
      description: 'Computer-guided placement, ceramic crown bonded at 3 months.',
      treatment: 'implants', icon: 'fa-tooth' },
    { category: 'Braces',    title: 'Invisalign clear aligners',
      description: '14-month treatment — moderate crowding to ideal alignment.',
      treatment: 'braces', icon: 'fa-grip-lines' },
    { category: 'Crowns',    title: 'Posterior zirconia crowns',
      description: 'Two molars rebuilt with monolithic zirconia — natural shade match.',
      treatment: 'crowns', icon: 'fa-crown' },
    { category: 'Veneers',   title: 'Minimal-prep smile makeover',
      description: '6 ultra-thin veneers — minimal enamel reduction.',
      treatment: 'makeover', icon: 'fa-wand-magic-sparkles' },
    { category: 'Implants',  title: 'All-on-4 full-arch reconstruction',
      description: 'Four implants supporting a full hybrid bridge — life-changing result.',
      treatment: 'implants', icon: 'fa-tooth' },
    { category: 'Whitening', title: 'Take-home tray whitening',
      description: '3 weeks of guided home whitening with desensitiser.',
      treatment: 'whitening', icon: 'fa-sun' },
    { category: 'Braces',    title: 'Lingual braces, 18 months',
      description: 'Hidden behind teeth — invisible orthodontics.',
      treatment: 'braces', icon: 'fa-grip-lines' }
  ];

  filtered = computed(() =>
    this.active() === 'All' ? this.cases : this.cases.filter(c => c.category === this.active())
  );

  lightbox = signal<GalleryCase | null>(null);

  setFilter(f: string) { this.active.set(f); }
  open(c: GalleryCase) { this.lightbox.set(c); document.body.style.overflow = 'hidden'; }
  close()              { this.lightbox.set(null); document.body.style.overflow = ''; }
}
