import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminDataService } from '../../services/admin-data.service';
import { TeamMember } from '../../models/doctor.model';

@Component({
  selector: 'app-admin-team-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './team-list.html',
  styleUrl: '../admin-shared.scss'
})
export class AdminTeamList implements OnInit {
  private data = inject(AdminDataService);

  members = signal<(TeamMember & { id?: string })[]>([]);
  loading = signal(true);
  error   = signal<string | null>(null);

  async ngOnInit() { await this.refresh(); }

  async refresh() {
    this.loading.set(true); this.error.set(null);
    try {
      this.members.set(await this.data.listTeam());
    } catch (e: any) {
      this.error.set(e.message ?? 'Failed to load team');
    } finally {
      this.loading.set(false);
    }
  }

  async remove(id: string | undefined, name: string) {
    if (!id) return;
    if (!confirm(`Remove "${name}" from the team?`)) return;
    try {
      await this.data.deleteTeam(id);
      await this.refresh();
    } catch (e: any) {
      this.error.set(e.message ?? 'Delete failed');
    }
  }
}
