import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { DataService } from '../../services/data.service';
import { BlogPost } from '../../models/appointment.model';
import { BlogIllustrationComponent } from '../../components/blog-illustration/blog-illustration';
import { SeoService } from '../../services/seo.service';
import { StructuredDataService } from '../../services/structured-data.service';
import { BreadcrumbComponent, BreadcrumbItem } from '../../components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-blog-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, BlogIllustrationComponent, BreadcrumbComponent],
  templateUrl: './blog-detail.html',
  styleUrl: './blog-detail.scss'
})
export class BlogDetailPage implements OnInit {
  private route          = inject(ActivatedRoute);
  private data           = inject(DataService);
  private blog           = inject(BlogService);
  private seo            = inject(SeoService);
  private structuredData = inject(StructuredDataService);
  private isBrowser      = isPlatformBrowser(inject(PLATFORM_ID));

  post        = signal<BlogPost | undefined>(undefined);
  related     = signal<BlogPost[]>([]);
  breadcrumbs = signal<BreadcrumbItem[]>([]);

  ngOnInit() {
    // Resolver guarantees `post` is loaded before the route activates,
    // so Article schema + article:* OG meta tags reliably end up in the
    // prerendered HTML (vs. firing too late from an async subscription).
    const snapshot = this.route.snapshot;
    const slug     = snapshot.paramMap.get('slug') ?? '';
    const p        = snapshot.data['post'] as BlogPost | undefined;

    this.post.set(p);
    this.applySeo(slug, p);

    // Related posts — non-SEO-critical, can stay async.
    this.blog.related(slug, 3).subscribe(r => this.related.set(r));

    // Scroll-to-top is a no-op during SSR/prerender (no window).
    if (this.isBrowser) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Drive Article schema + meta tags off the loaded blog post. Articles
   * earn dedicated rich-result placements in Google news/health verticals
   * when the structured-data + dateline are clean.
   */
  private applySeo(slug: string, p: BlogPost | undefined): void {
    const path = `/blog/${slug}`;

    if (!p) {
      this.seo.set({
        title:       'Article Not Found',
        description: 'The requested article could not be found on The Perfect Smile dental blog.',
        path,
        noindex:     true
      });
      this.breadcrumbs.set([
        { label: 'Home', path: '/' },
        { label: 'Blog', path: '/blog' }
      ]);
      return;
    }

    this.seo.set({
      title:         p.title,
      description:   p.excerpt,
      path,
      image:         p.image,
      type:          'article',
      publishedTime: p.date,
      author:        p.author
    });

    this.structuredData.setArticle({
      headline:      p.title,
      slug:          p.slug,
      description:   p.excerpt,
      image:         p.image,
      datePublished: p.date,
      authorName:    p.author
    });

    const crumbs: BreadcrumbItem[] = [
      { label: 'Home',  path: '/' },
      { label: 'Blog',  path: '/blog' },
      { label: p.title, path }
    ];
    this.breadcrumbs.set(crumbs);
    this.structuredData.setBreadcrumb(crumbs);
  }
}
