import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './about.html',
  styleUrl: './about.scss'
})
export class AboutPage {
  values = [
    { n: '01', title: 'Compassion', desc: 'We treat every patient like family — with patience, empathy, and dignity.' },
    { n: '02', title: 'Excellence', desc: 'We obsess over the details. From margin fit to shade, every step is precise.' },
    { n: '03', title: 'Integrity',  desc: 'Honest treatment plans. No upselling. No surprises on the invoice.' },
    { n: '04', title: 'Innovation', desc: 'We invest in the best technology so you get the best clinical outcome.' }
  ];
  why = [
    { icon: 'fa-graduation-cap',  title: 'UK & US Trained Doctors',     desc: 'Specialists with international fellowships and degrees.' },
    { icon: 'fa-microchip',       title: 'Cutting-Edge Technology',     desc: '3D CBCT, iTero scanners, microscope endodontics.' },
    { icon: 'fa-shield-virus',    title: 'Hospital-Grade Sterilization',desc: 'Class B autoclaves, single-use disposables.' },
    { icon: 'fa-clipboard-check', title: 'Transparent Pricing',         desc: 'Detailed quotes upfront. No hidden charges.' },
    { icon: 'fa-clock',           title: 'On-Time Appointments',        desc: 'We respect your time as much as our own.' },
    { icon: 'fa-credit-card',     title: 'Flexible 0% Plans',           desc: 'Interest-free instalments on most treatments.' }
  ];
  awards = ['ISO 9001:2015', 'ICOI Accredited', 'BACD Member', 'Invisalign Diamond', 'Straumann Partner', 'Member PADS'];
}
