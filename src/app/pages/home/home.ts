import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  afterNextRender,
  computed,
  inject,
  signal,
} from '@angular/core';

import { NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { take } from 'rxjs';

import { DataService } from '../../services/data.service';
import { SeoService } from '../../services/seo.service';
import { StructuredDataService } from '../../services/structured-data.service';
import { ServiceItem } from '../../models/service.model';
import { Doctor } from '../../models/doctor.model';
import { BlogPost, Testimonial } from '../../models/appointment.model';
import { AREAS_SERVED, LOCAL_FAQS, SITE_KEYWORDS } from '../../data/clinic-info';

import { TestimonialCardComponent } from '../../components/testimonial-card/testimonial-card';
import { StatsCounterComponent } from '../../components/stats-counter/stats-counter';
import { BlogIllustrationComponent } from '../../components/blog-illustration/blog-illustration';

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
  imports: [RouterLink, NgOptimizedImage, TestimonialCardComponent, StatsCounterComponent, BlogIllustrationComponent],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomePage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('videoFrame') videoFrame?: ElementRef<HTMLElement>;
  private videoObserver?: IntersectionObserver;
  private reviewInterval?: number;

  // Hero floating-review carousel state
  reviewIndex = signal(0);
  reviewFading = signal(false);
  currentReview = computed(() => {
    const list = this.testimonials();
    if (!list.length) return null;
    return list[this.reviewIndex() % list.length];
  });
  private data = inject(DataService);

  services = signal<ServiceItem[]>([]);
  doctors = signal<Doctor[]>([]);
  testimonials = signal<Testimonial[]>([]);
  blog = signal<BlogPost[]>([]);

  videoPlaying = signal(false);

  // FAQ accordion state — which question is currently expanded.
  // -1 = all collapsed. Single-open accordion (clicking another collapses
  // the previous one) — simpler & cleaner than a multi-open variant.
  openFaq = signal<number>(-1);

  /** People-Also-Ask style local FAQs surfaced both in the rendered
   *  accordion AND in the FAQPage JSON-LD schema. */
  readonly faqs = LOCAL_FAQS;

  /** Neighborhood pills shown in the "Areas we serve" strip. */
  readonly areasServed = AREAS_SERVED;

  // Bento services tiles
  bento: BentoTile[] = [
    {
      slug: 'cosmetic-dentistry',
      title: 'Cosmetic Dentistry',
      desc: 'Smile design, hand-layered porcelain veneers & gum aesthetics.',
      icon: 'fa-wand-magic-sparkles',
      span: 'span-2-rows',
      chip: 'Most loved',
      chipClass: 'chip--gold',
      bg: 'linear-gradient(160deg,#0F7AB0 0%, #0A3A55 100%)',
      fg: '#fff',
    },
    {
      slug: 'dental-implants',
      title: 'Dental Implants',
      desc: 'Computer-guided 3D placement. Same-day temps available.',
      icon: 'fa-tooth',
      span: 'span-2-cols',
      chip: 'Premium',
      bg: 'linear-gradient(135deg,#FFF1D6 0%, #FAC775 100%)',
      fg: '#0A3A55',
    },
    {
      slug: 'orthodontics',
      title: 'Invisalign & Braces',
      desc: 'Discreet aligners and modern braces — adults welcome.',
      icon: 'fa-grip-lines',
      span: '',
      bg: '#fff',
      fg: '#0A3A55',
    },
    {
      slug: 'teeth-whitening',
      title: 'Whitening',
      desc: 'Up to 8 shades brighter in a single chair-side session.',
      icon: 'fa-sun',
      span: '',
      bg: 'linear-gradient(135deg,#FFE4DF 0%, #FF6B5C 100%)',
      fg: '#fff',
      chip: '90 min',
      chipClass: 'chip--coral',
    },
    {
      slug: 'pediatric-dentistry',
      title: 'Pediatric Care',
      desc: 'A fear-free clinic kids actually look forward to.',
      icon: 'fa-child-reaching',
      span: 'span-2-cols',
      bg: 'linear-gradient(135deg,#DCFCE7 0%, #7AD6C8 100%)',
      fg: '#0A3A55',
      chip: 'Family-friendly',
      chipClass: 'chip--mint',
    },
    {
      slug: 'advanced-general-dentistry',
      title: 'General Dentistry',
      desc: 'Routine check-ups, fillings, scaling and polishing — the foundations.',
      icon: 'fa-stethoscope',
      span: '',
      bg: '#0C4A6E',
      fg: '#fff',
    },
  ];

  whyRows: WhyRow[] = [
    {
      number: '01',
      eyebrow: 'One doctor, three specialties',
      title: 'A multi-disciplinary',
      italic: 'specialist',
      rest: ' under one roof',
      desc: 'Dr. Faizan Sheikh — BDS, ex-house surgeon at Sharif Hospital, Lahore — holds a diploma in Crown & Bridge, a Certificate in Orthodontics, and a Certificate in Implantology. That breadth means complex cases that usually need multiple referrals can be managed end-to-end here.',
      bullets: [
        'BDS — Bachelor of Dental Surgery',
        'Ex-House Surgeon — Sharif Hospital, Lahore',
        'Diploma in Crown & Bridge',
        'Certificate in Orthodontics',
        'Certificate in Implantology',
      ],
      visualBg: 'linear-gradient(135deg,#0EA5E9,#0C4A6E)',
      emoji: '🎓',
      reverse: false,
    },
    {
      number: '02',
      eyebrow: 'Strict clinical hygiene',
      title: 'Hospital-grade',
      italic: 'sterilization',
      rest: ' you can trust',
      desc: 'Sterile protocols, autoclave-cleaned instruments, and single-use disposables on every visit. Infection control is not negotiable — it is a baseline.',
      bullets: [
        'Autoclave-sterilised instruments',
        'Single-use disposables',
        'Strict barrier protocols',
        'Disinfected operatories between patients',
      ],
      visualBg: 'linear-gradient(135deg,#14B8A6,#0F766E)',
      emoji: '🛡️',
      reverse: true,
    },
    {
      number: '03',
      eyebrow: 'Honest, gentle, on time',
      title: 'Care that feels',
      italic: 'personal',
      rest: ', priced clearly',
      desc: 'Every treatment plan is written, itemised, and explained before any work begins. No upselling. No surprises. We respect your time and we respect your budget.',
      bullets: [
        'Detailed written quotes',
        'Comfortable payment plans',
        'On-time appointments',
        'No upselling, no pressure',
      ],
      visualBg: 'linear-gradient(135deg,#0284C7,#082F49)',
      emoji: '💙',
      reverse: false,
    },
  ];

  galleryTiles = [
    { label: 'Veneers', bg: 'linear-gradient(135deg,#1597D5,#0F7AB0)', icon: 'fa-gem' },
    { label: 'Whitening', bg: 'linear-gradient(135deg,#FAC775,#BA7517)', icon: 'fa-sun' },
    { label: 'Implants', bg: 'linear-gradient(135deg,#0F7AB0,#0A3A55)', icon: 'fa-tooth' },
    { label: 'Aligners', bg: 'linear-gradient(135deg,#3DAEE0,#1597D5)', icon: 'fa-grip-lines' },
    {
      label: 'Smile Design',
      bg: 'linear-gradient(135deg,#FF8A7A,#FF6B5C)',
      icon: 'fa-wand-magic-sparkles',
    },
    { label: 'Crowns', bg: 'linear-gradient(135deg,#0EA5E9,#0F7AB0)', icon: 'fa-crown' },
    { label: 'Bonding', bg: 'linear-gradient(135deg,#0A3A55,#1597D5)', icon: 'fa-paintbrush' },
    { label: 'Gum Lift', bg: 'linear-gradient(135deg,#7AD6C8,#0F7AB0)', icon: 'fa-leaf' },
  ];

  // The 3 specialty diplomas held by the lead doctor
  specialties = [
    {
      icon: 'fa-crown',
      title: 'Crown & Bridge',
      desc: 'Diploma-certified prosthodontic restorations — precise, lifelike and built to last.',
    },
    {
      icon: 'fa-grip-lines',
      title: 'Orthodontics',
      desc: 'Certificate orthodontist — discreet aligners and modern braces for adults and teens.',
    },
    {
      icon: 'fa-tooth',
      title: 'Implantology',
      desc: 'Certificate implantologist — computer-guided placement, premium implant systems.',
    },
  ];

  ngOnInit() {
    // `take(1)` makes each subscription auto-unsubscribe after its first
    // emission. Important for SSR: leaves no dangling subscriptions that
    // could keep the app from reaching stability before prerender capture.
    this.data
      .getServices()
      .pipe(take(1))
      .subscribe((list) => this.services.set(list.slice(0, 6)));
    this.data
      .getDoctors()
      .pipe(take(1))
      .subscribe((list) => this.doctors.set(list));
    this.data
      .getTestimonials()
      .pipe(take(1))
      .subscribe((list) => this.testimonials.set(list));
    this.data
      .getBlog()
      .pipe(take(1))
      .subscribe((list) => this.blog.set(list.slice(0, 3)));
  }

  private seo = inject(SeoService);
  private structuredData = inject(StructuredDataService);

  constructor() {
    // SEO surface for the homepage. Set in the constructor (not ngOnInit)
    // so the tags land in the SSR HTML response before component init runs.
    //
    // `noBrandSuffix: true` — home page IS the brand page, so we don't want
    // the "| The Perfect Smile Dental Clinic Faisalabad" suffix appended on
    // top of an already brand-named title (Seobility flags the repetition).
    //
    // Title + description both seed the H1 vocabulary ("crafting", "perfect
    // smiles") so search-engine on-page consistency checks pass — they
    // expect the visible H1 to overlap with title/description text.
    // Title kept under 580 px (Seobility ceiling) by trimming the verbose
    // "Dental Clinic & Implant Centre" phrasing down to "Dental & Implant
    // Clinic" — same keywords (dental, implant, clinic, Faisalabad), 7 chars
    // shorter. Description capped under 1000 px (≈ 160 chars) so Google
    // doesn't truncate the SERP snippet.
    this.seo.set({
      title: 'The Perfect Smile — Dental & Implant Clinic in Faisalabad',
      description:
        "Faisalabad's multi-specialist dental & implant clinic. Crown & bridge, orthodontics, implants, cosmetic dentistry by Dr. Faizan Sheikh. Free WhatsApp consult.",
      path: '/',
      noBrandSuffix: true,
      // Local-intent keywords for non-Google search engines + directory
      // aggregators. Google itself ignores meta keywords (since 2009);
      // the real local-pack lift is the `knowsAbout` + `areaServed`
      // arrays in the Dentist JSON-LD set in app.ts plus the FAQPage
      // schema below (which is what actually wins "People Also Ask"
      // rich-result placements).
      keywords: [...SITE_KEYWORDS.brand],
    });

    // FAQPage rich result — surfaces expandable Q&A directly in Google
    // SERP. Each answer naturally repeats local phrases ("Faisalabad",
    // "FSD", "D Ground") so the page earns long-tail coverage without
    // visible-text keyword stuffing. Mapped from clinic-info's `{q, a}`
    // shape to the StructuredData service's `{question, answer}` shape.
    this.structuredData.setFaqPage(
      LOCAL_FAQS.map((f) => ({ question: f.q, answer: f.a })),
    );

    // Hero review-card auto-cycle. Browser only — `afterNextRender` keeps
    // the timer (and its `window.*` calls) out of the prerender pass.
    afterNextRender(() => {
      this.reviewInterval = window.setInterval(() => {
        if (!this.testimonials().length) return;
        this.reviewFading.set(true);
        window.setTimeout(() => {
          this.reviewIndex.update((v) => v + 1);
          this.reviewFading.set(false);
        }, 220);
      }, 5000);
    });
  }

  playVideo() {
    this.videoPlaying.set(true);
  }

  /** Toggle the FAQ accordion. Clicking an open row collapses it; clicking
   *  a closed row collapses any open sibling and opens this one. */
  toggleFaq(i: number) {
    this.openFaq.set(this.openFaq() === i ? -1 : i);
  }

  /**
   * Auto-start the clinic video when the section scrolls into view.
   * Muted is required for autoplay in modern browsers — user can unmute manually.
   */
  ngAfterViewInit() {
    if (!this.videoFrame || typeof IntersectionObserver === 'undefined') return;
    this.videoObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !this.videoPlaying()) {
            this.videoPlaying.set(true);
            this.videoObserver?.disconnect();
          }
        }
      },
      { threshold: 0.4 },
    );
    this.videoObserver.observe(this.videoFrame.nativeElement);
  }

  ngOnDestroy() {
    this.videoObserver?.disconnect();
    if (this.reviewInterval) clearInterval(this.reviewInterval);
  }
}
