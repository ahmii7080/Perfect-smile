import { Component, OnInit, inject, signal } from '@angular/core';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminDataService } from '../../services/admin-data.service';

const initialsFromName = (name: string): string =>
  name
    .replace(/^Dr\.?\s*/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

@Component({
  selector: 'app-admin-consultants-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './consultants-form.html',
  styleUrl: '../admin-shared.scss',
})
export class AdminConsultantsForm implements OnInit {
  private fb = inject(FormBuilder);
  private data = inject(AdminDataService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  editingId = signal<string | null>(null);
  saving = signal(false);
  uploading = signal(false);
  error = signal<string | null>(null);
  preview = signal<string | null>(null);

  colors = ['#0EA5E9', '#0284C7', '#14B8A6', '#38BDF8', '#0F766E', '#0C4A6E'];

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    qualifications: ['', Validators.required],
    specialty: ['', Validators.required],
    initials: ['', [Validators.required, Validators.maxLength(3)]],
    color: ['#0284C7', Validators.required],
    image: [''],
  });

  invalid(field: string) {
    const c = this.form.get(field);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  onNameChange(value: string) {
    if (!this.form.get('initials')?.dirty) {
      this.form.patchValue({ initials: initialsFromName(value) }, { emitEvent: false });
    }
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editingId.set(id);
      try {
        const c = await this.data.getConsultant(id);
        this.form.patchValue({
          name: c.name,
          qualifications: c.qualifications,
          specialty: c.specialty,
          initials: c.initials,
          color: c.color,
          image: c.image ?? '',
        });
        this.preview.set(c.image ?? null);
      } catch (e: any) {
        this.error.set(e.message ?? 'Failed to load consultant');
      }
    }
  }

  /**
   * Upload the chosen image to Supabase storage (consultants folder) and
   * stash the resulting public URL into the form. Same pattern as the
   * team form so admins get identical UX across both screens.
   */
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
      const url = await this.data.uploadImage('consultants', file);
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
        name: v.name,
        qualifications: v.qualifications,
        specialty: v.specialty,
        initials: v.initials,
        color: v.color,
        image: v.image || undefined,
      };
      if (this.editingId()) {
        await this.data.updateConsultant(this.editingId()!, payload);
      } else {
        await this.data.createConsultant(payload);
      }
      this.router.navigate(['/adminauthlogin/consultants']);
    } catch (e: any) {
      this.error.set(e.message ?? 'Save failed');
    } finally {
      this.saving.set(false);
    }
  }
}
