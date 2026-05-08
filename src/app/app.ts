import { Component, OnInit, AfterViewInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import AOS from 'aos';

import { NavbarComponent } from './components/navbar/navbar';
import { FooterComponent } from './components/footer/footer';
import { WhatsappPopupComponent } from './components/whatsapp-popup/whatsapp-popup';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, FooterComponent, WhatsappPopupComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, AfterViewInit {
  routeKey = 0;

  /**
   * True when the user is on an admin route (/admin/*) or the login page.
   * Used to hide the public site chrome (navbar, footer, WhatsApp popup)
   * since the admin pages have their own shell.
   */
  isAdminRoute = signal(false);

  constructor(private router: Router) {}

  ngOnInit() {
    // Set initial state from current URL (handles hard-refresh)
    this.isAdminRoute.set(this.urlIsAdmin(this.router.url));

    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(e => {
        this.routeKey++;
        this.isAdminRoute.set(this.urlIsAdmin((e as NavigationEnd).urlAfterRedirects));
        setTimeout(() => AOS.refreshHard?.() ?? AOS.refresh(), 50);
      });
  }

  private urlIsAdmin(url: string): boolean {
    return url.startsWith('/admin') || url.startsWith('/adminauthlogin');
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
