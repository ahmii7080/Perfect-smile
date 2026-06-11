import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BlogService } from '../../services/blog.service';
import { BlogPost } from '../../models/appointment.model';
import { BlogIllustrationComponent } from '../../components/blog-illustration/blog-illustration';
import { SeoService } from '../../services/seo.service';
import { StructuredDataService } from '../../services/structured-data.service';
import {
  BreadcrumbComponent,
  BreadcrumbItem,
} from '../../components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [RouterLink, FormsModule, BlogIllustrationComponent, BreadcrumbComponent],
  templateUrl: './blog.html',
  styleUrl: './blog.scss',
})
export class BlogPage implements OnInit {
  private blog = inject(BlogService);
  private seo = inject(SeoService);
  private structuredData = inject(StructuredDataService);

  readonly breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', path: '/' },
    { label: 'Blog', path: '/blog' },
  ];

  constructor() {
    this.seo.set({
      title: 'Dental Blog — Faisalabad Dentist',
      description:
        'Plain-English dental health advice from The Perfect Smile, Faisalabad — implants, braces, whitening, gum care, kids dentistry and more, written by qualified dentists.',
      path: '/blog',
      keywords: [
        'dental blog Faisalabad',
        'dental health tips Faisalabad',
        'dentist articles Faisalabad',
        'dental advice FSD',
        'oral health Pakistan',
        'tooth care blog',
        'best dentist Faisalabad blog',
      ],
    });
    this.structuredData.setBreadcrumb(this.breadcrumbs);
  }

  posts = signal<BlogPost[]>([]);
  search = signal('');
  category = signal('All');

  /** Incremental reveal — start with the first 10 of `rest()` and let the
   *  user expand 10 at a time via "Show more articles". Resetting any
   *  filter (category click, search keystroke) snaps the count back to
   *  this baseline so the user never lands on a deep page that's been
   *  emptied by the new filter. */
  readonly BATCH = 10;
  visibleCount = signal(this.BATCH);

  categories = computed(() => {
    const set = new Set(this.posts().map((p) => p.category));
    return ['All', ...Array.from(set)];
  });

  filtered = computed(() => {
    const q = this.search().toLowerCase().trim();
    const c = this.category();
    return this.posts().filter((p) => {
      const matchesCat = c === 'All' || p.category === c;
      const matchesSearch =
        !q || p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  });

  featured = computed(() => this.filtered()[0]);
  rest = computed(() => this.filtered().slice(1));
  /** Currently-rendered slice of `rest()` (initial 10, grows on showMore). */
  visibleRest = computed(() => this.rest().slice(0, this.visibleCount()));
  /** True when there's at least one more post the user hasn't expanded yet. */
  hasMoreRest = computed(() => this.rest().length > this.visibleCount());
  recent = computed(() => this.posts().slice(0, 4));

  ngOnInit() {
    this.blog.list().subscribe((list) => this.posts.set(list));
  }

  showMore() {
    this.visibleCount.update((v) => v + this.BATCH);
  }
  setCategory(c: string) {
    this.category.set(c);
    this.visibleCount.set(this.BATCH);
  }
  onSearch(value: string) {
    this.search.set(value);
    this.visibleCount.set(this.BATCH);
  }
}
