import { Component, OnInit, inject, signal } from '@angular/core';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminDataService } from '../../services/admin-data.service';

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

@Component({
  selector: 'app-admin-blog-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './blog-form.html',
  styleUrl: '../admin-shared.scss',
})
export class AdminBlogForm implements OnInit {
  private fb = inject(FormBuilder);
  private data = inject(AdminDataService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  editingId = signal<string | null>(null);
  saving = signal(false);
  uploading = signal(false);
  error = signal<string | null>(null);
  preview = signal<string | null>(null);

  categories = [
    'Implants',
    'Cosmetic',
    'Orthodontics',
    'Pediatric',
    'Lifestyle',
    'Hygiene',
    'General',
  ];
  colors = ['#0EA5E9', '#0284C7', '#14B8A6', '#38BDF8', '#0F766E', '#0C4A6E'];

  form: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(5)]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    excerpt: ['', [Validators.required, Validators.minLength(20)]],
    category: ['General', Validators.required],
    author: ['Dr. Faizan Sheikh', Validators.required],
    date: [new Date().toISOString().slice(0, 10), Validators.required],
    readTime: ['5 min', Validators.required],
    color: ['#0EA5E9', Validators.required],
    image: [''],
    content: ['', [Validators.required, Validators.minLength(50)]],
  });

  invalid(field: string) {
    const c = this.form.get(field);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  /** Auto-generate slug from title while creating (don't overwrite while editing). */
  onTitleChange(value: string) {
    if (!this.editingId() && !this.form.get('slug')?.dirty) {
      this.form.patchValue({ slug: slugify(value) }, { emitEvent: false });
    }
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editingId.set(id);
      try {
        const p = await this.data.getBlog(id);
        this.form.patchValue({
          title: p.title,
          slug: p.slug,
          excerpt: p.excerpt,
          category: p.category,
          author: p.author,
          date: p.date,
          readTime: p.readTime,
          color: p.color,
          image: p.image ?? '',
          content: p.content,
        });
        this.preview.set(p.image ?? null);
      } catch (e: any) {
        this.error.set(e.message ?? 'Failed to load post');
      }
    }
  }

  async onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      this.error.set('Image must be smaller than 5 MB.');
      return;
    }
    this.uploading.set(true);
    this.error.set(null);
    try {
      const url = await this.data.uploadImage('blog', file);
      this.form.patchValue({ image: url });
      this.preview.set(url);
    } catch (e: any) {
      this.error.set(e.message ?? 'Image upload failed');
    } finally {
      this.uploading.set(false);
      input.value = '';
    }
  }

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    try {
      const v = this.form.value;
      const payload = {
        title: v.title,
        slug: v.slug,
        excerpt: v.excerpt,
        category: v.category,
        author: v.author,
        date: v.date,
        readTime: v.readTime,
        color: v.color,
        image: v.image || undefined,
        content: v.content,
      };
      if (this.editingId()) {
        await this.data.updateBlog(this.editingId()!, payload);
      } else {
        await this.data.createBlog(payload);
      }
      this.router.navigate(['/adminauthlogin/blog']);
    } catch (e: any) {
      this.error.set(e.message ?? 'Save failed');
    } finally {
      this.saving.set(false);
    }
  }
}
