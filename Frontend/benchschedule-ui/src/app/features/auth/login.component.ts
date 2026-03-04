import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  FormGroup,
  FormControl,
} from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../app/core/services/auth.services';

type LoginForm = FormGroup<{
  username: FormControl<string>;
  password: FormControl<string>;
}>;

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="login-wrapper">
      <div class="login-card">
        <h1>BenchSchedule</h1>
        <p class="subtitle">
          {{ mode === 'login' ? 'Sign in to continue' : 'Create your account' }}
        </p>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <input type="text" placeholder="Username" formControlName="username" />
          <input type="password" placeholder="Password" formControlName="password" />

          <button class="primary" type="submit" [disabled]="form.invalid || loading">
            {{ loading ? 'Please wait…' : (mode === 'login' ? 'Login' : 'Create account') }}
          </button>
        </form>

        <p class="msg" *ngIf="message">{{ message }}</p>

        <button class="secondary" type="button" (click)="toggleMode()" [disabled]="loading">
          {{ mode === 'login' ? 'Create account' : 'Back to login' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .login-wrapper { height: 100vh; display:flex; align-items:center; justify-content:center; background:#fff7ed; }
    .login-card { width:360px; padding:2.5rem; border-radius:12px; background:white; box-shadow:0 20px 40px rgba(0,0,0,0.08);
      display:flex; flex-direction:column; gap:1rem; text-align:center; }
    h1 { margin:0; color:#ea580c; font-weight:700; }
    .subtitle { margin-bottom:1rem; color:#6b7280; font-size:0.9rem; }
    form { display:flex; flex-direction:column; gap:1rem; }
    input { padding:0.75rem; border-radius:8px; border:1px solid #d1d5db; font-size:0.95rem; }
    input:focus { outline:none; border-color:#ea580c; box-shadow:0 0 0 2px rgba(234,88,12,0.15); }
    button { padding:0.75rem; border-radius:8px; font-size:0.95rem; cursor:pointer; border:none; }
    .primary { background:#ea580c; color:white; font-weight:600; }
    .primary:hover { background:#c2410c; }
    .primary:disabled { opacity:0.7; cursor:not-allowed; }
    .secondary { background:transparent; color:#ea580c; font-size:0.85rem; }
    .msg { margin:0; font-size:0.85rem; color:#374151; }
  `]
})
export class LoginComponent {
  mode: 'login' | 'register' = 'login';
  loading = false;
  message = '';

  form: LoginForm;

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      username: this.fb.nonNullable.control('', { validators: [Validators.required] }),
      password: this.fb.nonNullable.control('', { validators: [Validators.required] }),
    });
  }

  toggleMode() {
    this.message = '';
    this.mode = this.mode === 'login' ? 'register' : 'login';
  }

  submit() {
    this.message = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const username = this.form.controls.username.value ?? '';
    const password = this.form.controls.password.value ?? '';

    this.loading = true;

    if (this.mode === 'login') {
      const sub = this.auth.login(username, password).subscribe({
        next: () => {
          this.message = 'Login successful.';
          this.router.navigate(['/home']);
        },
        error: (err: HttpErrorResponse) => {
          const serverMsg =
            typeof err.error === 'string'
              ? err.error
              : (err.error as any)?.message;

          this.message = serverMsg || err.message || 'Something went wrong.';
        }
      });

      sub.add(() => {
        this.loading = false;
        this.cdr.detectChanges();
      });

      return;
    }

    // register mode
    const sub = this.auth.register(username, password).subscribe({
      next: (res) => {
        this.message = res?.message || 'Account created. You can log in now.';
        this.mode = 'login';
      },
      error: (err: HttpErrorResponse) => {
        const serverMsg =
          typeof err.error === 'string'
            ? err.error
            : (err.error as any)?.message;

        this.message = serverMsg || err.message || 'Something went wrong.';
      }
    });

    sub.add(() => {
      this.loading = false;
      this.cdr.detectChanges();
    });
  }
}