import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { toWebpFile } from './image-to-webp';

/**
 * Single shared Supabase client used for both database queries and auth.
 * Re-uses the same auth session across the app via the default `localStorage`
 * persistence — once an admin signs in, refresh keeps them signed in.
 */
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  readonly client: SupabaseClient = createClient(
    environment.supabaseUrl,
    environment.supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    }
  );

  /** Convenience: public URL for an uploaded file in our public bucket. */
  publicUrl(path: string): string {
    return this.client.storage.from(environment.storageBucket).getPublicUrl(path).data.publicUrl;
  }

  /**
   * Upload a file (used by admin forms) and return its public URL.
   *
   * Every JPG/PNG is transparently re-encoded to WebP (q=0.9) before it
   * lands in Storage. See `image-to-webp.ts` for the conversion rules;
   * SVG / GIF / already-WebP files are passed through untouched.
   *
   * The resulting filename always reflects the actual content-type Storage
   * receives, so CDN caches and the `<img>` browser MIME sniffer agree.
   */
  async uploadImage(folder: 'blog' | 'team' | 'consultants' | 'gallery', file: File): Promise<string> {
    // Convert in the browser BEFORE the network hop — saves both bandwidth
    // and Supabase Storage bytes. Failures inside `toWebpFile` are caught
    // and return the original File, so this call never throws on its own.
    const optimized = await toWebpFile(file);

    const ext = optimized.name.split('.').pop() ?? 'jpg';
    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await this.client.storage
      .from(environment.storageBucket)
      .upload(filename, optimized, { upsert: false, contentType: optimized.type });
    if (error) throw error;
    return this.publicUrl(filename);
  }
}
