import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminAuthService } from '../../services/admin-auth.service';

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

    const target = this.route.snapshot.queryParamMap.get('from') ?? '/admin';
    this.router.navigateByUrl(target);
  }
}
