import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { TeamMember } from '../../models/doctor.model';
import { ConsultantRow } from '../../services/admin-data.service';

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './team.html',
  styleUrl: './team.scss'
})
export class TeamPage implements OnInit {
  private data = inject(DataService);

  team        = signal<TeamMember[]>([]);
  consultants = signal<ConsultantRow[]>([]);

  ngOnInit() {
    this.data.getTeam().subscribe(list => this.team.set(list));
    this.data.getConsultants().subscribe(list => this.consultants.set(list));
  }
}
