import { Routes } from '@angular/router';
import { adminGuard } from './guards/admin.guard';
import { serviceResolver } from './resolvers/service.resolver';
import { blogResolver } from './resolvers/blog.resolver';

/*
 * Public-site routes have NO `title:` property on purpose. Each page
 * component injects `SeoService` and sets its title via `seo.set()` — the
 * full SEO surface (title + description + canonical + Open Graph + JSON-LD)
 * is owned in one place per page. Letting the router also push a title
 * would race-overwrite the SeoService value after NavigationEnd.
 *
 * Admin routes keep their `title:` — they're never prerendered, never
 * indexed, and their titles only affect the browser tab.
 */
export const routes: Routes = [
  /* ============== Public site ============== */
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then(m => m.HomePage)
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about').then(m => m.AboutPage)
  },
  {
    path: 'services',
    loadComponent: () => import('./pages/services/services').then(m => m.ServicesPage)
  },
  {
    path: 'services/:slug',
    loadComponent: () => import('./pages/service-detail/service-detail').then(m => m.ServiceDetailPage),
    // Pre-fetch the service so the detail page renders (and applies SEO)
    // synchronously after activation — required for clean SSR prerender.
    resolve: { service: serviceResolver }
  },
  {
    path: 'doctors',
    loadComponent: () => import('./pages/doctors/doctors').then(m => m.DoctorsPage)
  },
  {
    path: 'team',
    loadComponent: () => import('./pages/team/team').then(m => m.TeamPage)
  },
  {
    path: 'gallery',
    loadComponent: () => import('./pages/gallery/gallery').then(m => m.GalleryPage)
  },
  {
    path: 'blog',
    loadComponent: () => import('./pages/blog/blog').then(m => m.BlogPage)
  },
  {
    path: 'blog/:slug',
    loadComponent: () => import('./pages/blog-detail/blog-detail').then(m => m.BlogDetailPage),
    resolve: { post: blogResolver }
  },
  {
    path: 'appointment',
    loadComponent: () => import('./pages/appointment/appointment').then(m => m.AppointmentPage)
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact').then(m => m.ContactPage)
  },

  /* ============== Admin (everything under one obscured slug) ============== */
  // Single obscured prefix for the entire admin surface — the login page,
  // the auth-gated dashboard, and every CRUD form all live under
  // /adminauthlogin/*. Two parallel route definitions:
  //   - `pathMatch: 'full'` on the first entry pins /adminauthlogin (exact)
  //     to the login screen so unauthenticated visits show the form.
  //   - The second entry catches every /adminauthlogin/<something> sub-path,
  //     gates it on `adminGuard`, and mounts the AdminLayout shell.
  // Together they keep the path off the radar of /admin/* scanners.
  {
    path: 'adminauthlogin',
    pathMatch: 'full',
    loadComponent: () => import('./admin/login/login').then(m => m.AdminLoginPage),
    title: 'Sign in — Admin'
  },
  {
    path: 'adminauthlogin',
    canActivate: [adminGuard],
    loadComponent: () => import('./admin/layout/layout').then(m => m.AdminLayout),
    children: [
      { path: '',                redirectTo: 'services',      pathMatch: 'full' },

      { path: 'services',          loadComponent: () => import('./admin/services/services-list').then(m => m.AdminServicesList), title: 'Services — Admin' },
      { path: 'services/new',      loadComponent: () => import('./admin/services/services-form').then(m => m.AdminServicesForm), title: 'New Service — Admin' },
      { path: 'services/:id/edit', loadComponent: () => import('./admin/services/services-form').then(m => m.AdminServicesForm), title: 'Edit Service — Admin' },

      { path: 'blog',            loadComponent: () => import('./admin/blog/blog-list').then(m => m.AdminBlogList),       title: 'Blog Posts — Admin' },
      { path: 'blog/new',        loadComponent: () => import('./admin/blog/blog-form').then(m => m.AdminBlogForm),       title: 'New Post — Admin' },
      { path: 'blog/:id/edit',   loadComponent: () => import('./admin/blog/blog-form').then(m => m.AdminBlogForm),       title: 'Edit Post — Admin' },

      { path: 'team',            loadComponent: () => import('./admin/team/team-list').then(m => m.AdminTeamList),       title: 'Team — Admin' },
      { path: 'team/new',        loadComponent: () => import('./admin/team/team-form').then(m => m.AdminTeamForm),       title: 'New Member — Admin' },
      { path: 'team/:id/edit',   loadComponent: () => import('./admin/team/team-form').then(m => m.AdminTeamForm),       title: 'Edit Member — Admin' },

      { path: 'gallery',         loadComponent: () => import('./admin/gallery/gallery-list').then(m => m.AdminGalleryList), title: 'Gallery — Admin' },
      { path: 'gallery/new',     loadComponent: () => import('./admin/gallery/gallery-form').then(m => m.AdminGalleryForm), title: 'New Case — Admin' },
      { path: 'gallery/:id/edit',loadComponent: () => import('./admin/gallery/gallery-form').then(m => m.AdminGalleryForm), title: 'Edit Case — Admin' },

      { path: 'consultants',     loadComponent: () => import('./admin/consultants/consultants-list').then(m => m.AdminConsultantsList), title: 'Consultants — Admin' },
      { path: 'consultants/new', loadComponent: () => import('./admin/consultants/consultants-form').then(m => m.AdminConsultantsForm), title: 'New Consultant — Admin' },
      { path: 'consultants/:id/edit', loadComponent: () => import('./admin/consultants/consultants-form').then(m => m.AdminConsultantsForm), title: 'Edit Consultant — Admin' }
    ]
  },

  { path: '**', redirectTo: '' }
];
