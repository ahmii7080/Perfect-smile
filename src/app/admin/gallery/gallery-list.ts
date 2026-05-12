import { Component, OnInit, inject, signal } from '@angular/core';

import { RouterLink } from '@angular/router';
import { AdminDataService, GalleryRow } from '../../services/admin-data.service';

@Component({
  selector: 'app-admin-gallery-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './gallery-list.html',
  styleUrl: '../admin-shared.scss',
})
export class AdminGalleryList implements OnInit {
  private data = inject(AdminDataService);

  cases = signal<GalleryRow[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  async ngOnInit() {
    await this.refresh();
  }

  async refresh() {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.cases.set(await this.data.listGallery());
    } catch (e: any) {
      this.error.set(e.message ?? 'Failed to load');
    } finally {
      this.loading.set(false);
    }
  }

  async remove(id: string | undefined, title: string) {
    if (!id) return;
    if (!confirm(`Delete "${title}" from gallery?`)) return;
    try {
      await this.data.deleteGallery(id);
      await this.refresh();
    } catch (e: any) {
      this.error.set(e.message ?? 'Delete failed');
    }
  }
}
