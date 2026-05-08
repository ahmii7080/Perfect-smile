import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { Session, User } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';

/**
 * Wraps Supabase Auth for the admin dashboard.
 *
 * - Reactive `session` signal — drives the auth guard + UI.
 * - On construction, hydrates the existing session from localStorage so a
 *   page refresh keeps the admin logged in.
 * - Listens to Supabase auth-state events and keeps the signal in sync.
 */
@Injectable({ providedIn: 'root' })
export class AdminAuthService {
  private supabase = inject(SupabaseService);
  private router   = inject(Router);

  session = signal<Session | null>(null);
  user    = computed<User | null>(() => this.session()?.user ?? null);
  isAuthenticated = computed(() => !!this.session());
  ready = signal(false);

  constructor() {
    // Hydrate any existing session synchronously from local storage
    this.supabase.client.auth.getSession().then(({ data }) => {
      this.session.set(data.session ?? null);
      this.ready.set(true);
    });

    // Stay in sync with sign-in / sign-out / token-refresh events
    this.supabase.client.auth.onAuthStateChange((_event, session) => {
      this.session.set(session ?? null);
    });
  }

  async signIn(email: string, password: string): Promise<{ ok: true } | { ok: false; message: string }> {
    const { error } = await this.supabase.client.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, message: this.friendlyError(error.message) };
    return { ok: true };
  }

  async signOut(): Promise<void> {
    await this.supabase.client.auth.signOut();
    this.session.set(null);
    this.router.navigate(['/adminauthlogin']);
  }

  /** Friendlier copy for a few common Supabase error strings. */
  private friendlyError(msg: string): string {
    const m = msg.toLowerCase();
    if (m.includes('invalid login credentials')) return 'Email or password is incorrect.';
    if (m.includes('email not confirmed'))       return 'Please confirm your email first.';
    if (m.includes('rate'))                       return 'Too many attempts — try again in a minute.';
    return msg;
  }
}
