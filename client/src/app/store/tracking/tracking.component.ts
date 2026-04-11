import { Component, inject, signal, afterNextRender } from '@angular/core';
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
  templateUrl: './tracking.component.html',
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
