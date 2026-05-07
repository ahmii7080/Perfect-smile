import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BlogService } from '../../services/blog.service';
import { DataService } from '../../services/data.service';
import { BlogPost } from '../../models/appointment.model';
import { BlogIllustrationComponent } from '../../components/blog-illustration/blog-illustration';

@Component({
  selector: 'app-blog-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, BlogIllustrationComponent],
  templateUrl: './blog-detail.html',
  styleUrl: './blog-detail.scss'
})
export class BlogDetailPage implements OnInit {
  private route = inject(ActivatedRoute);
  private data  = inject(DataService);
  private blog  = inject(BlogService);

  post    = signal<BlogPost | undefined>(undefined);
  related = signal<BlogPost[]>([]);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const slug = params.get('slug') ?? '';
      this.data.getBlogBySlug(slug).subscribe(p => this.post.set(p));
      this.blog.related(slug, 3).subscribe(r => this.related.set(r));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }
}
