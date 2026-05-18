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

  /* ---- SEO meta (admin sidebar fields). All optional so existing rows
     keep working — when blank the public site falls back to title /
     excerpt for SeoService.set, exactly like before. ---- */

  /** Custom `<title>` override. Falls back to `title` when empty. */
  seoTitle?: string;
  /** Custom `<meta name="description">`. Falls back to `excerpt`. */
  metaDescription?: string;
  /** Primary keyword the post is optimised for. Drives the keyword
   *  density / in-title / in-slug checks in the admin SEO panel. */
  focusKeyword?: string;
  /** Comma-separated tag list for `<meta name="keywords">`. */
  seoTags?: string;
  /** Featured image `alt` text for SEO + accessibility. */
  imageAlt?: string;
}

export interface Testimonial {
  name: string;
  location: string;
  rating: number;
  color: string;
  quote: string;
}
