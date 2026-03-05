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
  template: `
    <div class="flex items-center justify-between mb-4 sm:mb-6">
      <h1 class="text-xl sm:text-2xl font-bold">{{ 'orders.detail' | translate }}</h1>
      <a routerLink="/admin/orders" hlmBtn variant="outline" size="sm" class="sm:size-default">
        {{ 'common.back' | translate }}
      </a>
    </div>

    @if (loading()) {
      <p class="text-muted-foreground">{{ 'common.loading' | translate }}</p>
    } @else if (order()) {
      <div class="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
        <!-- Customer Details -->
        <section hlmCard>
          <div hlmCardHeader>
            <h2 hlmCardTitle>{{ 'admin.customer_details' | translate }}</h2>
          </div>
          <div hlmCardContent class="space-y-3">
            <div class="flex flex-col sm:flex-row sm:justify-between gap-1">
              <span class="text-sm text-muted-foreground">{{ 'admin.customer_name' | translate }}</span>
              <span class="font-medium">{{ order()!.customerDetails.name }}</span>
            </div>
            <div class="flex flex-col sm:flex-row sm:justify-between gap-1">
              <span class="text-sm text-muted-foreground">{{ 'admin.phone' | translate }}</span>
              <span class="font-medium" dir="ltr">{{ order()!.customerDetails.phone }}</span>
            </div>
            <div class="flex flex-col sm:flex-row sm:justify-between gap-1">
              <span class="text-sm text-muted-foreground">{{ 'admin.address' | translate }}</span>
              <span class="font-medium">{{ order()!.customerDetails.address }}</span>
            </div>
            <div class="flex flex-col sm:flex-row sm:justify-between gap-1">
              <span class="text-sm text-muted-foreground">{{ 'admin.city' | translate }}</span>
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
              <span class="text-sm text-muted-foreground">{{ 'admin.order_id' | translate }}</span>
              <span class="font-mono text-sm">{{ order()!.id.substring(0, 8) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-muted-foreground">{{ 'admin.date' | translate }}</span>
              <span>{{ order()!.createdAt | date:'short' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-muted-foreground">{{ 'admin.total' | translate }}</span>
              <span class="text-lg font-bold">{{ order()!.total }} {{ 'common.egp' | translate }}</span>
            </div>

            <div class="border-t pt-4">
              <label class="block text-sm font-medium mb-2">{{ 'admin.update_status' | translate }}</label>
              <div class="flex flex-col sm:flex-row gap-3">
                <brn-select hlm class="flex-1" [ngModel]="selectedStatus()" (ngModelChange)="selectedStatus.set($event)">
                  <hlm-select-trigger>
                    <hlm-select-value />
                  </hlm-select-trigger>
                  <hlm-select-content hlmSelectContent>
                    @for (s of statuses; track s) {
                      <hlm-option [value]="s">{{ 'orders.status.' + s | translate }}</hlm-option>
                    }
                  </hlm-select-content>
                </brn-select>
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
      <section hlmCard class="mt-4 sm:mt-6">
        <div hlmCardHeader>
          <h2 hlmCardTitle>{{ 'admin.order_items' | translate }}</h2>
        </div>
        <div hlmCardContent>
          <!-- Mobile cards -->
          <div class="flex flex-col gap-3 md:hidden">
            @for (item of order()!.items; track item.variantId) {
              <div class="rounded-lg border p-3 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="font-medium text-sm">{{ item.name }}</span>
                  <span class="font-medium text-sm">{{ item.unitPrice * item.quantity }} {{ 'common.egp' | translate }}</span>
                </div>
                <div class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span class="font-mono" dir="ltr">{{ item.sku }}</span>
                  @for (entry of getAttributeEntries(item.attributes); track entry[0]) {
                    <span class="rounded bg-muted px-1.5 py-0.5">{{ entry[0] }}: {{ entry[1] }}</span>
                  }
                </div>
                <div class="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{{ 'cart.quantity' | translate }}: {{ item.quantity }}</span>
                  <span>{{ item.unitPrice }} {{ 'common.egp' | translate }} / {{ 'admin.price' | translate }}</span>
                </div>
              </div>
            }
          </div>

          <!-- Desktop table -->
          <div hlmTableContainer class="hidden md:block">
            <table hlmTable>
              <thead hlmTHead>
                <tr hlmTr>
                  <th hlmTh>{{ 'admin.name_ar' | translate }}</th>
                  <th hlmTh>{{ 'admin.sku' | translate }}</th>
                  <th hlmTh>{{ 'admin.attributes' | translate }}</th>
                  <th hlmTh>{{ 'cart.quantity' | translate }}</th>
                  <th hlmTh>{{ 'admin.price' | translate }}</th>
                  <th hlmTh>{{ 'admin.total' | translate }}</th>
                </tr>
              </thead>
              <tbody hlmTBody>
                @for (item of order()!.items; track item.variantId) {
                  <tr hlmTr>
                    <td hlmTd class="font-medium">{{ item.name }}</td>
                    <td hlmTd class="font-mono text-sm" dir="ltr">{{ item.sku }}</td>
                    <td hlmTd class="text-sm">
                      @for (entry of getAttributeEntries(item.attributes); track entry[0]) {
                        <span class="me-2 rounded bg-muted px-1.5 py-0.5 text-xs">{{ entry[0] }}: {{ entry[1] }}</span>
                      }
                    </td>
                    <td hlmTd>{{ item.quantity }}</td>
                    <td hlmTd>{{ item.unitPrice }} {{ 'common.egp' | translate }}</td>
                    <td hlmTd class="font-medium">{{ item.unitPrice * item.quantity }} {{ 'common.egp' | translate }}</td>
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
