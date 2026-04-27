export interface Appointment {
  fullName: string;
  phone: string;
  email: string;
  service: string;
  doctor: string;
  date: string;
  timeSlot: string;
  message?: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
  author: string;
  color: string;
  content: string;
  image?: string;
}

export interface Testimonial {
  name: string;
  location: string;
  rating: number;
  color: string;
  quote: string;
}
