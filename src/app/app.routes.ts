import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home').then(m => m.HomePage),
    title: 'The Perfect Smile — Premium Dental & Implant Centre, Faisalabad'
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
  { path: '**', redirectTo: '' }
];
