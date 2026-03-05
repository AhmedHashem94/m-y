import { Component, inject, signal, computed, afterNextRender } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideCircle, lucidePackage, lucideTruck, lucideHome } from '@ng-icons/lucide';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { IOrder, OrderStatus } from '@mamy/shared-models';

interface TimelineStep {
  status: OrderStatus;
  icon: string;
}

@Component({
  selector: 'app-tracking',
  standalone: true,
  imports: [RouterLink, TranslateModule, HlmButton, ...HlmCardImports, NgIcon, HlmIcon],
  providers: [provideIcons({ lucideCheck, lucideCircle, lucidePackage, lucideTruck, lucideHome })],
  template: `
    <div class="container mx-auto px-4 py-8">
      @if (loading()) {
        <div class="flex items-center justify-center py-20">
          <p class="text-muted-foreground">{{ 'common.loading' | translate }}</p>
        </div>
      } @else if (order()) {
        <div class="max-w-2xl mx-auto">
          <!-- Confirmation message -->
          <div class="text-center mb-8">
            <div class="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
              <ng-icon hlmIcon size="lg" name="lucideCheck" class="text-primary" />
            </div>
            <h1 class="text-2xl font-bold text-foreground mb-2">{{ 'orders.order_confirmed' | translate }}</h1>
            <p class="text-muted-foreground">{{ 'orders.track_description' | translate }}</p>
          </div>

          <!-- Order ID -->
          <section hlmCard class="mb-6">
            <div hlmCardContent class="p-6">
              <div class="flex items-center justify-between">
                <span class="text-sm text-muted-foreground">{{ 'orders.order_id' | translate }}</span>
                <span class="font-mono text-sm font-medium text-foreground">{{ order()!.id }}</span>
              </div>
            </div>
          </section>

          <!-- Status Timeline -->
          <section hlmCard class="mb-6">
            <div hlmCardHeader>
              <h2 hlmCardTitle>{{ 'orders.order_status' | translate }}</h2>
            </div>
            <div hlmCardContent>
              <div class="flex flex-col gap-0">
                @for (step of timelineSteps; track step.status; let i = $index; let last = $last) {
                  <div class="flex items-start gap-4">
                    <!-- Icon -->
                    <div class="flex flex-col items-center">
                      <div class="flex h-10 w-10 items-center justify-center rounded-full"
                        [class]="isStepCompleted(step.status)
                          ? 'bg-primary text-primary-foreground'
                          : isStepCurrent(step.status)
                            ? 'bg-primary/20 text-primary border-2 border-primary'
                            : 'bg-muted text-muted-foreground'">
                        @if (isStepCompleted(step.status)) {
                          <ng-icon hlmIcon size="sm" name="lucideCheck" />
                        } @else {
                          <ng-icon hlmIcon size="sm" [name]="step.icon" />
                        }
                      </div>
                      @if (!last) {
                        <div class="w-0.5 h-8"
                          [class]="isStepCompleted(step.status) ? 'bg-primary' : 'bg-border'">
                        </div>
                      }
                    </div>

                    <!-- Label -->
                    <div class="pt-2">
                      <p class="text-sm font-medium"
                        [class]="isStepCompleted(step.status) || isStepCurrent(step.status)
                          ? 'text-foreground'
                          : 'text-muted-foreground'">
                        {{ 'orders.status.' + step.status | translate }}
                      </p>
                    </div>
                  </div>
                }
              </div>
            </div>
          </section>

          <!-- Back to store -->
          <div class="text-center">
            <a routerLink="/store">
              <button hlmBtn variant="outline">{{ 'orders.back_to_store' | translate }}</button>
            </a>
          </div>
        </div>
      } @else {
        <div class="flex flex-col items-center justify-center py-20 gap-4">
          <p class="text-lg font-medium text-muted-foreground">{{ 'common.no_results' | translate }}</p>
          <a routerLink="/store">
            <button hlmBtn>{{ 'orders.back_to_store' | translate }}</button>
          </a>
        </div>
      }
    </div>
  `,
})
export class TrackingComponent {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);

  readonly order = signal<IOrder | null>(null);
  readonly loading = signal(true);

  readonly timelineSteps: TimelineStep[] = [
    { status: OrderStatus.PENDING, icon: 'lucideCircle' },
    { status: OrderStatus.CONFIRMED, icon: 'lucideCheck' },
    { status: OrderStatus.SHIPPED, icon: 'lucideTruck' },
    { status: OrderStatus.DELIVERED, icon: 'lucideHome' },
  ];

  private readonly statusOrder = [
    OrderStatus.PENDING,
    OrderStatus.CONFIRMED,
    OrderStatus.SHIPPED,
    OrderStatus.DELIVERED,
  ];

  constructor() {
    afterNextRender(() => {
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.loadOrder(id);
      }
    });
  }

  isStepCompleted(status: OrderStatus): boolean {
    const order = this.order();
    if (!order) return false;
    const currentIdx = this.statusOrder.indexOf(order.status);
    const stepIdx = this.statusOrder.indexOf(status);
    return stepIdx < currentIdx;
  }

  isStepCurrent(status: OrderStatus): boolean {
    return this.order()?.status === status;
  }

  private loadOrder(id: string) {
    this.loading.set(true);
    this.http.get<IOrder>(`/api/orders/${id}`).subscribe({
      next: (order) => {
        this.order.set(order);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
