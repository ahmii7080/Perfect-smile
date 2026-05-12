import { Component, HostListener, signal, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { DataService } from '../../services/data.service';
import { ServiceItem } from '../../models/service.model';
import { PrefetchOnHoverDirective } from '../../directives/prefetch-on-hover.directive';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgOptimizedImage, PrefetchOnHoverDirective],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class NavbarComponent {
  private data = inject(DataService);
  private router = inject(Router);

  scrolled = signal(false);
  mobileOpen = signal(false);
  servicesOpen = signal(false);
  services = signal<ServiceItem[]>([]);

  constructor() {
    this.data.getServices().subscribe((list) => this.services.set(list));
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      this.mobileOpen.set(false);
      this.servicesOpen.set(false);
    });
  }

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled.set(window.scrollY > 8);
  }

  toggleMobile() {
    this.mobileOpen.update((v) => !v);
  }
  toggleServices() {
    this.servicesOpen.update((v) => !v);
  }
}
