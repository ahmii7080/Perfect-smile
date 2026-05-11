import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { TeamMember } from '../../models/doctor.model';
import { ConsultantRow } from '../../services/admin-data.service';
import { SeoService } from '../../services/seo.service';
import { StructuredDataService } from '../../services/structured-data.service';
import { BreadcrumbComponent, BreadcrumbItem } from '../../components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [CommonModule, BreadcrumbComponent],
  templateUrl: './team.html',
  styleUrl: './team.scss'
})
export class TeamPage implements OnInit {
  private data           = inject(DataService);
  private seo            = inject(SeoService);
  private structuredData = inject(StructuredDataService);

  team        = signal<TeamMember[]>([]);
  consultants = signal<ConsultantRow[]>([]);

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', path: '/' },
    { label: 'Team', path: '/team' }
  ];

  constructor() {
    this.seo.set({
      title: 'Our Team — Dental Staff in Faisalabad',
      description:
        'Meet the dental support team and visiting consultants at The Perfect Smile Faisalabad — qualified professionals committed to honest, gentle, on-time patient care.',
      path: '/team'
    });
    this.structuredData.setBreadcrumb(this.breadcrumbs);
  }

  ngOnInit() {
    this.data.getTeam().subscribe(list => this.team.set(list));
    this.data.getConsultants().subscribe(list => this.consultants.set(list));
  }
}
