import { Component, OnInit, inject, signal } from '@angular/core';
import { AdminDataService, ChatSessionRow } from '../../services/admin-data.service';

/** Admin → Chats: every conversation visitors had with the website bot. */
@Component({
  selector: 'app-admin-chat-logs',
  standalone: true,
  styleUrl: '../admin-shared.scss',
  styles: [`
    .chat-card { background: #fff; border: 1px solid rgba(15,23,42,0.06); border-radius: 12px; padding: 1rem 1.1rem; margin-bottom: 0.75rem; }
    .chat-card__head { display: flex; justify-content: space-between; gap: 1rem; cursor: pointer; align-items: flex-start; }
    .chat-card__head strong { font-size: 14px; color: var(--color-ink); }
    .chat-card__meta { font-size: 12px; color: var(--color-text-muted); white-space: nowrap; }
    .chat-thread { display: flex; flex-direction: column; gap: 0.5rem; margin: 1rem 0; }
    .chat-bubble { max-width: 85%; padding: 0.55rem 0.8rem; border-radius: 12px; font-size: 13.5px; line-height: 1.5; white-space: pre-wrap; }
    .chat-bubble.user { align-self: flex-end; background: var(--color-primary); color: #fff; }
    .chat-bubble.assistant { align-self: flex-start; background: var(--color-primary-soft); color: var(--color-ink); }
  `],
  template: `
<header class="adm-head">
  <div>
    <h1>Chats</h1>
    <span class="adm-head__crumb">Dashboard › Chats · {{ items().length }} conversations</span>
  </div>
  <button type="button" class="adm-btn adm-btn--ghost" (click)="load()"><i class="fa-solid fa-rotate"></i> Refresh</button>
</header>

@if (error(); as e) {
  <div class="adm-toast adm-toast--error"><i class="fa-solid fa-circle-exclamation"></i> {{ e }}</div>
}

@if (loading()) {
  <div class="adm-empty">Loading…</div>
} @else if (!items().length) {
  <div class="adm-empty">No chats yet. Conversations from the website chatbot appear here.</div>
} @else {
  @for (s of items(); track s.id) {
    <div class="chat-card">
      <div class="chat-card__head" (click)="toggle(s.id)">
        <div>
          <strong>{{ firstQuestion(s) }}</strong>
          <div class="chat-card__meta">{{ s.message_count }} question{{ s.message_count === 1 ? '' : 's' }}</div>
        </div>
        <span class="chat-card__meta">{{ fmt(s.updated_at) }}</span>
      </div>
      @if (openId() === s.id) {
        <div class="chat-thread">
          @for (m of s.messages; track $index) {
            <div class="chat-bubble" [class.user]="m.role === 'user'" [class.assistant]="m.role === 'assistant'">{{ m.content }}</div>
          }
        </div>
        <button type="button" class="adm-btn adm-btn--danger" (click)="remove(s)"><i class="fa-regular fa-trash-can"></i> Delete</button>
      }
    </div>
  }
}
`,
})
export class AdminChatLogs implements OnInit {
  private data = inject(AdminDataService);
  items = signal<ChatSessionRow[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  openId = signal<string | null>(null);

  async ngOnInit() { await this.load(); }

  async load() {
    this.loading.set(true); this.error.set(null);
    try { this.items.set(await this.data.listChatSessions()); }
    catch (e: any) { this.error.set(e?.message ?? 'Failed to load'); }
    finally { this.loading.set(false); }
  }

  toggle(id: string) { this.openId.set(this.openId() === id ? null : id); }
  firstQuestion(s: ChatSessionRow) {
    return s.messages.find(m => m.role === 'user')?.content.slice(0, 120) || 'Conversation';
  }
  fmt(d?: string) { return d ? new Date(d).toLocaleString() : ''; }

  async remove(s: ChatSessionRow) {
    if (!confirm('Delete this conversation?')) return;
    await this.data.deleteChatSession(s.id);
    await this.load();
  }
}
