import { Component, OnInit, inject, signal } from '@angular/core';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminDataService } from '../../services/admin-data.service';

const initialsFromName = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

@Component({
  selector: 'app-admin-team-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './team-form.html',
  styleUrl: '../admin-shared.scss',
})
export class AdminTeamForm implements OnInit {
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
    name: ['', [Validators.required, Validators.minLength(2)]],
    role: ['', Validators.required],
    initials: ['', [Validators.required, Validators.maxLength(3)]],
    color: ['#0EA5E9', Validators.required],
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
        const m = await this.data.getTeam(id);
        this.form.patchValue({
          name: m.name,
          role: m.role,
          initials: m.initials,
          color: m.color,
          image: m.image ?? '',
        });
        this.preview.set(m.image ?? null);
      } catch (e: any) {
        this.error.set(e.message ?? 'Failed to load member');
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
      const url = await this.data.uploadImage('team', file);
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
        role: v.role,
        initials: v.initials,
        color: v.color,
        image: v.image || undefined,
      };
      if (this.editingId()) {
        await this.data.updateTeam(this.editingId()!, payload);
      } else {
        await this.data.createTeam(payload);
      }
      this.router.navigate(['/adminauthlogin/team']);
    } catch (e: any) {
      this.error.set(e.message ?? 'Save failed');
    } finally {
      this.saving.set(false);
    }
  }
}
