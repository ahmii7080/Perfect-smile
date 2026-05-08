import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

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

  /** Upload a file (used by admin forms) and return its public URL. */
  async uploadImage(folder: 'blog' | 'team' | 'consultants' | 'gallery', file: File): Promise<string> {
    const ext = file.name.split('.').pop() ?? 'jpg';
    const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await this.client.storage
      .from(environment.storageBucket)
      .upload(filename, file, { upsert: false, contentType: file.type });
    if (error) throw error;
    return this.publicUrl(filename);
  }
}
