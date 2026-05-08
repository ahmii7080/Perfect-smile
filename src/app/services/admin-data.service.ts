import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { BlogPost, Testimonial } from '../models/appointment.model';
import { TeamMember } from '../models/doctor.model';
import { ServiceItem } from '../models/service.model';

/* -------- Row shapes (snake_case as stored in Supabase) -------- */
interface BlogRow {
  id?: string;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  read_time: string;
  category: string;
  author: string;
  color: string;
  content: string;
  image: string | null;
}

interface TeamRow {
  id?: string;
  name: string;
  role: string;
  initials: string;
  color: string;
  image: string | null;
}

export interface GalleryRow {
  id?: string;
  category: string;
  title: string;
  description: string;
  treatment: string;
  icon: string;
  /** Optional uploaded photo. When present, takes precedence over the SVG illustration on the public gallery. */
  beforeImage?: string;
  afterImage?: string;
}

export interface ConsultantRow {
  id?: string;
  name: string;
  qualifications: string;
  specialty: string;
  initials: string;
  color: string;
}

/**
 * CRUD helpers for the admin dashboard. Reads, writes, and image uploads.
 * Public site uses DataService (which also reads, but caches via shareReplay).
 */
@Injectable({ providedIn: 'root' })
export class AdminDataService {
  private supabase = inject(SupabaseService);
  private get db() { return this.supabase.client; }

  /* ====================== BLOG ====================== */
  async listBlog(): Promise<(BlogPost & { id?: string })[]> {
    const { data, error } = await this.db.from('blog_posts').select('*').order('date', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(this.mapBlog);
  }
  async getBlog(id: string): Promise<BlogPost & { id: string }> {
    const { data, error } = await this.db.from('blog_posts').select('*').eq('id', id).single();
    if (error) throw error;
    return this.mapBlog(data) as BlogPost & { id: string };
  }
  async createBlog(input: Omit<BlogPost, never>): Promise<void> {
    const row: BlogRow = this.toBlogRow(input);
    const { error } = await this.db.from('blog_posts').insert(row);
    if (error) throw error;
  }
  async updateBlog(id: string, input: Omit<BlogPost, never>): Promise<void> {
    const row: BlogRow = this.toBlogRow(input);
    const { error } = await this.db.from('blog_posts').update(row).eq('id', id);
    if (error) throw error;
  }
  async deleteBlog(id: string): Promise<void> {
    const { error } = await this.db.from('blog_posts').delete().eq('id', id);
    if (error) throw error;
  }

  private mapBlog = (row: any): BlogPost & { id?: string } => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    date: row.date,
    readTime: row.read_time,
    category: row.category,
    author: row.author,
    color: row.color,
    content: row.content,
    image: row.image ?? undefined
  });
  private toBlogRow(p: BlogPost): BlogRow {
    return {
      slug: p.slug, title: p.title, excerpt: p.excerpt, date: p.date,
      read_time: p.readTime, category: p.category, author: p.author,
      color: p.color, content: p.content, image: p.image ?? null
    };
  }

  /* ====================== TEAM ====================== */
  async listTeam(): Promise<(TeamMember & { id?: string })[]> {
    const { data, error } = await this.db.from('team_members').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(this.mapTeam);
  }
  async getTeam(id: string): Promise<TeamMember & { id: string }> {
    const { data, error } = await this.db.from('team_members').select('*').eq('id', id).single();
    if (error) throw error;
    return this.mapTeam(data) as TeamMember & { id: string };
  }
  async createTeam(input: TeamMember): Promise<void> {
    const { error } = await this.db.from('team_members').insert({
      name: input.name, role: input.role, initials: input.initials,
      color: input.color, image: input.image ?? null
    });
    if (error) throw error;
  }
  async updateTeam(id: string, input: TeamMember): Promise<void> {
    const { error } = await this.db.from('team_members').update({
      name: input.name, role: input.role, initials: input.initials,
      color: input.color, image: input.image ?? null
    }).eq('id', id);
    if (error) throw error;
  }
  async deleteTeam(id: string): Promise<void> {
    const { error } = await this.db.from('team_members').delete().eq('id', id);
    if (error) throw error;
  }
  private mapTeam = (row: any): TeamMember & { id?: string } => ({
    id: row.id,
    name: row.name,
    role: row.role,
    initials: row.initials,
    color: row.color,
    image: row.image ?? undefined
  });

  /* ====================== GALLERY ====================== */
  async listGallery(): Promise<GalleryRow[]> {
    const { data, error } = await this.db.from('gallery_cases').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(this.mapGalleryRow);
  }
  async getGallery(id: string): Promise<GalleryRow> {
    const { data, error } = await this.db.from('gallery_cases').select('*').eq('id', id).single();
    if (error) throw error;
    return this.mapGalleryRow(data);
  }
  async createGallery(input: GalleryRow): Promise<void> {
    const { error } = await this.db.from('gallery_cases').insert(this.toGalleryDbRow(input));
    if (error) throw error;
  }
  async updateGallery(id: string, input: GalleryRow): Promise<void> {
    const { error } = await this.db.from('gallery_cases').update(this.toGalleryDbRow(input)).eq('id', id);
    if (error) throw error;
  }
  async deleteGallery(id: string): Promise<void> {
    const { error } = await this.db.from('gallery_cases').delete().eq('id', id);
    if (error) throw error;
  }

  private mapGalleryRow = (row: any): GalleryRow => ({
    id: row.id,
    category: row.category,
    title: row.title,
    description: row.description,
    treatment: row.treatment,
    icon: row.icon,
    beforeImage: row.before_image ?? undefined,
    afterImage:  row.after_image  ?? undefined
  });
  private toGalleryDbRow(g: GalleryRow) {
    return {
      category: g.category, title: g.title, description: g.description,
      treatment: g.treatment, icon: g.icon,
      before_image: g.beforeImage ?? null,
      after_image:  g.afterImage  ?? null
    };
  }

  /* ====================== CONSULTANTS ====================== */
  async listConsultants(): Promise<ConsultantRow[]> {
    const { data, error } = await this.db.from('visiting_consultants').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    return data ?? [];
  }
  async getConsultant(id: string): Promise<ConsultantRow> {
    const { data, error } = await this.db.from('visiting_consultants').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  }
  async createConsultant(input: ConsultantRow): Promise<void> {
    const { error } = await this.db.from('visiting_consultants').insert({
      name: input.name, qualifications: input.qualifications,
      specialty: input.specialty, initials: input.initials, color: input.color
    });
    if (error) throw error;
  }
  async updateConsultant(id: string, input: ConsultantRow): Promise<void> {
    const { error } = await this.db.from('visiting_consultants').update({
      name: input.name, qualifications: input.qualifications,
      specialty: input.specialty, initials: input.initials, color: input.color
    }).eq('id', id);
    if (error) throw error;
  }
  async deleteConsultant(id: string): Promise<void> {
    const { error } = await this.db.from('visiting_consultants').delete().eq('id', id);
    if (error) throw error;
  }

  /* ====================== SERVICES ====================== */
  async listServices(): Promise<(ServiceItem & { id?: string; sortOrder?: number })[]> {
    const { data, error } = await this.db.from('services').select('*').order('sort_order', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(this.mapServiceRow);
  }
  async getService(id: string): Promise<ServiceItem & { id: string; sortOrder?: number }> {
    const { data, error } = await this.db.from('services').select('*').eq('id', id).single();
    if (error) throw error;
    return this.mapServiceRow(data) as ServiceItem & { id: string };
  }
  async createService(input: ServiceItem & { sortOrder?: number }): Promise<void> {
    const { error } = await this.db.from('services').insert(this.toServiceDbRow(input));
    if (error) throw error;
  }
  async updateService(id: string, input: ServiceItem & { sortOrder?: number }): Promise<void> {
    const { error } = await this.db.from('services').update(this.toServiceDbRow(input)).eq('id', id);
    if (error) throw error;
  }
  async deleteService(id: string): Promise<void> {
    const { error } = await this.db.from('services').delete().eq('id', id);
    if (error) throw error;
  }

  private mapServiceRow = (row: any): ServiceItem & { id?: string; sortOrder?: number } => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    tagline: row.tagline ?? '',
    icon: row.icon,
    color: row.color,
    summary: row.summary,
    description: row.description ?? '',
    benefits: row.benefits ?? [],
    procedure: row.procedure_steps ?? [],
    faqs: row.faqs ?? [],
    sortOrder: row.sort_order ?? 0
  });
  private toServiceDbRow(s: ServiceItem & { sortOrder?: number }) {
    return {
      slug: s.slug, title: s.title, tagline: s.tagline ?? '',
      icon: s.icon, color: s.color,
      summary: s.summary, description: s.description ?? '',
      benefits: s.benefits ?? [],
      procedure_steps: s.procedure ?? [],
      faqs: s.faqs ?? [],
      sort_order: s.sortOrder ?? 0
    };
  }

  /* ====================== STORAGE ====================== */
  uploadImage(folder: 'blog' | 'team' | 'gallery' | 'consultants', file: File) {
    return this.supabase.uploadImage(folder, file);
  }
}
