import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminDataService } from '../../services/admin-data.service';

const initialsFromName = (name: string): string =>
  name.replace(/^Dr\.?\s*/i, '')
      .split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');

@Component({
  selector: 'app-admin-consultants-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './consultants-form.html',
  styleUrl: '../admin-shared.scss'
})
export class AdminConsultantsForm implements OnInit {
  private fb     = inject(FormBuilder);
  private data   = inject(AdminDataService);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);

  editingId = signal<string | null>(null);
  saving    = signal(false);
  error     = signal<string | null>(null);

  colors = ['#0EA5E9', '#0284C7', '#14B8A6', '#38BDF8', '#0F766E', '#0C4A6E'];

  form: FormGroup = this.fb.group({
    name:           ['', [Validators.required, Validators.minLength(3)]],
    qualifications: ['', Validators.required],
    specialty:      ['', Validators.required],
    initials:       ['', [Validators.required, Validators.maxLength(3)]],
    color:          ['#0284C7', Validators.required]
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
        this.form.patchValue(c);
      } catch (e: any) {
        this.error.set(e.message ?? 'Failed to load consultant');
      }
    }
  }

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true); this.error.set(null);
    try {
      if (this.editingId()) {
        await this.data.updateConsultant(this.editingId()!, this.form.value);
      } else {
        await this.data.createConsultant(this.form.value);
      }
      this.router.navigate(['/admin/consultants']);
    } catch (e: any) {
      this.error.set(e.message ?? 'Save failed');
    } finally {
      this.saving.set(false);
    }
  }
}
