export interface ServiceFaq {
  q: string;
  a: string;
}

export interface ServiceItem {
  slug: string;
  title: string;
  tagline: string;
  icon: string;
  color: string;
  summary: string;
  description: string;
  benefits: string[];
  procedure: string[];
  faqs: ServiceFaq[];
}
