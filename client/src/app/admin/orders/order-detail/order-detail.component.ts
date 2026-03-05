import { Component, inject, signal, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
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
    TranslateModule,
    DatePipe,
  ],
  template: `
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">{{ 'orders.detail' | translate }}</h1>
      <a routerLink="/admin/orders" hlmBtn variant="outline">
        {{ 'common.back' | translate }}
      </a>
    </div>

    @if (loading()) {
      <p class="text-muted-foreground">{{ 'common.loading' | translate }}</p>
    } @else if (order()) {
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- Customer Details -->
        <section hlmCard>
          <div hlmCardHeader>
            <h2 hlmCardTitle>{{ 'admin.customer_details' | translate }}</h2>
          </div>
          <div hlmCardContent class="space-y-3">
            <div class="flex justify-between">
              <span class="text-muted-foreground">{{ 'admin.customer_name' | translate }}</span>
              <span class="font-medium">{{ order()!.customerDetails.name }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">{{ 'admin.phone' | translate }}</span>
              <span class="font-medium" dir="ltr">{{ order()!.customerDetails.phone }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">{{ 'admin.address' | translate }}</span>
              <span class="font-medium">{{ order()!.customerDetails.address }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">{{ 'admin.city' | translate }}</span>
              <span class="font-medium">{{ order()!.customerDetails.city }}</span>
            </div>
          </div>
        </section>

        <!-- Order Status -->
        <section hlmCard>
          <div hlmCardHeader>
            <h2 hlmCardTitle>{{ 'admin.status' | translate }}</h2>
          </div>
          <div hlmCardContent class="space-y-4">
            <div class="flex justify-between">
              <span class="text-muted-foreground">{{ 'admin.order_id' | translate }}</span>
              <span class="font-mono text-sm">{{ order()!.id.substring(0, 8) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">{{ 'admin.date' | translate }}</span>
              <span>{{ order()!.createdAt | date:'short' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-muted-foreground">{{ 'admin.total' | translate }}</span>
              <span class="text-lg font-bold">{{ order()!.total }} {{ 'common.egp' | translate }}</span>
            </div>

            <div class="border-t pt-4">
              <label class="block text-sm font-medium mb-2">{{ 'admin.update_status' | translate }}</label>
              <div class="flex gap-3">
                <select
                  [ngModel]="selectedStatus()"
                  (ngModelChange)="selectedStatus.set($event)"
                  class="flex h-10 flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  @for (s of statuses; track s) {
                    <option [value]="s">{{ 'orders.status.' + s | translate }}</option>
                  }
                </select>
                <button
                  hlmBtn
                  size="sm"
                  [disabled]="updatingStatus()"
                  (click)="updateStatus()"
                >
                  {{ 'common.save' | translate }}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- Order Items -->
      <section hlmCard class="mt-6">
        <div hlmCardHeader>
          <h2 hlmCardTitle>{{ 'admin.order_items' | translate }}</h2>
        </div>
        <div hlmCardContent>
          <div class="overflow-x-auto">
            <table class="w-full border-collapse">
              <thead>
                <tr class="border-b text-start">
                  <th class="py-3 pe-4 text-start font-medium text-muted-foreground">{{ 'admin.name_ar' | translate }}</th>
                  <th class="py-3 pe-4 text-start font-medium text-muted-foreground">{{ 'admin.sku' | translate }}</th>
                  <th class="py-3 pe-4 text-start font-medium text-muted-foreground">{{ 'admin.attributes' | translate }}</th>
                  <th class="py-3 pe-4 text-start font-medium text-muted-foreground">{{ 'cart.quantity' | translate }}</th>
                  <th class="py-3 pe-4 text-start font-medium text-muted-foreground">{{ 'admin.price' | translate }}</th>
                  <th class="py-3 text-start font-medium text-muted-foreground">{{ 'admin.total' | translate }}</th>
                </tr>
              </thead>
              <tbody>
                @for (item of order()!.items; track item.variantId) {
                  <tr class="border-b">
                    <td class="py-3 pe-4 font-medium">{{ item.name }}</td>
                    <td class="py-3 pe-4 font-mono text-sm" dir="ltr">{{ item.sku }}</td>
                    <td class="py-3 pe-4 text-sm">
                      @for (entry of getAttributeEntries(item.attributes); track entry[0]) {
                        <span class="me-2 rounded bg-muted px-1.5 py-0.5 text-xs">{{ entry[0] }}: {{ entry[1] }}</span>
                      }
                    </td>
                    <td class="py-3 pe-4">{{ item.quantity }}</td>
                    <td class="py-3 pe-4">{{ item.unitPrice }} {{ 'common.egp' | translate }}</td>
                    <td class="py-3 font-medium">{{ item.unitPrice * item.quantity }} {{ 'common.egp' | translate }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </section>
    }
  `,
})
export class OrderDetailComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);

  order = signal<IOrder | null>(null);
  loading = signal(true);
  selectedStatus = signal<OrderStatus>(OrderStatus.PENDING);
  updatingStatus = signal(false);
  statuses = Object.values(OrderStatus);

  ngOnInit() {
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
