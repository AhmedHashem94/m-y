import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, HlmButton],
  template: `
    <div class="flex min-h-screen">
      <aside class="w-64 border-e bg-card p-4">
        <h2 class="mb-6 text-xl font-bold">لوحة التحكم</h2>
        <nav class="flex flex-col gap-2">
          <a
            routerLink="/admin/dashboard"
            routerLinkActive="bg-primary/10 text-primary"
            hlmBtn
            variant="ghost"
            class="justify-start"
          >
            الرئيسية
          </a>
          <a
            routerLink="/admin/products"
            routerLinkActive="bg-primary/10 text-primary"
            hlmBtn
            variant="ghost"
            class="justify-start"
          >
            المنتجات
          </a>
          <a
            routerLink="/admin/orders"
            routerLinkActive="bg-primary/10 text-primary"
            hlmBtn
            variant="ghost"
            class="justify-start"
          >
            الطلبات
          </a>
        </nav>
      </aside>
      <main class="flex-1 p-6">
        <router-outlet />
      </main>
    </div>
  `,
})
export class AdminLayoutComponent {}
