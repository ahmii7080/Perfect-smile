import {
  Component, ElementRef, HostListener, OnInit, PLATFORM_ID, computed, inject, signal, viewChild,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataService } from '../../services/data.service';
import { ChatbotConfig, ChatMsg } from '../../models/media.model';
import { CLINIC_INFO } from '../../data/clinic-info';

const KEY = 'ps-chat-v1';

const DEFAULT_CONFIG: ChatbotConfig = {
  isEnabled: true,
  botName: 'Smile Assistant',
  welcomeMessage: 'Assalam-o-Alaikum! 👋 Ask me about our treatments, timings or how to book a visit.',
  maxMessages: 10,
  handoffMessage: 'Our team can answer that properly. Message us on WhatsApp or book an appointment and we will get back to you.',
  suggestions: ['What are your clinic timings?', 'Do you do dental implants?', 'How do I book an appointment?', 'Where is the clinic?'],
};

function uuid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
        (+c ^ ((Math.random() * 16) >> (+c / 4))).toString(16));
}

/**
 * AI assistant (Gemini via the /api/chat Vercel function) with a hand-off to
 * WhatsApp / the appointment page. Sits just above the WhatsApp button.
 */
@Component({
  selector: 'app-chat-widget',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './chat-widget.html',
  styleUrl: './chat-widget.scss',
})
export class ChatWidgetComponent implements OnInit {
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private data = inject(DataService);

  private list = viewChild<ElementRef<HTMLDivElement>>('list');
  private box = viewChild<ElementRef<HTMLInputElement>>('box');

  readonly whatsappHref = `https://wa.me/${CLINIC_INFO.telephone.replace(/\D/g, '')}`;

  config = signal<ChatbotConfig>(DEFAULT_CONFIG);
  open = signal(false);
  messages = signal<ChatMsg[]>([]);
  handoff = signal(false);
  loading = signal(false);
  input = '';
  private sessionId = '';

  remaining = computed(() =>
    Math.max(0, this.config().maxMessages - this.messages().filter((m) => m.role === 'user').length));
  limitReached = computed(() => this.handoff() || this.remaining() === 0);

  ngOnInit() {
    if (!this.isBrowser) return;
    this.data.getChatbotConfig().subscribe({
      next: (c) => {
        const merged: any = { ...DEFAULT_CONFIG };
        for (const [k, v] of Object.entries(c ?? {})) {
          if (v !== null && v !== '' && !(Array.isArray(v) && !v.length)) merged[k] = v;
        }
        this.config.set(merged);
      },
      error: () => {},
    });
  }

  @HostListener('document:keydown.escape') onEscape() { this.open.set(false); }

  toggle() {
    if (this.open()) { this.open.set(false); return; }
    if (!this.sessionId) {
      try {
        const saved = JSON.parse(sessionStorage.getItem(KEY) || 'null');
        if (saved) {
          this.sessionId = saved.sessionId;
          this.messages.set(saved.messages ?? []);
          this.handoff.set(!!saved.handoff);
        }
      } catch { /* storage unavailable: chat still works */ }
      this.sessionId ||= uuid();
    }
    this.open.set(true);
    setTimeout(() => { this.box()?.nativeElement.focus(); this.scroll(); }, 200);
  }

  async send(text: string) {
    const content = text.trim();
    if (!content || this.loading() || this.limitReached()) return;
    const next: ChatMsg[] = [...this.messages(), { role: 'user', content }];
    this.messages.set(next);
    this.input = '';
    this.loading.set(true);
    this.scroll();
    try {
      let visitorId = '';
      try {
        visitorId = localStorage.getItem('ps-visitor') || uuid();
        localStorage.setItem('ps-visitor', visitorId);
      } catch { /* ignore */ }
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: this.sessionId, visitorId, messages: next }),
      });
      const data = await res.json();
      this.messages.update((m) => [...m, { role: 'assistant', content: data.reply || this.config().handoffMessage }]);
      if (data.handoff) this.handoff.set(true);
    } catch {
      this.messages.update((m) => [...m, { role: 'assistant', content: 'Connection problem. Please try again in a moment.' }]);
    } finally {
      this.loading.set(false);
      this.save();
      this.scroll();
    }
  }

  private save() {
    try {
      sessionStorage.setItem(KEY, JSON.stringify({
        sessionId: this.sessionId, messages: this.messages(), handoff: this.handoff(),
      }));
    } catch { /* ignore */ }
  }

  private scroll() {
    setTimeout(() => {
      const el = this.list()?.nativeElement;
      el?.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    }, 0);
  }
}
