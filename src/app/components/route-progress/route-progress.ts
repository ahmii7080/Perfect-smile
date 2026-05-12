import { Component, OnDestroy, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  ResolveStart,
  Router,
} from '@angular/router';
import { Subscription } from 'rxjs';

/**
 * Slim top-of-viewport progress bar — same idea as YouTube/GitHub/NProgress.
 *
 * Drives off Router lifecycle events:
 *
 *   NavigationStart / ResolveStart  → show, animate width 0% → 80% slowly
 *   NavigationEnd                   → finish: snap to 100% then fade out
 *   NavigationCancel/Error          → also finish so the bar never gets
 *                                     stuck on screen
 *
 * Why 80% on start instead of a real progress reading: the router doesn't
 * expose lazy-chunk download progress, so we fake "we're working on it"
 * the same way every SPA does. The user gets immediate visual feedback,
 * which matters more than a numerically-accurate percentage.
 *
 * SSR-safe: the subscription only attaches in the browser (the server has
 * no router-event loop worth visualising and `window` access would crash
 * prerender anyway).
 */
@Component({
  selector: 'app-route-progress',
  standalone: true,
  imports: [],
  template: `
    <div
      class="route-progress"
      [class.is-active]="active()"
      [class.is-done]="done()"
      [style.--p]="progress() + '%'"
      role="progressbar"
      aria-label="Page loading"
      aria-hidden="true"
    >
      <span class="route-progress__bar"></span>
    </div>
  `,
  styles: [
    `
      .route-progress {
        position: fixed;
        inset: 0 0 auto 0;
        height: 3px;
        z-index: 9999;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s ease;
      }
      .route-progress.is-active {
        opacity: 1;
      }
      .route-progress.is-done {
        opacity: 0;
        transition-delay: 0.18s;
      }

      .route-progress__bar {
        display: block;
        height: 100%;
        width: var(--p, 0%);
        background: linear-gradient(90deg, #1597d5 0%, #fac775 50%, #ff6b5c 100%);
        box-shadow:
          0 0 10px rgba(21, 151, 213, 0.55),
          0 0 4px rgba(250, 199, 117, 0.65);
        transition: width 0.25s ease-out;
      }
      @media (prefers-reduced-motion: reduce) {
        .route-progress,
        .route-progress__bar {
          transition-duration: 0.05s;
        }
      }
    `,
  ],
})
export class RouteProgressComponent implements OnInit, OnDestroy {
  /** Visible while a navigation is in flight. */
  active = signal(false);
  /** Briefly true after navigation completes so the bar fades out. */
  done = signal(false);
  /** 0–100. Animated upward during navigation, snapped to 100 on completion. */
  progress = signal(0);

  private readonly router = inject(Router);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private sub?: Subscription;
  private trickle?: ReturnType<typeof setInterval>;
  private finishTimer?: ReturnType<typeof setTimeout>;

  ngOnInit(): void {
    if (!this.isBrowser) return;
    this.sub = this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart || event instanceof ResolveStart) {
        this.start();
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.finish();
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.clearTimers();
  }

  /** Show the bar and start "trickling" up so the user sees motion. */
  private start(): void {
    this.clearTimers();
    this.done.set(false);
    this.active.set(true);
    this.progress.set(8);
    // Crawl toward 80% — never reach it without a real completion event.
    // The decay (smaller increments as we approach 80) makes it feel like
    // the page is "almost there" without ever lying about being done.
    this.trickle = setInterval(() => {
      const p = this.progress();
      if (p >= 80) return;
      const step = Math.max(1, (80 - p) * 0.06);
      this.progress.set(Math.min(80, p + step));
    }, 180);
  }

  /** Snap to 100%, let the width transition play, then fade out. */
  private finish(): void {
    if (!this.active()) return;
    this.clearTimers();
    this.progress.set(100);
    this.finishTimer = setTimeout(() => {
      this.done.set(true);
      // After fade-out, reset so the next nav starts clean.
      this.finishTimer = setTimeout(() => {
        this.active.set(false);
        this.done.set(false);
        this.progress.set(0);
      }, 220);
    }, 220);
  }

  private clearTimers(): void {
    if (this.trickle) {
      clearInterval(this.trickle);
      this.trickle = undefined;
    }
    if (this.finishTimer) {
      clearTimeout(this.finishTimer);
      this.finishTimer = undefined;
    }
  }
}
