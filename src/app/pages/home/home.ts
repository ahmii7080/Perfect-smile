import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { DataService } from '../../services/data.service';
import { ServiceItem } from '../../models/service.model';
import { Doctor } from '../../models/doctor.model';
import { BlogPost, Testimonial } from '../../models/appointment.model';

import { TestimonialCardComponent } from '../../components/testimonial-card/testimonial-card';
import { StatsCounterComponent } from '../../components/stats-counter/stats-counter';

interface BentoTile {
  slug: string;
  title: string;
  desc: string;
  icon: string;
  span: string;
  bg: string;
  fg: string;
  chip?: string;
  chipClass?: string;
}

interface WhyRow {
  number: string;
  eyebrow: string;
  title: string;
  italic: string;
  rest: string;
  desc: string;
  bullets: string[];
  visualBg: string;
  emoji: string;
  reverse: boolean;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    TestimonialCardComponent, StatsCounterComponent
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomePage implements OnInit {
  private data = inject(DataService);

  services    = signal<ServiceItem[]>([]);
  doctors     = signal<Doctor[]>([]);
  testimonials = signal<Testimonial[]>([]);
  blog        = signal<BlogPost[]>([]);

  videoPlaying = signal(false);

  // Bento services tiles
  bento: BentoTile[] = [
    { slug: 'cosmetic-dentistry', title: 'Cosmetic Dentistry', desc: 'Smile design, hand-layered porcelain veneers & gum aesthetics.',
      icon: 'fa-wand-magic-sparkles', span: 'span-2-rows', chip: 'Most loved', chipClass: 'chip--gold',
      bg: 'linear-gradient(160deg,#0F7AB0 0%, #0A3A55 100%)', fg: '#fff' },
    { slug: 'dental-implants', title: 'Dental Implants', desc: 'Computer-guided 3D placement. Same-day temps available.',
      icon: 'fa-tooth', span: 'span-2-cols', chip: 'Premium',
      bg: 'linear-gradient(135deg,#FFF1D6 0%, #FAC775 100%)', fg: '#0A3A55' },
    { slug: 'orthodontics', title: 'Invisalign & Braces', desc: 'Discreet aligners and modern braces — adults welcome.',
      icon: 'fa-grip-lines', span: '',
      bg: '#fff', fg: '#0A3A55' },
    { slug: 'teeth-whitening', title: 'Whitening', desc: 'Up to 8 shades brighter in a single chair-side session.',
      icon: 'fa-sun', span: '',
      bg: 'linear-gradient(135deg,#FFE4DF 0%, #FF6B5C 100%)', fg: '#fff', chip: '90 min', chipClass: 'chip--coral' },
    { slug: 'pediatric-dentistry', title: 'Pediatric Care', desc: 'A fear-free clinic kids actually look forward to.',
      icon: 'fa-child-reaching', span: 'span-2-cols',
      bg: 'linear-gradient(135deg,#DCFCE7 0%, #7AD6C8 100%)', fg: '#0A3A55', chip: 'Family-friendly', chipClass: 'chip--mint' },
    { slug: 'emergency-care', title: 'Emergency 24/7', desc: 'After-hours WhatsApp triage. We answer in minutes.',
      icon: 'fa-truck-medical', span: '',
      bg: '#0A3A55', fg: '#fff' }
  ];

  whyRows: WhyRow[] = [
    {
      number: '01',
      eyebrow: 'Trained where it matters',
      title: 'Doctors trained in', italic: 'London, New York', rest: ' & beyond',
      desc: 'Every specialist on our team carries a postgraduate qualification from the UK, US, or EU. We don\'t just offer treatment — we offer the same standard of care you\'d find in Harley Street.',
      bullets: ['MSc Implant Dentistry — Manchester, UK', 'FCPS Operative — CPSP', 'MSc Endodontics — NYU, USA', 'Invisalign Diamond Provider'],
      visualBg: 'linear-gradient(135deg,#0F7AB0,#0A3A55)',
      emoji: '🎓',
      reverse: false
    },
    {
      number: '02',
      eyebrow: 'Equipment that thinks',
      title: 'A clinic powered by', italic: 'digital', rest: ' & precise',
      desc: '3D CBCT scanners, iTero digital impressions, surgical microscopes, and CAD-CAM workflows. No goopy moulds. No guessing. Just predictable, beautifully precise outcomes.',
      bullets: ['3D CBCT — guided implant surgery', 'iTero — digital, scan-only impressions', 'Microscope endodontics', 'CAD-CAM same-day crowns'],
      visualBg: 'linear-gradient(135deg,#FAC775,#BA7517)',
      emoji: '🔬',
      reverse: true
    },
    {
      number: '03',
      eyebrow: 'Sterile, transparent, kind',
      title: 'Hospital-grade', italic: 'sterilization', rest: ' & honest pricing',
      desc: 'Class B autoclaves. Single-use disposables. Surgical-room protocols. And every quote is written, itemised, and explained — never inflated.',
      bullets: ['Class B autoclave sterilization', 'Single-use surgical kits', 'Detailed written quotes', '0% interest payment plans'],
      visualBg: 'linear-gradient(135deg,#FF8A7A,#FF6B5C)',
      emoji: '🛡️',
      reverse: false
    }
  ];

  galleryTiles = [
    { label: 'Veneers',      bg: 'linear-gradient(135deg,#1597D5,#0F7AB0)', icon: 'fa-gem' },
    { label: 'Whitening',    bg: 'linear-gradient(135deg,#FAC775,#BA7517)', icon: 'fa-sun' },
    { label: 'Implants',     bg: 'linear-gradient(135deg,#0F7AB0,#0A3A55)', icon: 'fa-tooth' },
    { label: 'Aligners',     bg: 'linear-gradient(135deg,#3DAEE0,#1597D5)', icon: 'fa-grip-lines' },
    { label: 'Smile Design', bg: 'linear-gradient(135deg,#FF8A7A,#FF6B5C)', icon: 'fa-wand-magic-sparkles' },
    { label: 'Crowns',       bg: 'linear-gradient(135deg,#0EA5E9,#0F7AB0)', icon: 'fa-crown' },
    { label: 'Bonding',      bg: 'linear-gradient(135deg,#0A3A55,#1597D5)', icon: 'fa-paintbrush' },
    { label: 'Gum Lift',     bg: 'linear-gradient(135deg,#7AD6C8,#0F7AB0)', icon: 'fa-leaf' }
  ];

  ngOnInit() {
    this.data.getServices().subscribe(list => this.services.set(list.slice(0, 6)));
    this.data.getDoctors().subscribe(list => this.doctors.set(list.slice(0, 4)));
    this.data.getTestimonials().subscribe(list => this.testimonials.set(list.slice(0, 3)));
    this.data.getBlog().subscribe(list => this.blog.set(list.slice(0, 3)));
  }

  playVideo() { this.videoPlaying.set(true); }
}
