import { Routes } from '@angular/router';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  /* ============== Public site ============== */
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then(m => m.HomePage),
    title: 'The Perfect Smile — Dental Clinic, Faisalabad'
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about').then(m => m.AboutPage),
    title: 'About Us — The Perfect Smile'
  },
  {
    path: 'services',
    loadComponent: () => import('./pages/services/services').then(m => m.ServicesPage),
    title: 'Our Services — The Perfect Smile'
  },
  {
    path: 'services/:slug',
    loadComponent: () => import('./pages/service-detail/service-detail').then(m => m.ServiceDetailPage),
    title: 'Service — The Perfect Smile'
  },
  {
    path: 'doctors',
    loadComponent: () => import('./pages/doctors/doctors').then(m => m.DoctorsPage),
    title: 'Our Doctors — The Perfect Smile'
  },
  {
    path: 'team',
    loadComponent: () => import('./pages/team/team').then(m => m.TeamPage),
    title: 'Our Team — The Perfect Smile'
  },
  {
    path: 'gallery',
    loadComponent: () => import('./pages/gallery/gallery').then(m => m.GalleryPage),
    title: 'Smile Gallery — The Perfect Smile'
  },
  {
    path: 'blog',
    loadComponent: () => import('./pages/blog/blog').then(m => m.BlogPage),
    title: 'Blog — The Perfect Smile'
  },
  {
    path: 'blog/:slug',
    loadComponent: () => import('./pages/blog-detail/blog-detail').then(m => m.BlogDetailPage),
    title: 'Article — The Perfect Smile'
  },
  {
    path: 'appointment',
    loadComponent: () => import('./pages/appointment/appointment').then(m => m.AppointmentPage),
    title: 'Book Appointment — The Perfect Smile'
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact').then(m => m.ContactPage),
    title: 'Contact — The Perfect Smile'
  },

  /* ============== Admin ============== */
  // Obscure login slug — keeps the path off the radar of generic /admin/login scanners.
  {
    path: 'adminauthlogin',
    loadComponent: () => import('./admin/login/login').then(m => m.AdminLoginPage),
    title: 'Sign in — Admin'
  },
  {
    path: 'admin',
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
