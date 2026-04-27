import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay, map } from 'rxjs';

import { ServiceItem } from '../models/service.model';
import { Doctor, TeamMember } from '../models/doctor.model';
import { BlogPost, Testimonial } from '../models/appointment.model';

@Injectable({ providedIn: 'root' })
export class DataService {
  private http = inject(HttpClient);

  private services$?:    Observable<ServiceItem[]>;
  private doctors$?:     Observable<Doctor[]>;
  private team$?:        Observable<TeamMember[]>;
  private blog$?:        Observable<BlogPost[]>;
  private testimonials$?: Observable<Testimonial[]>;

  getServices(): Observable<ServiceItem[]> {
    return this.services$ ??= this.http.get<ServiceItem[]>('assets/data/services.json').pipe(shareReplay(1));
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

  getTeam(): Observable<TeamMember[]> {
    return this.team$ ??= this.http.get<TeamMember[]>('assets/data/team.json').pipe(shareReplay(1));
  }

  getBlog(): Observable<BlogPost[]> {
    return this.blog$ ??= this.http.get<BlogPost[]>('assets/data/blog.json').pipe(shareReplay(1));
  }

  getBlogBySlug(slug: string): Observable<BlogPost | undefined> {
    return this.getBlog().pipe(map(list => list.find(p => p.slug === slug)));
  }

  getTestimonials(): Observable<Testimonial[]> {
    return this.testimonials$ ??= this.http.get<Testimonial[]>('assets/data/testimonials.json').pipe(shareReplay(1));
  }
}
