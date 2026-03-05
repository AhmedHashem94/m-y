import { Component, inject, signal, afterNextRender, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { BrnSelectImports } from '@spartan-ng/brain/select';
import { HlmTable, HlmTableContainer, HlmTHead, HlmTBody, HlmTr, HlmTh, HlmTd } from '@spartan-ng/helm/table';
import { TranslateModule } from '@ngx-translate/core';
import { IOrder, OrderStatus } from '@mamy/shared-models';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-orders-list',
  standalone: true,
  imports: [RouterLink, FormsModule, HlmButton, ...HlmSelectImports, ...BrnSelectImports, HlmTable, HlmTableContainer, HlmTHead, HlmTBody, HlmTr, HlmTh, HlmTd, TranslateModule, DatePipe],
  template: `
    <div class="flex items-center justify-between mb-4 sm:mb-6">
      <h1 class="text-xl sm:text-2xl font-bold">{{ 'admin.orders' | translate }}</h1>
    </div>

    <!-- Filter -->
    <div class="mb-4">
      <brn-select hlm [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event)" [placeholder]="'admin.all_statuses' | translate">
        <hlm-select-trigger class="w-full sm:w-52">
          <hlm-select-value />
        </hlm-select-trigger>
        <hlm-select-content hlmSelectContent>
          <hlm-option value="">{{ 'admin.all_statuses' | translate }}</hlm-option>
          @for (s of statuses; track s) {
            <hlm-option [value]="s">{{ 'orders.status.' + s | translate }}</hlm-option>
          }
        </hlm-select-content>
      </brn-select>
    </div>

    @if (loading()) {
      <p class="text-muted-foreground">{{ 'common.loading' | translate }}</p>
    } @else if (filteredOrders().length === 0) {
      <p class="text-muted-foreground">{{ 'admin.no_orders' | translate }}</p>
    } @else {
      <!-- Mobile cards -->
      <div class="flex flex-col gap-3 lg:hidden">
        @for (order of filteredOrders(); track order.id) {
          <a [routerLink]="['/admin/orders', order.id]" class="block rounded-lg border bg-card p-4 hover:bg-accent/50 transition-colors">
            <div class="flex items-center justify-between mb-2">
              <span class="font-mono text-xs text-muted-foreground">#{{ order.id.substring(0, 8) }}</span>
              <span
                class="rounded-full px-2 py-0.5 text-xs font-medium"
                [class]="getStatusClass(order.status)"
              >
                {{ 'orders.status.' + order.status | translate }}
              </span>
            </div>
            <p class="font-medium text-sm mb-1">{{ order.customerDetails.name }}</p>
            <div class="flex items-center justify-between text-xs text-muted-foreground">
              <span>{{ order.items.length }} {{ 'admin.items_count' | translate }}</span>
              <span class="font-bold text-sm text-foreground">{{ order.total }} {{ 'common.egp' | translate }}</span>
            </div>
            <p class="text-xs text-muted-foreground mt-1">{{ order.createdAt | date:'short' }}</p>
          </a>
        }
      </div>

      <!-- Desktop table -->
      <div hlmTableContainer class="hidden lg:block">
        <table hlmTable>
          <thead hlmTHead>
            <tr hlmTr>
              <th hlmTh>{{ 'admin.order_id' | translate }}</th>
              <th hlmTh>{{ 'admin.customer_name' | translate }}</th>
              <th hlmTh>{{ 'admin.items_count' | translate }}</th>
              <th hlmTh>{{ 'admin.total' | translate }}</th>
              <th hlmTh>{{ 'admin.status' | translate }}</th>
              <th hlmTh>{{ 'admin.date' | translate }}</th>
              <th hlmTh></th>
            </tr>
          </thead>
          <tbody hlmTBody>
            @for (order of filteredOrders(); track order.id) {
              <tr hlmTr class="cursor-pointer">
                <td hlmTd class="font-mono text-sm">{{ order.id.substring(0, 8) }}</td>
                <td hlmTd>{{ order.customerDetails.name }}</td>
                <td hlmTd>{{ order.items.length }}</td>
                <td hlmTd>{{ order.total }} {{ 'common.egp' | translate }}</td>
                <td hlmTd>
                  <span
                    class="rounded-full px-2 py-1 text-xs font-medium"
                    [class]="getStatusClass(order.status)"
                  >
                    {{ 'orders.status.' + order.status | translate }}
                  </span>
                </td>
                <td hlmTd class="text-sm text-muted-foreground">{{ order.createdAt | date:'short' }}</td>
                <td hlmTd>
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
export class OrdersListComponent {
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

  constructor() {
    afterNextRender(() => {
      this.loadOrders();
    });
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
