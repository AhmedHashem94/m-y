import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HlmButton } from '@spartan-ng/helm/button';
import { TranslateModule } from '@ngx-translate/core';
import { IOrder, OrderStatus } from '@mamy/shared-models';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [RouterLink, FormsModule, HlmButton, TranslateModule, DatePipe],
  template: `
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">{{ 'admin.orders' | translate }}</h1>
    </div>

    <!-- Filter -->
    <div class="mb-4">
      <select
        [ngModel]="statusFilter()"
        (ngModelChange)="statusFilter.set($event)"
        class="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">{{ 'admin.all_statuses' | translate }}</option>
        @for (s of statuses; track s) {
          <option [value]="s">{{ 'orders.status.' + s | translate }}</option>
        }
      </select>
    </div>

    @if (loading()) {
      <p class="text-muted-foreground">{{ 'common.loading' | translate }}</p>
    } @else if (filteredOrders().length === 0) {
      <p class="text-muted-foreground">{{ 'admin.no_orders' | translate }}</p>
    } @else {
      <div class="overflow-x-auto">
        <table class="w-full border-collapse">
          <thead>
            <tr class="border-b text-start">
              <th class="py-3 pe-4 text-start font-medium text-muted-foreground">{{ 'admin.order_id' | translate }}</th>
              <th class="py-3 pe-4 text-start font-medium text-muted-foreground">{{ 'admin.customer_name' | translate }}</th>
              <th class="py-3 pe-4 text-start font-medium text-muted-foreground">{{ 'admin.items_count' | translate }}</th>
              <th class="py-3 pe-4 text-start font-medium text-muted-foreground">{{ 'admin.total' | translate }}</th>
              <th class="py-3 pe-4 text-start font-medium text-muted-foreground">{{ 'admin.status' | translate }}</th>
              <th class="py-3 pe-4 text-start font-medium text-muted-foreground">{{ 'admin.date' | translate }}</th>
              <th class="py-3 text-start font-medium text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody>
            @for (order of filteredOrders(); track order.id) {
              <tr class="border-b hover:bg-muted/50 cursor-pointer">
                <td class="py-3 pe-4 font-mono text-sm">{{ order.id.substring(0, 8) }}</td>
                <td class="py-3 pe-4">{{ order.customerDetails.name }}</td>
                <td class="py-3 pe-4">{{ order.items.length }}</td>
                <td class="py-3 pe-4">{{ order.total }} {{ 'common.egp' | translate }}</td>
                <td class="py-3 pe-4">
                  <span
                    class="rounded-full px-2 py-1 text-xs font-medium"
                    [class]="getStatusClass(order.status)"
                  >
                    {{ 'orders.status.' + order.status | translate }}
                  </span>
                </td>
                <td class="py-3 pe-4 text-sm text-muted-foreground">{{ order.createdAt | date:'short' }}</td>
                <td class="py-3">
                  <a [routerLink]="['/admin/orders', order.id]" hlmBtn variant="outline" size="sm">
                    {{ 'orders.detail' | translate }}
                  </a>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class OrdersListComponent implements OnInit {
  private readonly http = inject(HttpClient);

  orders = signal<IOrder[]>([]);
  loading = signal(true);
  statusFilter = signal('');
  statuses = Object.values(OrderStatus);

  filteredOrders = computed(() => {
    const filter = this.statusFilter();
    const all = this.orders();
    if (!filter) return all;
    return all.filter((o) => o.status === filter);
  });

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    this.loading.set(true);
    this.http.get<IOrder[]>('/api/orders').subscribe({
      next: (data) => {
        this.orders.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.orders.set([]);
        this.loading.set(false);
      },
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case OrderStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case OrderStatus.CONFIRMED:
        return 'bg-blue-100 text-blue-800';
      case OrderStatus.SHIPPED:
        return 'bg-purple-100 text-purple-800';
      case OrderStatus.DELIVERED:
        return 'bg-green-100 text-green-800';
      case OrderStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-muted text-muted-foreground';
    }
  }
}
