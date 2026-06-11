import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { RouterLink } from '@angular/router';
import { AdminDataService, ConsultantRow } from '../../services/admin-data.service';

@Component({
  selector: 'app-admin-consultants-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './consultants-list.html',
  styleUrl: '../admin-shared.scss',
})
export class AdminConsultantsList implements OnInit {
  private data = inject(AdminDataService);

  consultants = signal<ConsultantRow[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);

  /** Pagination — same 10/page contract as the other admin lists. */
  readonly PAGE_SIZE = 10;
  currentPage = signal(1);
  totalPages = computed(() => Math.max(1, Math.ceil(this.consultants().length / this.PAGE_SIZE)));
  paged = computed(() => {
    const start = (this.currentPage() - 1) * this.PAGE_SIZE;
    return this.consultants().slice(start, start + this.PAGE_SIZE);
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
      this.consultants.set(await this.data.listConsultants());
    } catch (e: any) {
      this.error.set(e.message ?? 'Failed to load');
    } finally {
      this.loading.set(false);
    }
  }

  async remove(id: string | undefined, name: string) {
    if (!id) return;
    if (!confirm(`Remove "${name}"?`)) return;
    try {
      await this.data.deleteConsultant(id);
      await this.refresh();
    } catch (e: any) {
      this.error.set(e.message ?? 'Delete failed');
    }
  }
}
