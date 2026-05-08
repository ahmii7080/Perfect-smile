import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminDataService } from '../../services/admin-data.service';

const slugify = (s: string): string =>
  s.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

/** Convert array of strings to one-per-line textarea content. */
const arrToText = (arr: string[] | undefined): string => (arr ?? []).join('\n');

/** Convert textarea content to array (skip empty lines, trim each). */
const textToArr = (text: string): string[] =>
  (text ?? '').split('\n').map(l => l.trim()).filter(l => l.length > 0);

@Component({
  selector: 'app-admin-services-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './services-form.html',
  styleUrl: '../admin-shared.scss'
})
export class AdminServicesForm implements OnInit {
  private fb     = inject(FormBuilder);
  private data   = inject(AdminDataService);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);

  editingId = signal<string | null>(null);
  saving    = signal(false);
  error     = signal<string | null>(null);

  // Useful Font Awesome icon shortcuts the user is likely to want
  iconSuggestions = [
    'fa-tooth', 'fa-stethoscope', 'fa-grip-lines', 'fa-wand-magic-sparkles',
    'fa-teeth', 'fa-palette', 'fa-syringe', 'fa-child-reaching', 'fa-leaf',
    'fa-sun', 'fa-truck-medical', 'fa-crown', 'fa-gem', 'fa-shield-halved'
  ];
  colors = ['#0EA5E9', '#0284C7', '#14B8A6', '#38BDF8', '#0F766E', '#0C4A6E'];

  form: FormGroup = this.fb.group({
    title:       ['', [Validators.required, Validators.minLength(3)]],
    slug:        ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    tagline:     ['', Validators.required],
    icon:        ['fa-tooth', Validators.required],
    color:       ['#0EA5E9', Validators.required],
    summary:     ['', [Validators.required, Validators.minLength(20)]],
    description: ['', Validators.required],
    benefitsRaw: [''],   // newline-separated, converted to string[] on save
    procedureRaw:[''],   // same
    sortOrder:   [0]
  });

  invalid(field: string) {
    const c = this.form.get(field);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  /** Auto-slug from title while creating (skip when editing — slug is the URL). */
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
        const s = await this.data.getService(id);
        this.form.patchValue({
          title: s.title, slug: s.slug, tagline: s.tagline,
          icon: s.icon, color: s.color, summary: s.summary,
          description: s.description,
          benefitsRaw: arrToText(s.benefits),
          procedureRaw: arrToText(s.procedure),
          sortOrder: s.sortOrder ?? 0
        });
      } catch (e: any) {
        this.error.set(e.message ?? 'Failed to load service');
      }
    } else {
      // Default sort_order = next number after the highest existing
      try {
        const list = await this.data.listServices();
        const maxOrder = list.reduce((m, s) => Math.max(m, s.sortOrder ?? 0), 0);
        this.form.patchValue({ sortOrder: maxOrder + 1 }, { emitEvent: false });
      } catch { /* not critical, ignore */ }
    }
  }

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true); this.error.set(null);
    try {
      const v = this.form.value;
      const payload = {
        slug: v.slug, title: v.title, tagline: v.tagline,
        icon: v.icon, color: v.color,
        summary: v.summary, description: v.description,
        benefits: textToArr(v.benefitsRaw),
        procedure: textToArr(v.procedureRaw),
        faqs: [], // FAQs editable via Supabase Table Editor for now
        sortOrder: Number(v.sortOrder) || 0
      };
      if (this.editingId()) {
        await this.data.updateService(this.editingId()!, payload);
      } else {
        await this.data.createService(payload);
      }
      this.router.navigate(['/admin/services']);
    } catch (e: any) {
      this.error.set(e.message ?? 'Save failed');
    } finally {
      this.saving.set(false);
    }
  }
}
