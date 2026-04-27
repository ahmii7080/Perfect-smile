import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '../../services/data.service';
import { ServiceItem } from '../../models/service.model';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.scss'
})
export class FooterComponent {
  year = new Date().getFullYear();
  services: ServiceItem[] = [];

  constructor(private data: DataService) {
    this.data.getServices().subscribe(list => this.services = list.slice(0, 6));
  }
}
