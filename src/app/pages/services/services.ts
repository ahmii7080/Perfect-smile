import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '../../services/data.service';
import { ServiceItem } from '../../models/service.model';
import { ServiceCardComponent } from '../../components/service-card/service-card';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, RouterLink, ServiceCardComponent],
  templateUrl: './services.html',
  styleUrl: './services.scss'
})
export class ServicesPage implements OnInit {
  private data = inject(DataService);
  services = signal<ServiceItem[]>([]);

  ngOnInit() {
    this.data.getServices().subscribe(list => this.services.set(list));
  }
}
