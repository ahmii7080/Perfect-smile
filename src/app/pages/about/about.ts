import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../services/seo.service';
import { StructuredDataService } from '../../services/structured-data.service';
import { BreadcrumbComponent, BreadcrumbItem } from '../../components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink, BreadcrumbComponent],
  templateUrl: './about.html',
  styleUrl: './about.scss'
})
export class AboutPage {
  private seo            = inject(SeoService);
  private structuredData = inject(StructuredDataService);

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home',  path: '/' },
    { label: 'About', path: '/about' }
  ];

  constructor() {
    this.seo.set({
      title: 'About — Our Faisalabad Dental Clinic',
      description:
        'Meet The Perfect Smile — a Faisalabad dental clinic led by Dr. Faizan Sheikh, a multi-disciplinary specialist holding diplomas in Crown & Bridge, Orthodontics & Implantology.',
      path: '/about'
    });
    this.structuredData.setBreadcrumb(this.breadcrumbs);
  }

  values = [
    { n: '01', title: 'Compassion', desc: 'We treat every patient like family — with patience, empathy, and dignity.' },
    { n: '02', title: 'Excellence', desc: 'We obsess over the details. From margin fit to shade, every step is precise.' },
    { n: '03', title: 'Integrity',  desc: 'Honest treatment plans. No upselling. No surprises on the invoice.' },
    { n: '04', title: 'Innovation', desc: 'We invest in the best technology so you get the best clinical outcome.' }
  ];
  why = [
    { icon: 'fa-graduation-cap',  title: 'Multi-Disciplinary Specialist', desc: 'Three specialty diplomas — Crown & Bridge, Orthodontics, Implantology — under one roof.' },
    { icon: 'fa-shield-virus',    title: 'Strict Sterilization',          desc: 'Hospital-grade autoclave & single-use disposables.' },
    { icon: 'fa-clipboard-check', title: 'Transparent Pricing',           desc: 'Detailed quotes upfront. No hidden charges.' },
    { icon: 'fa-heart',           title: 'Gentle, Honest Care',           desc: 'Every option explained, no upselling, no pressure.' },
    { icon: 'fa-clock',           title: 'On-Time Appointments',          desc: 'We respect your time as much as our own.' },
    { icon: 'fa-credit-card',     title: 'Flexible Payment Plans',        desc: 'Comfortable instalments on major treatments.' }
  ];
  awards = ['BDS Qualified', 'Dip. Crown & Bridge', 'C. Orthodontics', 'C. Implantology', 'Member PMDC', 'Pakistan Dental Association'];
}
