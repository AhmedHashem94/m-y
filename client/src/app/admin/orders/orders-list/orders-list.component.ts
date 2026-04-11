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
  templateUrl: './orders-list.component.html',
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
