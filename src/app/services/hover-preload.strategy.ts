import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { EMPTY, Observable } from 'rxjs';

/**
 * Selective preloading strategy. `RouterPreloader` invokes `preload()` for
 * every lazy route in the config; we only return the `load()` observable
 * for routes that have been explicitly flagged via {@link flag} — so most
 * routes stay un-preloaded until the user signals interest (typically by
 * hovering the corresponding `routerLink`, see PrefetchOnHoverDirective).
 *
 * This sits between Angular's two built-in extremes:
 *  - `NoPreloading` (default): nothing extra ever downloads → fast TTI,
 *    but every link click pays the full chunk-download cost.
 *  - `PreloadAllModules`: every chunk downloads after the initial bundle
 *    → great link-click UX, but wastes bandwidth on chunks the user may
 *    never visit (admin, blog detail, contact, etc).
 *
 * Hover-triggered selection lands in the middle: chunks load only when a
 * pointer crosses the link, which correlates ~80% with an imminent click.
 */
@Injectable({ providedIn: 'root' })
export class HoverPreloadStrategy implements PreloadingStrategy {
  /** Set of flagged route paths to preload on next `RouterPreloader.preload()`. */
  private readonly flagged = new Set<string>();

  preload(route: Route, load: () => Observable<any>): Observable<any> {
    // Match flagged segments to lazy route paths. Both the leading slash
    // and a bare path are stored — different `routerLink` shapes ([url]
    // vs string vs commands array) normalise differently, so we tolerate
    // both forms rather than guess one.
    if (route.path !== undefined && this.flagged.has(route.path)) {
      return load();
    }
    return EMPTY;
  }

  /** Flag a route path for preloading. Idempotent — once preloaded, calls
   *  are no-ops because Angular tracks loaded modules internally. */
  flag(path: string): void {
    const normalized = path.replace(/^\//, '');
    this.flagged.add(normalized);
  }
}
