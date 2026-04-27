import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

interface GalleryCase {
  category: string;
  title: string;
  description: string;
  before: string;
  after: string;
  icon: string;
}

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './gallery.html',
  styleUrl: './gallery.scss'
})
export class GalleryPage {
  filters = ['All', 'Veneers', 'Whitening', 'Implants', 'Braces', 'Crowns'];
  active  = signal('All');

  cases: GalleryCase[] = [
    { category: 'Veneers',   title: 'Full-arch porcelain veneers',
      description: '8 hand-layered porcelain veneers — closing diastema and balancing tooth proportions.',
      before: 'linear-gradient(135deg,#94B5C8,#56758C)', after: 'linear-gradient(135deg,#1597D5,#0F7AB0)', icon: 'fa-gem' },
    { category: 'Whitening', title: '6-shade in-chair whitening',
      description: 'Single 90-minute session — A3.5 to BL2.',
      before: 'linear-gradient(135deg,#C9A77D,#8C6B43)', after: 'linear-gradient(135deg,#FAC775,#fff5db)', icon: 'fa-sun' },
    { category: 'Implants',  title: 'Single-tooth implant + crown',
      description: 'Computer-guided placement, ceramic crown bonded at 3 months.',
      before: 'linear-gradient(135deg,#647A8C,#33485C)', after: 'linear-gradient(135deg,#0F7AB0,#0A3A55)', icon: 'fa-tooth' },
    { category: 'Braces',    title: 'Invisalign clear aligners',
      description: '14-month treatment — moderate crowding to ideal alignment.',
      before: 'linear-gradient(135deg,#A9C0CF,#6386A0)', after: 'linear-gradient(135deg,#3DAEE0,#1597D5)', icon: 'fa-grip-lines' },
    { category: 'Crowns',    title: 'Posterior zirconia crowns',
      description: 'Two molars rebuilt with monolithic zirconia — natural shade match.',
      before: 'linear-gradient(135deg,#7A8E9C,#3F5563)', after: 'linear-gradient(135deg,#0EA5E9,#0F7AB0)', icon: 'fa-crown' },
    { category: 'Veneers',   title: 'Minimal-prep smile makeover',
      description: '6 ultra-thin veneers — minimal enamel reduction.',
      before: 'linear-gradient(135deg,#B7C5D2,#7A8E9C)', after: 'linear-gradient(135deg,#1597D5,#3DAEE0)', icon: 'fa-wand-magic-sparkles' },
    { category: 'Implants',  title: 'All-on-4 full-arch reconstruction',
      description: 'Four implants supporting a full hybrid bridge — life-changing result.',
      before: 'linear-gradient(135deg,#586674,#33424F)', after: 'linear-gradient(135deg,#0A3A55,#1597D5)', icon: 'fa-tooth' },
    { category: 'Whitening', title: 'Take-home tray whitening',
      description: '3 weeks of guided home whitening with desensitiser.',
      before: 'linear-gradient(135deg,#B69772,#7A5C3D)', after: 'linear-gradient(135deg,#FAC775,#FAFAF7)', icon: 'fa-sun' },
    { category: 'Braces',    title: 'Lingual braces, 18 months',
      description: 'Hidden behind teeth — invisible orthodontics.',
      before: 'linear-gradient(135deg,#9DB1BD,#566876)', after: 'linear-gradient(135deg,#3DAEE0,#0F7AB0)', icon: 'fa-grip-lines' }
  ];

  filtered = computed(() =>
    this.active() === 'All' ? this.cases : this.cases.filter(c => c.category === this.active())
  );

  lightbox = signal<GalleryCase | null>(null);

  setFilter(f: string) { this.active.set(f); }
  open(c: GalleryCase) { this.lightbox.set(c); document.body.style.overflow = 'hidden'; }
  close()              { this.lightbox.set(null); document.body.style.overflow = ''; }
}
