import { Component, OnInit, AfterViewInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import AOS from 'aos';

import { NavbarComponent } from './components/navbar/navbar';
import { FooterComponent } from './components/footer/footer';
import { WhatsappPopupComponent } from './components/whatsapp-popup/whatsapp-popup';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, WhatsappPopupComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, AfterViewInit {
  routeKey = 0;

  constructor(private router: Router) {}

  ngOnInit() {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        this.routeKey++;
        setTimeout(() => AOS.refreshHard?.() ?? AOS.refresh(), 50);
      });
  }

  ngAfterViewInit() {
    AOS.init({
      duration: 600,
      easing: 'ease-out-cubic',
      offset: 30,            // fire animations sooner
      once: true,
      // Skip animations on phones/tablets and for users who prefer reduced motion —
      // avoids the "blank space" mobile UX while elements wait to scroll into view.
      disable: () =>
        window.matchMedia('(max-width: 900px)').matches ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      startEvent: 'DOMContentLoaded'
    });
  }
}
