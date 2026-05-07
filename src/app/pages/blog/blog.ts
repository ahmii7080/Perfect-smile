import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BlogService } from '../../services/blog.service';
import { BlogPost } from '../../models/appointment.model';
import { BlogIllustrationComponent } from '../../components/blog-illustration/blog-illustration';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, BlogIllustrationComponent],
  templateUrl: './blog.html',
  styleUrl: './blog.scss'
})
export class BlogPage implements OnInit {
  private blog = inject(BlogService);

  posts    = signal<BlogPost[]>([]);
  search   = signal('');
  category = signal('All');

  categories = computed(() => {
    const set = new Set(this.posts().map(p => p.category));
    return ['All', ...Array.from(set)];
  });

  filtered = computed(() => {
    const q = this.search().toLowerCase().trim();
    const c = this.category();
    return this.posts().filter(p => {
      const matchesCat    = c === 'All' || p.category === c;
      const matchesSearch = !q || p.title.toLowerCase().includes(q) || p.excerpt.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  });

  featured = computed(() => this.filtered()[0]);
  rest     = computed(() => this.filtered().slice(1));
  recent   = computed(() => this.posts().slice(0, 4));

  ngOnInit() {
    this.blog.list().subscribe(list => this.posts.set(list));
  }

  setCategory(c: string) { this.category.set(c); }
  onSearch(value: string) { this.search.set(value); }
}
