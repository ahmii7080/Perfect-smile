import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { RouterLink } from '@angular/router';
import { AdminDataService } from '../../services/admin-data.service';
import { ServiceItem } from '../../models/service.model';

@Component({
  selector: 'app-admin-services-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './services-list.html',
  styleUrl: '../admin-shared.scss',
})
export class AdminServicesList implements OnInit {
  private data = inject(AdminDataService);

  services = signal<(ServiceItem & { id?: string; sortOrder?: number })[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  /** Pagination — same 10/page contract as the other admin lists. */
  readonly PAGE_SIZE = 10;
  currentPage = signal(1);
  totalPages = computed(() => Math.max(1, Math.ceil(this.services().length / this.PAGE_SIZE)));
  paged = computed(() => {
    const start = (this.currentPage() - 1) * this.PAGE_SIZE;
    return this.services().slice(start, start + this.PAGE_SIZE);
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
      this.services.set(await this.data.listServices());
    } catch (e: any) {
      this.error.set(e.message ?? 'Failed to load services');
    } finally {
      this.loading.set(false);
    }
  }

  async remove(id: string | undefined, title: string) {
    if (!id) return;
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await this.data.deleteService(id);
      await this.refresh();
    } catch (e: any) {
      this.error.set(e.message ?? 'Delete failed');
    }
  }
}
