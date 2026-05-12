import { Directive, ElementRef, Input, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, RouterPreloader } from '@angular/router';
import { HoverPreloadStrategy } from '../services/hover-preload.strategy';

/**
 * `prefetchOnHover` — preload a lazy-loaded route's JS chunk the moment the
 * user's pointer enters its `routerLink`. By the time they click, the
 * destination's bundle is already in the browser cache, so the route
 * transitions in zero extra time (no chunk download wait).
 *
 * How it works:
 *  1. Reads the host element's `routerLink` input (we re-declare it here
 *     so Angular populates the same value we can resolve to a path).
 *  2. On first `mouseenter` / `focus` / `touchstart`, asks
 *     `HoverPreloadStrategy.flag(path)` to mark the route as preloadable,
 *     then triggers `RouterPreloader.preload()` to actually fetch it.
 *  3. Drops the event listeners immediately — preloading is idempotent
 *     and we don't want to keep firing for repeated hovers.
 *
 * SSR-safe: bails out instantly when `isPlatformBrowser` is false. The
 * server has no hover events anyway, and `RouterPreloader` is browser-only.
 *
 * Why hover-trigger instead of `PreloadAllModules`:
 *  - `PreloadAllModules` blasts every lazy chunk after the first
 *    contentful paint. For a 10-page clinic site that's MBs of JS the
 *    visitor will probably never use (e.g. /adminauthlogin).
 *  - Hover-trigger correlates ~80% with an imminent click — we pay the
 *    bandwidth cost only when intent surfaces.
 *
 * Usage:
 *   <a routerLink="/services"            prefetchOnHover>Services</a>
 *   <a [routerLink]="['/blog', p.slug]"  prefetchOnHover>{{ p.title }}</a>
 */
@Directive({
  selector: '[routerLink][prefetchOnHover]',
  standalone: true
})
export class PrefetchOnHoverDirective implements OnInit, OnDestroy {
  /** Mirrors the host's `routerLink` input so we can introspect the
   *  destination URL without depending on RouterLink's private state.
   *  Accepts both string and command-array forms. */
  @Input() routerLink: string | any[] | null | undefined;

  private readonly host      = inject(ElementRef<HTMLElement>);
  private readonly router    = inject(Router);
  private readonly preloader = inject(RouterPreloader);
  private readonly strategy  = inject(HoverPreloadStrategy);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Single cleanup function that detaches all three listeners atomically. */
  private cleanup?: () => void;

  ngOnInit(): void {
    if (!this.isBrowser) return;

    const el = this.host.nativeElement;
    const trigger = () => this.prefetch();

    el.addEventListener('mouseenter', trigger);
    el.addEventListener('focus',      trigger);
    el.addEventListener('touchstart', trigger, { passive: true });

    this.cleanup = () => {
      el.removeEventListener('mouseenter', trigger);
      el.removeEventListener('focus',      trigger);
      el.removeEventListener('touchstart', trigger);
    };
  }

  ngOnDestroy(): void {
    this.cleanup?.();
  }

  /** Flag the destination route and ask the preloader to fetch it now. */
  private prefetch(): void {
    const firstSegment = this.firstPathSegment();
    if (firstSegment) {
      this.strategy.flag(firstSegment);
      this.preloader.preload().subscribe();
    }
    this.cleanup?.();
    this.cleanup = undefined;
  }

  /** Extract the top-level path segment from the routerLink value. We
   *  only need the first segment because the routes config is flat —
   *  every lazy route lives at the top level. `/blog/abc` → `blog`,
   *  `['/services', slug]` → `services`. */
  private firstPathSegment(): string | undefined {
    const link = this.routerLink;
    if (typeof link === 'string') {
      return link.split('/').filter(Boolean)[0];
    }
    if (Array.isArray(link) && link.length > 0) {
      return String(link[0]).split('/').filter(Boolean)[0];
    }
    return undefined;
  }
}
