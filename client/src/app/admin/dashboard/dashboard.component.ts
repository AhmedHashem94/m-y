import { Component, inject, signal, afterNextRender } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { TranslateModule } from '@ngx-translate/core';
import { IProduct, IOrder } from '@mamy/shared-models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [...HlmCardImports, TranslateModule, RouterLink],
  template: `
    <h1 class="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">{{ 'admin.dashboard' | translate }}</h1>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
      <!-- Total Products -->
      <a routerLink="/admin/products" class="block">
        <section hlmCard class="cursor-pointer transition-shadow hover:shadow-md">
          <div hlmCardHeader>
            <h3 hlmCardTitle>{{ 'admin.total_products' | translate }}</h3>
          </div>
          <div hlmCardContent>
            <p class="text-3xl sm:text-4xl font-bold text-primary">{{ totalProducts() }}</p>
          </div>
        </section>
      </a>

      <!-- Total Orders -->
      <a routerLink="/admin/orders" class="block">
        <section hlmCard class="cursor-pointer transition-shadow hover:shadow-md">
          <div hlmCardHeader>
            <h3 hlmCardTitle>{{ 'admin.total_orders' | translate }}</h3>
          </div>
          <div hlmCardContent>
            <p class="text-3xl sm:text-4xl font-bold text-primary">{{ totalOrders() }}</p>
          </div>
        </section>
      </a>

      <!-- Total Revenue -->
      <a routerLink="/admin/orders" class="block">
        <section hlmCard class="cursor-pointer transition-shadow hover:shadow-md">
          <div hlmCardHeader>
            <h3 hlmCardTitle>{{ 'admin.total_revenue' | translate }}</h3>
          </div>
          <div hlmCardContent>
            <p class="text-3xl sm:text-4xl font-bold text-primary">
              {{ totalRevenue().toLocaleString() }}
              <span class="text-base sm:text-lg text-muted-foreground">{{ 'common.egp' | translate }}</span>
            </p>
          </div>
        </section>
      </a>
    </div>
  `,
})
export class DashboardComponent {
  private readonly http = inject(HttpClient);

  totalProducts = signal(0);
  totalOrders = signal(0);
  totalRevenue = signal(0);

  constructor() {
    afterNextRender(() => {
      this.http.get<IProduct[]>('/api/products').subscribe({
        next: (products) => this.totalProducts.set(products.length),
        error: () => this.totalProducts.set(0),
      });

      this.http.get<IOrder[]>('/api/orders').subscribe({
        next: (orders) => {
          this.totalOrders.set(orders.length);
          const revenue = orders.reduce((sum, o) => sum + o.total, 0);
          this.totalRevenue.set(revenue);
        },
        error: () => {
          this.totalOrders.set(0);
          this.totalRevenue.set(0);
        },
      });
    });
  }
}
