import { Component, HostListener, OnInit, inject, signal } from '@angular/core';

import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AdminAuthService } from '../../services/admin-auth.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class AdminLayout implements OnInit {
  private auth = inject(AdminAuthService);
  private router = inject(Router);

  /**
   * Sidebar visibility state.
   *
   * Desktop (> 900px): true = full 240px sidebar, false = collapsed 70px rail.
   * Mobile  (≤ 900px): true = drawer slid in (with backdrop), false = drawer hidden.
   */
  sidebarOpen = signal(true);

  /** True when viewport ≤ 900px — drives the drawer behaviour. */
  isMobile = signal(false);

  email = () => this.auth.user()?.email ?? '';

  contentSections: { title: string; items: NavItem[] }[] = [
    {
      title: 'Content',
      items: [
        { label: 'Services', route: '/adminauthlogin/services', icon: 'fa-list-check' },
        { label: 'Blog Posts', route: '/adminauthlogin/blog', icon: 'fa-pen-nib' },
        { label: 'Gallery', route: '/adminauthlogin/gallery', icon: 'fa-images' },
      ],
    },
    {
      title: 'Team',
      items: [
        { label: 'Support Team', route: '/adminauthlogin/team', icon: 'fa-people-group' },
        {
          label: 'Visiting Consultants',
          route: '/adminauthlogin/consultants',
          icon: 'fa-user-doctor',
        },
      ],
    },
  ];

  ngOnInit() {
    // Set initial state based on viewport
    this.refreshIsMobile();
    if (this.isMobile()) this.sidebarOpen.set(false);

    // Auto-close the mobile drawer after navigation so the new page is visible
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      if (this.isMobile()) this.sidebarOpen.set(false);
    });
  }

  @HostListener('window:resize')
  onResize() {
    const wasMobile = this.isMobile();
    this.refreshIsMobile();
    // When resizing from mobile → desktop, open sidebar (it would otherwise look broken)
    if (wasMobile && !this.isMobile()) this.sidebarOpen.set(true);
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.isMobile() && this.sidebarOpen()) this.sidebarOpen.set(false);
  }

  private refreshIsMobile() {
    this.isMobile.set(window.matchMedia('(max-width: 900px)').matches);
  }

  toggleSidebar() {
    this.sidebarOpen.update((v) => !v);
  }
  closeSidebar() {
    if (this.isMobile()) this.sidebarOpen.set(false);
  }

  signOut() {
    this.auth.signOut();
  }
}
