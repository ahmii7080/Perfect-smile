import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, shareReplay, map } from 'rxjs';

import { ServiceItem } from '../models/service.model';
import { Doctor, TeamMember } from '../models/doctor.model';
import { BlogPost, Testimonial } from '../models/appointment.model';
import { SupabaseService } from './supabase.service';
import { GalleryRow, ConsultantRow } from './admin-data.service';

/**
 * Public-site data service.
 *
 * Mixed source-of-truth on purpose:
 * - services + doctors + testimonials → static JSON (rarely changes, no admin UI for them)
 * - blog + team + gallery + consultants → Supabase (managed by admin)
 *
 * Each Supabase fetch is wrapped with `shareReplay(1)` so it runs once per
 * page session and is shared across all consumers (home page, lists, etc).
 */
@Injectable({ providedIn: 'root' })
export class DataService {
  private http     = inject(HttpClient);
  private supabase = inject(SupabaseService);

  private services$?:    Observable<ServiceItem[]>;
  private doctors$?:     Observable<Doctor[]>;
  private team$?:        Observable<TeamMember[]>;
  private blog$?:        Observable<BlogPost[]>;
  private testimonials$?: Observable<Testimonial[]>;
  private gallery$?:     Observable<GalleryRow[]>;
  private consultants$?: Observable<ConsultantRow[]>;

  /* -------- Mixed: services now Supabase, doctors + testimonials still JSON -------- */
  getServices(): Observable<ServiceItem[]> {
    return this.services$ ??= from(this.fetchServices()).pipe(shareReplay(1));
  }
  getServiceBySlug(slug: string): Observable<ServiceItem | undefined> {
    return this.getServices().pipe(map(list => list.find(s => s.slug === slug)));
  }
  getDoctors(): Observable<Doctor[]> {
    return this.doctors$ ??= this.http.get<Doctor[]>('assets/data/doctors.json').pipe(shareReplay(1));
  }
  getDoctorBySlug(slug: string): Observable<Doctor | undefined> {
    return this.getDoctors().pipe(map(list => list.find(d => d.slug === slug)));
  }
  getTestimonials(): Observable<Testimonial[]> {
    return this.testimonials$ ??= this.http.get<Testimonial[]>('assets/data/testimonials.json').pipe(shareReplay(1));
  }

  /* -------- Supabase-backed (admin-managed) -------- */
  getBlog(): Observable<BlogPost[]> {
    return this.blog$ ??= from(this.fetchBlog()).pipe(shareReplay(1));
  }
  getBlogBySlug(slug: string): Observable<BlogPost | undefined> {
    return this.getBlog().pipe(map(list => list.find(p => p.slug === slug)));
  }
  getTeam(): Observable<TeamMember[]> {
    return this.team$ ??= from(this.fetchTeam()).pipe(shareReplay(1));
  }
  getGalleryCases(): Observable<GalleryRow[]> {
    return this.gallery$ ??= from(this.fetchGallery()).pipe(shareReplay(1));
  }
  getConsultants(): Observable<ConsultantRow[]> {
    return this.consultants$ ??= from(this.fetchConsultants()).pipe(shareReplay(1));
  }

  // ---- Private fetchers ----
  private async fetchServices(): Promise<ServiceItem[]> {
    const { data, error } = await this.supabase.client
      .from('services').select('*').order('sort_order', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(row => ({
      slug:         row.slug,
      title:        row.title,
      tagline:      row.tagline ?? '',
      icon:         row.icon,
      color:        row.color,
      summary:      row.summary,
      description:  row.description ?? '',
      benefits:     row.benefits ?? [],
      procedure:    row.procedure_steps ?? [],
      faqs:         row.faqs ?? []
    }));
  }

  private async fetchBlog(): Promise<BlogPost[]> {
    const { data, error } = await this.supabase.client
      .from('blog_posts').select('*').order('date', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(row => ({
      slug: row.slug, title: row.title, excerpt: row.excerpt,
      date: row.date, readTime: row.read_time, category: row.category,
      author: row.author, color: row.color, content: row.content,
      image: row.image ?? undefined
    }));
  }

  private async fetchTeam(): Promise<TeamMember[]> {
    const { data, error } = await this.supabase.client
      .from('team_members').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(row => ({
      name: row.name, role: row.role, initials: row.initials,
      color: row.color, image: row.image ?? undefined
    }));
  }

  private async fetchGallery(): Promise<GalleryRow[]> {
    const { data, error } = await this.supabase.client
      .from('gallery_cases').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(row => ({
      id:           row.id,
      category:     row.category,
      title:        row.title,
      description:  row.description,
      treatment:    row.treatment,
      icon:         row.icon,
      beforeImage:  row.before_image ?? undefined,
      afterImage:   row.after_image  ?? undefined
    }));
  }

  private async fetchConsultants(): Promise<ConsultantRow[]> {
    const { data, error } = await this.supabase.client
      .from('visiting_consultants').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    return data ?? [];
  }
}
