import { Component, OnInit, afterNextRender, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

import { NavbarComponent } from './components/navbar/navbar';
import { FooterComponent } from './components/footer/footer';
import { WhatsappPopupComponent } from './components/whatsapp-popup/whatsapp-popup';
import { StructuredDataService } from './services/structured-data.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, FooterComponent, WhatsappPopupComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  routeKey = 0;

  /**
   * True when the user is on any /adminauthlogin* route (login + dashboard).
   * Used to hide the public site chrome (navbar, footer, WhatsApp popup)
   * since the admin pages have their own shell.
   */
  isAdminRoute = signal(false);

  private router         = inject(Router);
  private structuredData = inject(StructuredDataService);

  constructor() {
    // Site-wide JSON-LD — mounted once on bootstrap, lives for the whole
    // session and ends up in every prerendered page's <head>. The Dentist
    // schema is what Google's local-pack uses to rank us in Faisalabad
    // "dentist near me" searches; the WebSite schema enables the inline
    // sitelinks searchbox under our brand-search results.
    this.structuredData.setDentist();
    this.structuredData.setWebSite();

    // AOS scroll animations are browser-only. `afterNextRender` guarantees
    // the callback never fires during SSR/prerender — `window.matchMedia`
    // and `document` are safe inside. The dynamic `import('aos')` also keeps
    // the `aos` module (which touches `window` at load time) out of the
    // server bundle entirely.
    afterNextRender(async () => {
      // Self-XSS warning in DevTools console — same pattern Facebook, Google,
      // GitHub use. NOT a security boundary (DevTools can't be truly blocked
      // in a browser), but a recognised mitigation for social-engineering
      // attacks where a scammer says "paste this code here to unlock X".
      // The bright-red banner is what makes the warning impossible to miss.
      console.log(
        '%cSTOP!',
        'color:#ef4444; font-size:42px; font-weight:900; text-shadow:1px 1px 0 #fff;'
      );
      console.log(
        '%cThis browser feature is for developers.\n' +
        'Do NOT paste anything here unless you 100% understand what it does — ' +
        'attackers can use this to take over your account, steal your data, ' +
        'or commit fraud in your name.\n\n' +
        'If someone told you to paste code here to "unlock" or "hack" something, ' +
        'it is a scam.',
        'color:#0F172A; font-size:14px; line-height:1.6;'
      );

      const { default: AOS } = await import('aos');
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

      // Refresh AOS positions whenever the route changes (browser only).
      this.router.events
        .pipe(filter(e => e instanceof NavigationEnd))
        .subscribe(() => setTimeout(() => AOS.refreshHard?.() ?? AOS.refresh(), 50));
    });
  }

  ngOnInit() {
    // Set initial state from current URL (handles hard-refresh / SSR pass)
    this.isAdminRoute.set(this.urlIsAdmin(this.router.url));

    // Track admin route changes — needed on both server and client so the
    // prerendered HTML hides public chrome correctly on admin pages. Also
    // wipe per-page JSON-LD between navigations so stale Article/FAQ schemas
    // from a previous page don't leak into the next one.
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(e => {
        this.routeKey++;
        this.isAdminRoute.set(this.urlIsAdmin((e as NavigationEnd).urlAfterRedirects));
        this.structuredData.clearPageSchemas();
      });
  }

  private urlIsAdmin(url: string): boolean {
    return url.startsWith('/adminauthlogin');
  }
}
