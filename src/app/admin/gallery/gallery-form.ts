import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminDataService } from '../../services/admin-data.service';

@Component({
  selector: 'app-admin-gallery-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './gallery-form.html',
  styleUrl: '../admin-shared.scss'
})
export class AdminGalleryForm implements OnInit {
  private fb     = inject(FormBuilder);
  private data   = inject(AdminDataService);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);

  editingId = signal<string | null>(null);
  saving    = signal(false);
  error     = signal<string | null>(null);

  // Per-image upload state
  uploadingBefore = signal(false);
  uploadingAfter  = signal(false);
  beforePreview   = signal<string | null>(null);
  afterPreview    = signal<string | null>(null);

  // Treatment values must match the SmileSvgComponent's union type
  treatments = [
    { value: 'veneers',     label: 'Veneers',          icon: 'fa-gem' },
    { value: 'whitening',   label: 'Whitening',        icon: 'fa-sun' },
    { value: 'implants',    label: 'Implants',         icon: 'fa-tooth' },
    { value: 'braces',      label: 'Braces / Aligners', icon: 'fa-grip-lines' },
    { value: 'crowns',      label: 'Crowns',           icon: 'fa-crown' },
    { value: 'makeover',    label: 'Smile Makeover',   icon: 'fa-wand-magic-sparkles' }
  ];

  form: FormGroup = this.fb.group({
    category:    ['Veneers', Validators.required],
    title:       ['', [Validators.required, Validators.minLength(5)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    treatment:   ['veneers', Validators.required],
    icon:        ['fa-gem', Validators.required],
    beforeImage: [''],
    afterImage:  ['']
  });

  invalid(field: string) {
    const c = this.form.get(field);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  /** When admin picks a treatment, default the icon + category to a sensible match. */
  onTreatmentChange(value: string) {
    const t = this.treatments.find(t => t.value === value);
    if (!t) return;
    this.form.patchValue({ icon: t.icon }, { emitEvent: false });
    if (!this.form.get('category')?.dirty && !this.editingId()) {
      this.form.patchValue({ category: t.label.split(' ')[0] }, { emitEvent: false });
    }
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editingId.set(id);
      try {
        const c = await this.data.getGallery(id);
        this.form.patchValue({
          category: c.category, title: c.title, description: c.description,
          treatment: c.treatment, icon: c.icon,
          beforeImage: c.beforeImage ?? '',
          afterImage:  c.afterImage  ?? ''
        });
        this.beforePreview.set(c.beforeImage ?? null);
        this.afterPreview.set(c.afterImage ?? null);
      } catch (e: any) {
        this.error.set(e.message ?? 'Failed to load case');
      }
    }
  }

  async onFileChange(event: Event, slot: 'before' | 'after') {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      this.error.set('Image must be smaller than 5 MB.');
      return;
    }
    const setUploading = slot === 'before' ? this.uploadingBefore : this.uploadingAfter;
    const setPreview   = slot === 'before' ? this.beforePreview   : this.afterPreview;
    const formField    = slot === 'before' ? 'beforeImage'        : 'afterImage';

    setUploading.set(true);
    this.error.set(null);
    try {
      const url = await this.data.uploadImage('gallery', file);
      this.form.patchValue({ [formField]: url });
      setPreview.set(url);
    } catch (e: any) {
      this.error.set(e.message ?? 'Image upload failed');
    } finally {
      setUploading.set(false);
      input.value = '';
    }
  }

  /** Clear an uploaded image — falls back to SVG illustration on the public site. */
  clearImage(slot: 'before' | 'after') {
    const formField    = slot === 'before' ? 'beforeImage'      : 'afterImage';
    const setPreview   = slot === 'before' ? this.beforePreview : this.afterPreview;
    this.form.patchValue({ [formField]: '' });
    setPreview.set(null);
  }

  isUploading(): boolean { return this.uploadingBefore() || this.uploadingAfter(); }

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true); this.error.set(null);
    try {
      const v = this.form.value;
      const payload = {
        category: v.category, title: v.title, description: v.description,
        treatment: v.treatment, icon: v.icon,
        beforeImage: v.beforeImage || undefined,
        afterImage:  v.afterImage  || undefined
      };
      if (this.editingId()) {
        await this.data.updateGallery(this.editingId()!, payload);
      } else {
        await this.data.createGallery(payload);
      }
      this.router.navigate(['/adminauthlogin/gallery']);
    } catch (e: any) {
      this.error.set(e.message ?? 'Save failed');
    } finally {
      this.saving.set(false);
    }
  }
}
