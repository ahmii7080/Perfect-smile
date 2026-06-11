import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminDataService } from '../../services/admin-data.service';
import { BlogPost } from '../../models/appointment.model';

@Component({
  selector: 'app-admin-blog-list',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './blog-list.html',
  styleUrl: '../admin-shared.scss',
})
export class AdminBlogList implements OnInit {
  private data = inject(AdminDataService);

  posts = signal<(BlogPost & { id?: string })[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  search = signal('');

  /** Pagination state — 10 rows per page across every admin list (see
   *  also gallery-list, services-list, team-list, consultants-list). The
   *  search input below filters into `filtered()`, then `paged()` slices
   *  that for the current page. */
  readonly PAGE_SIZE = 10;
  currentPage = signal(1);

  filtered = computed(() => {
    const q = this.search().toLowerCase().trim();
    if (!q) return this.posts();
    return this.posts().filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q),
    );
  });

  /** Total page count derived from the post-filter list length. Always at
   *  least 1 so the footer reads "Page 1 of 1" on empty result sets. */
  totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.PAGE_SIZE)));

  /** Visible slice for the current page. If the user typed a query that
   *  shrinks the result below the current page, `clampPage()` (called by
   *  the search handler) snaps `currentPage` back to a valid value. */
  paged = computed(() => {
    const start = (this.currentPage() - 1) * this.PAGE_SIZE;
    return this.filtered().slice(start, start + this.PAGE_SIZE);
  });

  /** Search handler — resets to page 1 so the user always sees the top of
   *  the filtered result, never a deep page that's now empty. */
  onSearch(value: string) {
    this.search.set(value);
    this.currentPage.set(1);
  }
  nextPage() { if (this.currentPage() < this.totalPages()) this.currentPage.update(v => v + 1); }
  prevPage() { if (this.currentPage() > 1)                this.currentPage.update(v => v - 1); }

  async ngOnInit() {
    await this.refresh();
  }

  async refresh() {
    this.loading.set(true);
    this.error.set(null);
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
