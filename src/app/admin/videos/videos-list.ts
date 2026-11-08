import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminDataService, AdminVideo } from '../../services/admin-data.service';

@Component({
  selector: 'app-admin-videos-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './videos-list.html',
  styleUrl: '../admin-shared.scss',
})
export class AdminVideosList implements OnInit {
  private data = inject(AdminDataService);

  videos = signal<AdminVideo[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  async ngOnInit() {
    await this.refresh();
  }

  async refresh() {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.videos.set(await this.data.listVideos());
    } catch (e: any) {
      this.error.set(
        e?.code === '42P01' || e?.code === 'PGRST205'
          ? 'Videos table not found — run supabase-videos-chatbot-migration.sql in Supabase first.'
          : (e.message ?? 'Failed to load'),
      );
    } finally {
      this.loading.set(false);
    }
  }

  async remove(v: AdminVideo) {
    if (!v.id || !confirm(`Delete video "${v.title}"?`)) return;
    try {
      await this.data.deleteVideo(v.id);
      await this.refresh();
    } catch (e: any) {
      this.error.set(e.message ?? 'Delete failed');
    }
  }
}
