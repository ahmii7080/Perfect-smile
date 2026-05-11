import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminAuthService } from '../../services/admin-auth.service';
import { SeoService } from '../../services/seo.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class AdminLoginPage {
  private fb     = inject(FormBuilder);
  private auth   = inject(AdminAuthService);
  private router = inject(Router);
  private route  = inject(ActivatedRoute);
  private seo    = inject(SeoService);

  constructor() {
    // Keep the admin login out of search indexes — no SEO value, and we
    // don't want Google surfacing a clinic-staff login page to patients.
    this.seo.set({
      title:       'Admin Sign-in',
      description: 'Admin sign-in for clinic staff.',
      path:        '/adminauthlogin',
      noindex:     true
    });
  }

  submitting = signal(false);
  showPassword = signal(false);
  error = signal<string | null>(null);

  form: FormGroup = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  invalid(field: string) {
    const c = this.form.get(field);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  togglePassword() { this.showPassword.update(v => !v); }

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.error.set(null);
    this.submitting.set(true);
    const { email, password } = this.form.value;
    const result = await this.auth.signIn(email, password);
    this.submitting.set(false);

    if (!result.ok) {
      this.error.set(result.message);
      return;
    }

    // After successful login, send the admin to whatever protected page
    // they originally tried to visit (the `from` query param set by the
    // guard) — falling back to the services dashboard if they landed
    // straight on /adminauthlogin.
    const target = this.route.snapshot.queryParamMap.get('from') ?? '/adminauthlogin/services';
    this.router.navigateByUrl(target);
  }
}
