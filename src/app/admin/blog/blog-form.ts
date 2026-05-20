import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { AdminDataService } from '../../services/admin-data.service';
import { environment } from '../../../environments/environment';
import {
  META_DESC_MAX,
  SEO_TITLE_MAX,
  SeoAnalysisService,
  SeoReport
} from './seo-analysis.service';

/** Side panel currently shown — drives the 3-tab sidebar. */
type SidebarTab = 'analysis' | 'meta' | 'settings';

/** Sub-tabs inside the SEO Analysis panel (Yoast-style breakdown). */
type AnalysisSubTab = 'overview' | 'keyword' | 'readability' | 'structure';

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
  private fb     = inject(FormBuilder);
  private data   = inject(AdminDataService);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);
  private seoAnalysis = inject(SeoAnalysisService);

  /** Two length constants the template uses to render `0/60`, `0/160` counters. */
  readonly TITLE_MAX = SEO_TITLE_MAX;
  readonly DESC_MAX  = META_DESC_MAX;

  editingId = signal<string | null>(null);
  saving    = signal(false);
  uploading = signal(false);
  error     = signal<string | null>(null);
  preview   = signal<string | null>(null);

  /** Which sidebar tab is open. Defaults to SEO Analysis (the most useful
   *  surface — gives the author immediate feedback as they type). */
  activeTab = signal<SidebarTab>('analysis');

  /** Active sub-tab inside the SEO Analysis panel. */
  analysisSubTab = signal<AnalysisSubTab>('overview');

  /** Active issue/improvements detail row id, for inline expand UX. */
  openIssue = signal<string | null>(null);

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
    title:    ['', [Validators.required, Validators.minLength(5)]],
    slug:     ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    excerpt:  ['', [Validators.required, Validators.minLength(20)]],
    category: ['General', Validators.required],
    author:   ['Dr. Muhammad Faizan Sheikh', Validators.required],
    date:     [new Date().toISOString().slice(0, 10), Validators.required],
    readTime: ['5 min', Validators.required],
    color:    ['#0EA5E9', Validators.required],
    image:    [''],
    content:  ['', [Validators.required, Validators.minLength(50)]],

    // ---- SEO meta (admin sidebar). All optional. ----
    seoTitle:        [''],
    metaDescription: [''],
    focusKeyword:    [''],
    seoTags:         [''],
    imageAlt:        [''],
  });

  /**
   * Live form snapshot as a signal. We mirror `valueChanges` (Observable)
   * into a signal so downstream `computed` SEO analysis re-runs whenever
   * the author types — without any manual subscribe/unsubscribe plumbing.
   *
   * `requireSync` works because reactive forms emit synchronously on
   * subscribe via `startWith(form.value)`-equivalent semantics — we still
   * supply `initialValue` for type-safety and SSR safety.
   */
  private formValue = toSignal(this.form.valueChanges, { initialValue: this.form.value });

  /** Live SEO report. Recomputes only when any tracked form field changes. */
  report = computed<SeoReport>(() => {
    const v = this.formValue();
    return this.seoAnalysis.analyse({
      // Falls back to the human title/excerpt when the SEO override is
      // empty — same fallback strategy the public SeoService uses, so
      // the admin's report matches what'll ship to Google.
      seoTitle:        (v.seoTitle || v.title || '').trim(),
      metaDescription: (v.metaDescription || v.excerpt || '').trim(),
      htmlContent:     v.content || '',
      slug:            v.slug || '',
      focusKeyword:    v.focusKeyword || '',
      imageAlt:        v.imageAlt || '',
      featuredImage:   v.image || ''
    });
  });

  /** Counts for the SEO Analysis tab summary row (1 passed / 2 warnings / 4 issues). */
  passed   = computed(() => this.report().issues.filter(i => i.level === 'pass').length);
  warnings = computed(() => this.report().issues.filter(i => i.level === 'warn').length);
  fails    = computed(() => this.report().issues.filter(i => i.level === 'fail').length);

  /** Score → colour/label mapping used by the circular score widget. */
  scoreLabel = computed(() => {
    const s = this.report().score;
    if (s >= 80) return { text: 'Good',  cls: 'is-good'   };
    if (s >= 50) return { text: 'OK',    cls: 'is-ok'     };
    return       { text: 'Poor',         cls: 'is-poor'   };
  });

  /** Google SERP preview snippets — what the listing will look like. */
  previewTitle = computed(() => {
    const v = this.formValue();
    const t = (v.seoTitle || v.title || 'Page Title').trim();
    return t.length > 60 ? t.slice(0, 59).trimEnd() + '…' : t;
  });
  previewDesc = computed(() => {
    const v = this.formValue();
    const d = (v.metaDescription || v.excerpt || '').trim();
    if (!d) return 'Add a meta description…';
    return d.length > 160 ? d.slice(0, 159).trimEnd() + '…' : d;
  });
  previewUrl = computed(() => {
    const v = this.formValue();
    const slug = v.slug || 'post-url-slug';
    // Strip protocol for a cleaner SERP visual (Google does the same).
    return `${environment.siteUrl.replace(/^https?:\/\//, '')}/blog/${slug}`;
  });

  invalid(field: string) {
    const c = this.form.get(field);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  /** Read live field value — used in templates for length counters. */
  val(field: string): string {
    // The form's value type is permissive — index by string + coerce.
    // We only call this from the template with literal field names.
    return ((this.formValue() as Record<string, unknown>)[field] as string) ?? '';
  }

  /** Auto-generate slug from title while creating (don't overwrite while editing). */
  onTitleChange(value: string) {
    if (!this.editingId() && !this.form.get('slug')?.dirty) {
      this.form.patchValue({ slug: slugify(value) }, { emitEvent: false });
    }
  }

  setTab(t: SidebarTab)              { this.activeTab.set(t); }
  setAnalysisSub(t: AnalysisSubTab)  { this.analysisSubTab.set(t); }
  toggleIssue(id: string)            { this.openIssue.set(this.openIssue() === id ? null : id); }

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
          seoTitle:        p.seoTitle        ?? '',
          metaDescription: p.metaDescription ?? '',
          focusKeyword:    p.focusKeyword    ?? '',
          seoTags:         p.seoTags         ?? '',
          imageAlt:        p.imageAlt        ?? '',
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
        // SEO meta — pass through; AdminDataService coerces '' → null.
        seoTitle:        v.seoTitle        || undefined,
        metaDescription: v.metaDescription || undefined,
        focusKeyword:    v.focusKeyword    || undefined,
        seoTags:         v.seoTags         || undefined,
        imageAlt:        v.imageAlt        || undefined,
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
