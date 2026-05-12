import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';

import { ServiceItem } from '../models/service.model';
import { Doctor, TeamMember } from '../models/doctor.model';
import { BlogPost, Testimonial } from '../models/appointment.model';
import { GalleryRow, ConsultantRow } from './admin-data.service';

/**
 * Public-site data service.
 *
 * **Single source at runtime: static JSON shipped to the CDN.** Every read
 * is a tiny `HttpClient.get('/assets/data/*.json')` that lands in ~50 ms
 * from the edge — no Supabase round-trip on patient-facing pages.
 *
 * How the JSON gets there: `scripts/snapshot-supabase.mjs` runs as the
 * `prebuild` step and pulls every admin-managed table from Supabase into
 * `src/assets/data/*.json`. Angular's static asset pipeline then copies
 * those files into `dist/.../browser/assets/data/`, and Vercel serves them
 * from the CDN.
 *
 * Consequences worth knowing:
 *   - Content updates need a redeploy to appear (Supabase webhook + Vercel
 *     deploy hook makes this ~2 minutes end-to-end).
 *   - Supabase outage no longer takes the public site down.
 *   - Admin pages still write directly to Supabase via AdminDataService —
 *     the next deploy picks up the changes via a fresh snapshot.
 *
 * `shareReplay(1)` keeps one in-memory cached response per data type per
 * session, so a page that calls `getServices()` twice does one HTTP fetch.
 */
@Injectable({ providedIn: 'root' })
export class DataService {
  private http = inject(HttpClient);

  // Each cached observable is created on first read, then replayed.
  // Marked optional so we lazily build them — saves bandwidth on pages
  // that don't need a given data type.
  private services$?:     Observable<ServiceItem[]>;
  private doctors$?:      Observable<Doctor[]>;
  private team$?:         Observable<TeamMember[]>;
  private blog$?:         Observable<BlogPost[]>;
  private testimonials$?: Observable<Testimonial[]>;
  private gallery$?:      Observable<GalleryRow[]>;
  private consultants$?:  Observable<ConsultantRow[]>;

  /* ──────────────────────  Services  ────────────────────── */
  getServices(): Observable<ServiceItem[]> {
    return this.services$ ??= this.json<ServiceItem[]>('services.json');
  }
  getServiceBySlug(slug: string): Observable<ServiceItem | undefined> {
    return this.getServices().pipe(map(list => list.find(s => s.slug === slug)));
  }

  /* ──────────────────────  Doctors  ────────────────────── */
  // Doctors is the one table that was never in Supabase — `doctors.json`
  // is hand-maintained (one record, the lead dentist), so the snapshot
  // script doesn't touch it. Same load path though.
  getDoctors(): Observable<Doctor[]> {
    return this.doctors$ ??= this.json<Doctor[]>('doctors.json');
  }
  getDoctorBySlug(slug: string): Observable<Doctor | undefined> {
    return this.getDoctors().pipe(map(list => list.find(d => d.slug === slug)));
  }

  /* ──────────────────────  Testimonials  ────────────────────── */
  getTestimonials(): Observable<Testimonial[]> {
    return this.testimonials$ ??= this.json<Testimonial[]>('testimonials.json');
  }

  /* ──────────────────────  Blog  ────────────────────── */
  getBlog(): Observable<BlogPost[]> {
    return this.blog$ ??= this.json<BlogPost[]>('blog.json');
  }
  getBlogBySlug(slug: string): Observable<BlogPost | undefined> {
    return this.getBlog().pipe(map(list => list.find(p => p.slug === slug)));
  }

  /* ──────────────────────  Team  ────────────────────── */
  getTeam(): Observable<TeamMember[]> {
    return this.team$ ??= this.json<TeamMember[]>('team.json');
  }

  /* ──────────────────────  Gallery  ────────────────────── */
  getGalleryCases(): Observable<GalleryRow[]> {
    return this.gallery$ ??= this.json<GalleryRow[]>('gallery.json');
  }

  /* ──────────────────────  Consultants  ────────────────────── */
  getConsultants(): Observable<ConsultantRow[]> {
    return this.consultants$ ??= this.json<ConsultantRow[]>('consultants.json');
  }

  /** Shared loader — single point that decides where data comes from.
   *  Switching back to live Supabase (or to a different snapshot location)
   *  is a one-line change here. */
  private json<T>(file: string): Observable<T> {
    return this.http.get<T>(`assets/data/${file}`).pipe(shareReplay(1));
  }
}
