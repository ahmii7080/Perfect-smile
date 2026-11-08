import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminDataService, ChatKnowledgeRow, ChatSettingsRow } from '../../services/admin-data.service';

/** Admin → Chatbot: widget settings + extra facts the AI may use. */
@Component({
  selector: 'app-admin-chatbot-settings',
  standalone: true,
  imports: [FormsModule],
  styleUrl: '../admin-shared.scss',
  template: `
<header class="adm-head">
  <div>
    <h1>AI Chatbot</h1>
    <span class="adm-head__crumb">Dashboard › Chatbot · answers patients from your services, team &amp; the facts below</span>
  </div>
</header>

@if (error(); as e) {
  <div class="adm-toast adm-toast--error"><i class="fa-solid fa-circle-exclamation"></i> {{ e }}</div>
}

@if (loading()) {
  <div class="adm-empty">Loading…</div>
} @else {
  <form class="adm-form" (ngSubmit)="saveSettings()" style="margin-bottom: 2rem">
    <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 14px; font-weight: 600">
      <input type="checkbox" [(ngModel)]="cfg.is_enabled" name="en" /> Show the chatbot on the website
    </label>
    <div class="adm-row-2">
      <div>
        <label class="form-label">Bot name</label>
        <input class="form-control" [(ngModel)]="cfg.bot_name" name="bn" />
      </div>
      <div>
        <label class="form-label">Questions per visitor</label>
        <input class="form-control" type="number" min="1" max="30" [(ngModel)]="cfg.max_messages" name="mm" />
      </div>
    </div>
    <div>
      <label class="form-label">Welcome message</label>
      <input class="form-control" [(ngModel)]="cfg.welcome_message" name="wm" />
    </div>
    <div>
      <label class="form-label">Hand-off message (shown with WhatsApp / Book appointment buttons)</label>
      <input class="form-control" [(ngModel)]="cfg.handoff_message" name="hm" />
    </div>
    <div>
      <label class="form-label">Suggested questions (one per line)</label>
      <textarea class="form-control" rows="4" [(ngModel)]="suggestions" name="sg"></textarea>
    </div>
    <small style="font-size: 12px; color: var(--color-text-muted)">
      Name, welcome text and suggestions update on the website after the next deploy.
      On/off, question limit and hand-off text apply to new answers immediately.
    </small>
    <div class="adm-form__actions">
      <button type="submit" class="adm-btn" [disabled]="savingCfg()">
        <i class="fa-regular fa-floppy-disk"></i> {{ savingCfg() ? 'Saving…' : 'Save settings' }}
      </button>
      @if (savedCfg()) { <span style="color: var(--color-accent-deep); font-size: 13px; font-weight: 600"><i class="fa-solid fa-check"></i> Saved</span> }
    </div>
  </form>

  <header class="adm-head">
    <div>
      <h1 style="font-size: 22px">Extra knowledge</h1>
      <span class="adm-head__crumb">Services, visiting consultants, team, timings &amp; contact details are added automatically. Add things like payment plans or aftercare tips.</span>
    </div>
    <button type="button" class="adm-btn" (click)="newItem()"><i class="fa-solid fa-plus"></i> New fact</button>
  </header>

  @if (editing()) {
    <form class="adm-form" (ngSubmit)="saveItem()" style="margin-bottom: 1.25rem">
      <div>
        <label class="form-label">Title *</label>
        <input class="form-control" [(ngModel)]="form.title" name="t" placeholder="e.g. Payment plans" />
      </div>
      <div>
        <label class="form-label">What the bot should know *</label>
        <textarea class="form-control" rows="6" [(ngModel)]="form.content" name="c"></textarea>
      </div>
      <div class="adm-row-2">
        <div>
          <label class="form-label">Sort order</label>
          <input class="form-control" type="number" [(ngModel)]="form.sort" name="so" />
        </div>
        <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 14px; padding-top: 1.6rem">
          <input type="checkbox" [(ngModel)]="form.published" name="pub" /> Active (the bot uses it)
        </label>
      </div>
      <div class="adm-form__actions">
        <button type="submit" class="adm-btn" [disabled]="savingItem()">
          {{ savingItem() ? 'Saving…' : 'Save fact' }}
        </button>
        <button type="button" class="adm-btn adm-btn--ghost" (click)="editing.set(false)">Cancel</button>
      </div>
    </form>
  }

  <div class="adm-table-wrap">
    <table class="adm-table">
      <thead><tr><th>Title</th><th>Status</th><th style="width: 160px">Actions</th></tr></thead>
      <tbody>
        @for (k of items(); track k.id) {
          <tr>
            <td>
              <span class="adm-table__title">{{ k.title }}</span>
              <div style="font-size: 12px; color: var(--color-text-muted)">{{ k.content.slice(0, 100) }}{{ k.content.length > 100 ? '…' : '' }}</div>
            </td>
            <td>{{ k.published ? 'Active' : 'Off' }}</td>
            <td>
              <div class="adm-actions">
                <button type="button" (click)="edit(k)"><i class="fa-regular fa-pen-to-square"></i> Edit</button>
                <button type="button" (click)="remove(k)"><i class="fa-regular fa-trash-can"></i> Delete</button>
              </div>
            </td>
          </tr>
        }
      </tbody>
    </table>
    @if (!items().length) { <div class="adm-empty">No extra facts yet.</div> }
  </div>
}
`,
})
export class AdminChatbotSettings implements OnInit {
  private data = inject(AdminDataService);

  loading = signal(true);
  error = signal<string | null>(null);
  savingCfg = signal(false);
  savedCfg = signal(false);
  savingItem = signal(false);
  editing = signal(false);
  items = signal<ChatKnowledgeRow[]>([]);

  cfg: ChatSettingsRow = {
    is_enabled: true, bot_name: '', welcome_message: '',
    max_messages: 10, handoff_message: '', suggestions: [],
  };
  suggestions = '';
  form: ChatKnowledgeRow = { title: '', content: '', sort: 0, published: true };

  async ngOnInit() {
    try {
      const c = await this.data.getChatSettings();
      if (c) { this.cfg = c; this.suggestions = (c.suggestions ?? []).join('\n'); }
      this.items.set(await this.data.listChatKnowledge());
    } catch (e: any) {
      this.error.set(e?.message?.includes('chatbot_')
        ? 'Chatbot tables not found — run supabase-videos-chatbot-migration.sql in Supabase first.'
        : (e?.message ?? 'Failed to load'));
    } finally {
      this.loading.set(false);
    }
  }

  async saveSettings() {
    this.savingCfg.set(true); this.savedCfg.set(false); this.error.set(null);
    try {
      await this.data.saveChatSettings({
        ...this.cfg,
        max_messages: Math.min(30, Math.max(1, Number(this.cfg.max_messages) || 10)),
        suggestions: this.suggestions.split('\n').map(s => s.trim()).filter(Boolean),
      });
      this.savedCfg.set(true);
    } catch (e: any) {
      this.error.set(e?.message ?? 'Save failed');
    } finally {
      this.savingCfg.set(false);
    }
  }

  newItem() { this.form = { title: '', content: '', sort: this.items().length + 1, published: true }; this.editing.set(true); }
  edit(k: ChatKnowledgeRow) { this.form = { ...k }; this.editing.set(true); }

  async saveItem() {
    if (!this.form.title.trim() || !this.form.content.trim()) { this.error.set('Title and content are required.'); return; }
    this.savingItem.set(true); this.error.set(null);
    try {
      await this.data.saveChatKnowledge(this.form);
      this.editing.set(false);
      this.items.set(await this.data.listChatKnowledge());
    } catch (e: any) {
      this.error.set(e?.message ?? 'Save failed');
    } finally {
      this.savingItem.set(false);
    }
  }

  async remove(k: ChatKnowledgeRow) {
    if (!k.id || !confirm(`Delete "${k.title}"?`)) return;
    await this.data.deleteChatKnowledge(k.id);
    this.items.set(await this.data.listChatKnowledge());
  }
}
