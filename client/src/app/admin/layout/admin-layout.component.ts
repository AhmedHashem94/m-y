import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, HlmButton, TranslateModule],
  template: `
    <div class="flex min-h-screen">
      <aside class="w-64 border-e bg-card p-4 flex flex-col">
        <h2 class="mb-6 text-xl font-bold">{{ 'nav.admin' | translate }}</h2>
        <nav class="flex flex-col gap-2 flex-1">
          <a
            routerLink="/admin/dashboard"
            routerLinkActive="bg-primary/10 text-primary"
            hlmBtn
            variant="ghost"
            class="justify-start"
          >
            {{ 'admin.dashboard' | translate }}
          </a>
          <a
            routerLink="/admin/companies"
            routerLinkActive="bg-primary/10 text-primary"
            hlmBtn
            variant="ghost"
            class="justify-start"
          >
            {{ 'admin.companies' | translate }}
          </a>
          <a
            routerLink="/admin/products"
            routerLinkActive="bg-primary/10 text-primary"
            hlmBtn
            variant="ghost"
            class="justify-start"
          >
            {{ 'admin.products' | translate }}
          </a>
          <a
            routerLink="/admin/orders"
            routerLinkActive="bg-primary/10 text-primary"
            hlmBtn
            variant="ghost"
            class="justify-start"
          >
            {{ 'admin.orders' | translate }}
          </a>
        </nav>
        <div class="flex flex-col gap-2 border-t pt-4">
          <a
            routerLink="/store"
            hlmBtn
            variant="outline"
            class="justify-start"
          >
            {{ 'admin.back_to_store' | translate }}
          </a>
          <button
            hlmBtn
            variant="ghost"
            class="justify-start text-destructive hover:text-destructive"
            (click)="logout()"
          >
            {{ 'nav.logout' | translate }}
          </button>
        </div>
      </aside>
      <main class="flex-1 p-6">
        <router-outlet />
      </main>
    </div>
  `,
})
export class AdminLayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  logout() {
    this.auth.logout();
    this.router.navigate(['/auth/login']);
  }
}
