import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminDataService, ConsultantRow } from '../../services/admin-data.service';

@Component({
  selector: 'app-admin-consultants-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './consultants-list.html',
  styleUrl: '../admin-shared.scss'
})
export class AdminConsultantsList implements OnInit {
  private data = inject(AdminDataService);

  consultants = signal<ConsultantRow[]>([]);
  loading     = signal(true);
  error       = signal<string | null>(null);

  async ngOnInit() { await this.refresh(); }

  async refresh() {
    this.loading.set(true); this.error.set(null);
    try { this.consultants.set(await this.data.listConsultants()); }
    catch (e: any) { this.error.set(e.message ?? 'Failed to load'); }
    finally { this.loading.set(false); }
  }

  async remove(id: string | undefined, name: string) {
    if (!id) return;
    if (!confirm(`Remove "${name}"?`)) return;
    try {
      await this.data.deleteConsultant(id);
      await this.refresh();
    } catch (e: any) { this.error.set(e.message ?? 'Delete failed'); }
  }
}
