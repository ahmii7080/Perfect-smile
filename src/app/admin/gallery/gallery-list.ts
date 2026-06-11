import { Component, OnInit, computed, inject, signal } from '@angular/core';

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

  /** Pagination — same 10/page contract as the other admin lists. No
   *  search input on this view, so the source for paging is `cases()`
   *  directly. If we add filtering later, swap `cases()` → `filtered()`. */
  readonly PAGE_SIZE = 10;
  currentPage = signal(1);
  totalPages = computed(() => Math.max(1, Math.ceil(this.cases().length / this.PAGE_SIZE)));
  paged = computed(() => {
    const start = (this.currentPage() - 1) * this.PAGE_SIZE;
    return this.cases().slice(start, start + this.PAGE_SIZE);
  });
  nextPage() { if (this.currentPage() < this.totalPages()) this.currentPage.update(v => v + 1); }
  prevPage() { if (this.currentPage() > 1)                this.currentPage.update(v => v - 1); }

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
