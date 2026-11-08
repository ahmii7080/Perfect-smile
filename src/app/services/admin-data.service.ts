import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { BlogPost, Testimonial } from '../models/appointment.model';
import { TeamMember } from '../models/doctor.model';
import { ServiceItem } from '../models/service.model';
import { ChatMsg, ClinicVideo } from '../models/media.model';

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
  // ---- SEO meta (added via supabase-blog-seo-meta-migration.sql).
  // All nullable so legacy rows that pre-date the migration round-trip
  // fine — toBlogRow() coerces undefined/'' to null on write, mapBlog()
  // collapses null back to undefined on read.
  focus_keyword?:    string | null;
  seo_title?:        string | null;
  meta_description?: string | null;
  seo_tags?:         string | null;
  image_alt?:        string | null;
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
  /** Optional uploaded photo. When present, takes precedence over initials avatar on /team. */
  image?: string;
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
    image: row.image ?? undefined,
    // SEO meta — collapse nulls to undefined so the admin form's
    // `[value]` bindings clear cleanly instead of literal "null".
    focusKeyword:    row.focus_keyword    ?? undefined,
    seoTitle:        row.seo_title        ?? undefined,
    metaDescription: row.meta_description ?? undefined,
    seoTags:         row.seo_tags         ?? undefined,
    imageAlt:        row.image_alt        ?? undefined
  });
  private toBlogRow(p: BlogPost): BlogRow {
    return {
      slug: p.slug, title: p.title, excerpt: p.excerpt, date: p.date,
      read_time: p.readTime, category: p.category, author: p.author,
      color: p.color, content: p.content, image: p.image ?? null,
      // Coerce empty strings → null so the DB stores a real NULL
      // (queryable + clean) rather than ''. trim() handles whitespace-only.
      focus_keyword:    p.focusKeyword?.trim()    || null,
      seo_title:        p.seoTitle?.trim()        || null,
      meta_description: p.metaDescription?.trim() || null,
      seo_tags:         p.seoTags?.trim()         || null,
      image_alt:        p.imageAlt?.trim()        || null
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
    return (data ?? []).map(this.mapConsultantRow);
  }
  async getConsultant(id: string): Promise<ConsultantRow> {
    const { data, error } = await this.db.from('visiting_consultants').select('*').eq('id', id).single();
    if (error) throw error;
    return this.mapConsultantRow(data);
  }
  async createConsultant(input: ConsultantRow): Promise<void> {
    const { error } = await this.db.from('visiting_consultants').insert({
      name: input.name, qualifications: input.qualifications,
      specialty: input.specialty, initials: input.initials, color: input.color,
      image: input.image ?? null
    });
    if (error) throw error;
  }
  async updateConsultant(id: string, input: ConsultantRow): Promise<void> {
    const { error } = await this.db.from('visiting_consultants').update({
      name: input.name, qualifications: input.qualifications,
      specialty: input.specialty, initials: input.initials, color: input.color,
      image: input.image ?? null
    }).eq('id', id);
    if (error) throw error;
  }

  /** Map raw Supabase row → `ConsultantRow` (DB nulls become `undefined`). */
  private mapConsultantRow = (row: any): ConsultantRow => ({
    id:             row.id,
    name:           row.name,
    qualifications: row.qualifications,
    specialty:      row.specialty,
    initials:       row.initials,
    color:          row.color,
    image:          row.image ?? undefined
  });
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

  /* ====================== VIDEOS ====================== */
  async listVideos(): Promise<AdminVideo[]> {
    const { data, error } = await this.db.from('videos').select('*')
      .order('sort_order', { ascending: true }).order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(this.mapVideoRow);
  }
  async getVideo(id: string): Promise<AdminVideo> {
    const { data, error } = await this.db.from('videos').select('*').eq('id', id).single();
    if (error) throw error;
    return this.mapVideoRow(data);
  }
  async saveVideo(v: AdminVideo): Promise<void> {
    const row = {
      title: v.title, description: v.description ?? '',
      video_url: v.videoUrl, poster_url: v.posterUrl || null,
      width: v.width ?? null, height: v.height ?? null,
      sort_order: v.sortOrder ?? 0, published: v.published
    };
    const { error } = v.id
      ? await this.db.from('videos').update(row).eq('id', v.id)
      : await this.db.from('videos').insert(row);
    if (error) throw error;
  }
  async deleteVideo(id: string): Promise<void> {
    const { error } = await this.db.from('videos').delete().eq('id', id);
    if (error) throw error;
  }
  private mapVideoRow = (row: any): AdminVideo => ({
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    videoUrl: row.video_url,
    posterUrl: row.poster_url ?? undefined,
    width: row.width ?? undefined,
    height: row.height ?? undefined,
    sortOrder: row.sort_order ?? 0,
    published: row.published ?? true
  });

  /* ====================== CHATBOT ====================== */
  async getChatSettings(): Promise<ChatSettingsRow | null> {
    const { data, error } = await this.db.from('chatbot_settings').select('*').eq('id', 1).maybeSingle();
    if (error) throw error;
    return data;
  }
  async saveChatSettings(s: ChatSettingsRow): Promise<void> {
    const { updated_at, ...row } = s;
    const { error } = await this.db.from('chatbot_settings').upsert({ ...row, id: 1 }, { onConflict: 'id' });
    if (error) throw error;
  }
  async listChatKnowledge(): Promise<ChatKnowledgeRow[]> {
    const { data, error } = await this.db.from('chatbot_knowledge').select('*').order('sort', { ascending: true });
    if (error) throw error;
    return data ?? [];
  }
  async saveChatKnowledge(k: ChatKnowledgeRow): Promise<void> {
    const row = { title: k.title, content: k.content, sort: k.sort ?? 0, published: k.published ?? true };
    const { error } = k.id
      ? await this.db.from('chatbot_knowledge').update(row).eq('id', k.id)
      : await this.db.from('chatbot_knowledge').insert(row);
    if (error) throw error;
  }
  async deleteChatKnowledge(id: string): Promise<void> {
    const { error } = await this.db.from('chatbot_knowledge').delete().eq('id', id);
    if (error) throw error;
  }
  async listChatSessions(): Promise<ChatSessionRow[]> {
    const { data, error } = await this.db.from('chat_sessions').select('*')
      .order('updated_at', { ascending: false }).limit(200);
    if (error) throw error;
    return data ?? [];
  }
  async deleteChatSession(id: string): Promise<void> {
    const { error } = await this.db.from('chat_sessions').delete().eq('id', id);
    if (error) throw error;
  }

  /* ====================== STORAGE ====================== */
  uploadImage(folder: 'blog' | 'team' | 'gallery' | 'consultants' | 'videos', file: File) {
    return this.supabase.uploadImage(folder, file);
  }
  uploadVideo(file: File) {
    return this.supabase.uploadVideo(file);
  }
}

/* -------- Videos + chatbot admin shapes -------- */
export interface AdminVideo extends ClinicVideo {
  sortOrder: number;
  published: boolean;
}

export interface ChatSettingsRow {
  id?: number;
  is_enabled: boolean;
  bot_name: string;
  welcome_message: string;
  max_messages: number;
  handoff_message: string;
  suggestions: string[];
  updated_at?: string;
}

export interface ChatKnowledgeRow {
  id?: string;
  title: string;
  content: string;
  sort?: number;
  published?: boolean;
}

export interface ChatSessionRow {
  id: string;
  visitor_id?: string;
  messages: ChatMsg[];
  message_count: number;
  created_at?: string;
  updated_at?: string;
}
