import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminDataService } from '../../services/admin-data.service';
import { BlogPost } from '../../models/appointment.model';

@Component({
  selector: 'app-admin-blog-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './blog-list.html',
  styleUrl: '../admin-shared.scss'
})
export class AdminBlogList implements OnInit {
  private data = inject(AdminDataService);

  posts   = signal<(BlogPost & { id?: string })[]>([]);
  loading = signal(true);
  error   = signal<string | null>(null);
  search  = signal('');

  filtered = computed(() => {
    const q = this.search().toLowerCase().trim();
    if (!q) return this.posts();
    return this.posts().filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q)
    );
  });

  async ngOnInit() {
    await this.refresh();
  }

  async refresh() {
    this.loading.set(true); this.error.set(null);
    try {
      this.posts.set(await this.data.listBlog());
    } catch (e: any) {
      this.error.set(e.message ?? 'Failed to load posts');
    } finally {
      this.loading.set(false);
    }
  }

  async remove(id: string | undefined, title: string) {
    if (!id) return;
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await this.data.deleteBlog(id);
      await this.refresh();
    } catch (e: any) {
      this.error.set(e.message ?? 'Delete failed');
    }
  }
}
