import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    HlmButton,
    ...HlmCardImports,
    HlmInput,
    HlmLabel,
  ],
  template: `
    <div class="flex min-h-screen items-center justify-center p-4">
      <section hlmCard class="w-full max-w-md">
        <div hlmCardHeader>
          <h1 hlmCardTitle class="text-center text-2xl">
            تسجيل الدخول
          </h1>
          <p hlmCardDescription class="text-center">
            أدخل بريدك الإلكتروني وكلمة المرور
          </p>
        </div>
        <div hlmCardContent>
          <form (ngSubmit)="onSubmit()" class="flex flex-col gap-4">
            <div class="flex flex-col gap-2">
              <label hlmLabel for="email">البريد الإلكتروني</label>
              <input
                hlmInput
                id="email"
                type="email"
                placeholder="email@example.com"
                [(ngModel)]="email"
                name="email"
                required
                dir="ltr"
              />
            </div>
            <div class="flex flex-col gap-2">
              <label hlmLabel for="password">كلمة المرور</label>
              <input
                hlmInput
                id="password"
                type="password"
                [(ngModel)]="password"
                name="password"
                required
                dir="ltr"
              />
            </div>
            @if (error()) {
              <p class="text-sm text-destructive">{{ error() }}</p>
            }
            <button hlmBtn type="submit" [disabled]="loading()">
              @if (loading()) {
                جارٍ التحميل...
              } @else {
                دخول
              }
            </button>
          </form>
        </div>
        <div hlmCardFooter class="justify-center">
          <p class="text-sm text-muted-foreground">
            ليس لديك حساب؟
            <a routerLink="/auth/register" class="text-primary underline">
              سجّل الآن
            </a>
          </p>
        </div>
      </section>
    </div>
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  onSubmit() {
    this.loading.set(true);
    this.error.set('');

    this.auth.login(this.email, this.password).subscribe({
      next: () => {
        this.router.navigate(['/admin']);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'فشل تسجيل الدخول');
      },
    });
  }
}
