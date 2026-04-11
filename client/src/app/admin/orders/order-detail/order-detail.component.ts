import { Component, inject, signal, afterNextRender } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { BrnSelectImports } from '@spartan-ng/brain/select';
import { HlmTable, HlmTableContainer, HlmTHead, HlmTBody, HlmTr, HlmTh, HlmTd } from '@spartan-ng/helm/table';
import { TranslateModule } from '@ngx-translate/core';
import { IOrder, OrderStatus } from '@mamy/shared-models';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    HlmButton,
    ...HlmCardImports,
    ...HlmSelectImports,
    ...BrnSelectImports,
    HlmTable, HlmTableContainer, HlmTHead, HlmTBody, HlmTr, HlmTh, HlmTd,
    TranslateModule,
    DatePipe,
  ],
  templateUrl: './order-detail.component.html',
})
export class OrderDetailComponent {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);

  order = signal<IOrder | null>(null);
  loading = signal(true);
  selectedStatus = signal<OrderStatus>(OrderStatus.PENDING);
  updatingStatus = signal(false);
  statuses = Object.values(OrderStatus);

  constructor() {
    afterNextRender(() => {
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.http.get<IOrder>(`/api/orders/${id}`).subscribe({
          next: (data) => {
            this.order.set(data);
            this.selectedStatus.set(data.status);
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
      }
    });
  }

  updateStatus() {
    const o = this.order();
    if (!o) return;
    this.updatingStatus.set(true);
    this.http
      .patch<IOrder>(`/api/orders/${o.id}/status`, { status: this.selectedStatus() })
      .subscribe({
        next: (updated) => {
          this.order.set(updated);
          this.updatingStatus.set(false);
        },
        error: () => this.updatingStatus.set(false),
      });
  }

  getAttributeEntries(attrs: Record<string, string>): [string, string][] {
    return attrs ? Object.entries(attrs) : [];
  }
}
