export interface Doctor {
  slug: string;
  name: string;
  specialization: string;
  qualifications: string;
  shortBio: string;
  fullBio: string;
  education: string[];
  expertise: string[];
  color: string;
}

export interface TeamMember {
  name: string;
  role: string;
  initials: string;
  color: string;
}
