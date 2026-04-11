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
  templateUrl: './dashboard.component.html',
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
