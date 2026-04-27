import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DataService } from '../../services/data.service';
import { ServiceItem } from '../../models/service.model';

@Component({
  selector: 'app-service-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './service-detail.html',
  styleUrl: './service-detail.scss'
})
export class ServiceDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private data  = inject(DataService);

  service = signal<ServiceItem | undefined>(undefined);
  related = signal<ServiceItem[]>([]);
  openFaq = signal<number>(0);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug') ?? '';
      this.data.getServiceBySlug(slug).subscribe(s => this.service.set(s));
      this.data.getServices().subscribe(list => {
        this.related.set(list.filter(x => x.slug !== slug).slice(0, 3));
      });
    });
  }

  toggleFaq(i: number) {
    this.openFaq.set(this.openFaq() === i ? -1 : i);
  }
}
