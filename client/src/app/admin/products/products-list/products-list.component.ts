import { Component, inject, signal, afterNextRender } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';
import { TranslateModule } from '@ngx-translate/core';
import { IProduct } from '@mamy/shared-models';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [RouterLink, HlmButton, TranslateModule],
  template: `
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">{{ 'admin.products' | translate }}</h1>
      <a routerLink="/admin/products/new" hlmBtn>
        {{ 'admin.add_product' | translate }}
      </a>
    </div>

    @if (loading()) {
      <p class="text-muted-foreground">{{ 'common.loading' | translate }}</p>
    } @else if (products().length === 0) {
      <p class="text-muted-foreground">{{ 'admin.no_products' | translate }}</p>
    } @else {
      <div class="overflow-x-auto">
        <table class="w-full border-collapse">
          <thead>
            <tr class="border-b text-start">
              <th class="py-3 pe-4 text-start font-medium text-muted-foreground"></th>
              <th class="py-3 pe-4 text-start font-medium text-muted-foreground">{{ 'admin.name_ar' | translate }}</th>
              <th class="py-3 pe-4 text-start font-medium text-muted-foreground">{{ 'store.category' | translate }}</th>
              <th class="py-3 pe-4 text-start font-medium text-muted-foreground">{{ 'store.gender' | translate }}</th>
              <th class="py-3 pe-4 text-start font-medium text-muted-foreground">{{ 'admin.variant_count' | translate }}</th>
              <th class="py-3 pe-4 text-start font-medium text-muted-foreground">{{ 'admin.price_range' | translate }}</th>
              <th class="py-3 text-start font-medium text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody>
            @for (product of products(); track product.id) {
              <tr class="border-b hover:bg-muted/50">
                <td class="py-3 pe-4">
                  @if (product.images && product.images.length > 0) {
                    <img [src]="product.images[0]" [alt]="product.nameAr" class="h-12 w-12 rounded object-cover" />
                  } @else {
                    <div class="h-12 w-12 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs">--</div>
                  }
                </td>
                <td class="py-3 pe-4 font-medium">{{ product.nameAr }}</td>
                <td class="py-3 pe-4">
                  <span class="rounded-full bg-muted px-2 py-1 text-xs">{{ 'categories.' + product.category | translate }}</span>
                </td>
                <td class="py-3 pe-4">
                  <span
                    class="rounded-full px-2 py-1 text-xs font-medium"
                    [class]="product.gender === 'BOY' ? 'bg-sky-100 text-sky-700' : 'bg-pink-100 text-pink-700'"
                  >
                    {{ 'gender.' + product.gender | translate }}
                  </span>
                </td>
                <td class="py-3 pe-4">{{ product.variants?.length || 0 }}</td>
                <td class="py-3 pe-4">{{ getPriceRange(product) }}</td>
                <td class="py-3">
                  <div class="flex items-center gap-2">
                    <a [routerLink]="['/admin/products', product.id]" hlmBtn variant="outline" size="sm">
                      {{ 'common.edit' | translate }}
                    </a>
                    <button hlmBtn variant="destructive" size="sm" (click)="deleteProduct(product)">
                      {{ 'common.delete' | translate }}
                    </button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
  `,
})
export class ProductsListComponent {
  private readonly http = inject(HttpClient);

  products = signal<IProduct[]>([]);
  loading = signal(true);

  constructor() {
    afterNextRender(() => {
      this.loadProducts();
    });
  }

  loadProducts() {
    this.loading.set(true);
    this.http.get<IProduct[]>('/api/products').subscribe({
      next: (data) => {
        this.products.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.products.set([]);
        this.loading.set(false);
      },
    });
  }

  getPriceRange(product: IProduct): string {
    const variants = product.variants;
    if (!variants || variants.length === 0) return '--';
    const prices = variants.map((v) => v.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (min === max) return `${min}`;
    return `${min} - ${max}`;
  }

  deleteProduct(product: IProduct) {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    this.http.delete(`/api/products/${product.id}`).subscribe({
      next: () => this.loadProducts(),
    });
  }
}
