import { Component, inject, signal, afterNextRender } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmTable, HlmTableContainer, HlmTHead, HlmTBody, HlmTr, HlmTh, HlmTd } from '@spartan-ng/helm/table';
import { TranslateModule } from '@ngx-translate/core';
import { IProduct } from '@mamy/shared-models';

@Component({
  selector: 'app-products-list',
  standalone: true,
  imports: [RouterLink, HlmButton, HlmTable, HlmTableContainer, HlmTHead, HlmTBody, HlmTr, HlmTh, HlmTd, TranslateModule],
  templateUrl: './products-list.component.html',
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

  getTotalStock(product: IProduct): number {
    return (product.variants || []).reduce((sum, v) => sum + (v.stock || 0), 0);
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

  getProductThumb(product: IProduct): string {
    return product.images?.[0] || product.variants?.[0]?.images?.[0] || '';
  }

  deleteProduct(product: IProduct) {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    this.http.delete(`/api/products/${product.id}`).subscribe({
      next: () => this.loadProducts(),
    });
  }
}
