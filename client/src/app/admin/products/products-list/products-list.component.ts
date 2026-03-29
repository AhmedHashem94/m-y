import { Component, inject, signal, afterNextRender } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmTable, HlmTableContainer, HlmTHead, HlmTBody, HlmTr, HlmTh, HlmTd } from '@spartan-ng/helm/table';
import { TranslateModule } from '@ngx-translate/core';
import { IProduct, ProductStatus } from '@mamy/shared-models';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [RouterLink, HlmButton, HlmTable, HlmTableContainer, HlmTHead, HlmTBody, HlmTr, HlmTh, HlmTd, TranslateModule],
  template: `
    <div class="flex items-center justify-between mb-4 sm:mb-6">
      <h1 class="text-xl sm:text-2xl font-bold">{{ 'admin.products' | translate }}</h1>
      <a routerLink="/admin/products/new" hlmBtn size="sm" class="sm:size-default">
        {{ 'admin.add_product' | translate }}
      </a>
    </div>

    @if (loading()) {
      <p class="text-muted-foreground">{{ 'common.loading' | translate }}</p>
    } @else if (products().length === 0) {
      <p class="text-muted-foreground">{{ 'admin.no_products' | translate }}</p>
    } @else {
      <!-- Mobile cards -->
      <div class="flex flex-col gap-3 lg:hidden">
        @for (product of products(); track product.id) {
          <div class="rounded-lg border bg-card p-4">
            <div class="flex items-start gap-3 mb-3">
              @if (product.images && product.images.length > 0) {
                <img [src]="product.images[0]" [alt]="product.nameAr" class="h-14 w-14 rounded object-cover shrink-0" />
              } @else {
                <div class="h-14 w-14 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs shrink-0">--</div>
              }
              <div class="min-w-0 flex-1">
                <p class="font-medium text-sm truncate">{{ product.nameAr }}</p>
                <div class="flex flex-wrap gap-1.5 mt-1.5">
                  <span class="rounded-full bg-muted px-2 py-0.5 text-xs">{{ 'categories.' + product.category | translate }}</span>
                  <span
                    class="rounded-full px-2 py-0.5 text-xs font-medium"
                    [class]="product.gender === 'BOY' ? 'bg-sky-100 text-sky-700' : 'bg-pink-100 text-pink-700'"
                  >
                    {{ 'gender.' + product.gender | translate }}
                  </span>
                  <span
                    class="rounded-full px-2 py-0.5 text-xs font-medium"
                    [class]="product.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'"
                  >
                    {{ 'product_status.' + product.status | translate }}
                  </span>
                </div>
                <div class="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                  <span>{{ product.variants?.length || 0 }} {{ 'admin.variant_count' | translate }}</span>
                  <span class="font-medium text-foreground">{{ getPriceRange(product) }} {{ 'common.egp' | translate }}</span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <a [routerLink]="['/admin/products', product.id]" hlmBtn variant="outline" size="sm" class="flex-1">
                {{ 'common.edit' | translate }}
              </a>
              <button hlmBtn variant="destructive" size="sm" class="flex-1" (click)="deleteProduct(product)">
                {{ 'common.delete' | translate }}
              </button>
            </div>
          </div>
        }
      </div>

      <!-- Desktop table -->
      <div hlmTableContainer class="hidden lg:block">
        <table hlmTable>
          <thead hlmTHead>
            <tr hlmTr>
              <th hlmTh></th>
              <th hlmTh>{{ 'admin.name_ar' | translate }}</th>
              <th hlmTh>{{ 'store.category' | translate }}</th>
              <th hlmTh>{{ 'store.gender' | translate }}</th>
              <th hlmTh>{{ 'admin.status' | translate }}</th>
              <th hlmTh>{{ 'admin.variant_count' | translate }}</th>
              <th hlmTh>{{ 'admin.price_range' | translate }}</th>
              <th hlmTh></th>
            </tr>
          </thead>
          <tbody hlmTBody>
            @for (product of products(); track product.id) {
              <tr hlmTr>
                <td hlmTd>
                  @if (product.images && product.images.length > 0) {
                    <img [src]="product.images[0]" [alt]="product.nameAr" class="h-12 w-12 rounded object-cover" />
                  } @else {
                    <div class="h-12 w-12 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs">--</div>
                  }
                </td>
                <td hlmTd class="font-medium">{{ product.nameAr }}</td>
                <td hlmTd>
                  <span class="rounded-full bg-muted px-2 py-1 text-xs">{{ 'categories.' + product.category | translate }}</span>
                </td>
                <td hlmTd>
                  <span
                    class="rounded-full px-2 py-1 text-xs font-medium"
                    [class]="product.gender === 'BOY' ? 'bg-sky-100 text-sky-700' : 'bg-pink-100 text-pink-700'"
                  >
                    {{ 'gender.' + product.gender | translate }}
                  </span>
                </td>
                <td hlmTd>
                  <span
                    class="rounded-full px-2 py-1 text-xs font-medium"
                    [class]="product.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'"
                  >
                    {{ 'product_status.' + product.status | translate }}
                  </span>
                </td>
                <td hlmTd>{{ product.variants?.length || 0 }}</td>
                <td hlmTd>{{ getPriceRange(product) }}</td>
                <td hlmTd>
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
    this.http.get<IProduct[]>('/api/products/admin').subscribe({
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
