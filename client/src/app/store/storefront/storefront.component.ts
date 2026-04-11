import { Component, inject, signal, computed, afterNextRender } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { BrnSelectImports } from '@spartan-ng/brain/select';
import { IProduct /* , ICompany */ } from '@mamy/shared-models';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-storefront',
  standalone: true,
  imports: [RouterLink, TranslateModule, HlmButton, ...HlmCardImports, ...HlmSelectImports, ...BrnSelectImports],
  templateUrl: './storefront.component.html',
})
export class StorefrontComponent {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly langService = inject(LanguageService);

  readonly products = signal<IProduct[]>([]);
  // readonly companies = signal<ICompany[]>([]);
  readonly loading = signal(true);

  readonly genderFilter = signal<string | null>(null);
  readonly categoryFilter = signal<string>('');
  // readonly companyFilter = signal<string>('');

  readonly categories = computed(() =>
    [...new Set(this.products().map((p) => p.category))]
  );

  readonly isAr = computed(() => this.langService.currentLang() === 'ar');

  readonly filteredProducts = computed(() => {
    let result = this.products();
    const gender = this.genderFilter();
    const category = this.categoryFilter();
    // const companyId = this.companyFilter();

    if (gender) {
      result = result.filter((p) => p.gender === gender);
    }
    if (category) {
      result = result.filter((p) => p.category === category);
    }
    // if (companyId) {
    //   result = result.filter((p) => p.companyId === companyId);
    // }
    return result;
  });

  constructor() {
    afterNextRender(() => {
      // Read gender from query params
      this.route.queryParams.subscribe((params) => {
        if (params['gender'] === 'BOY' || params['gender'] === 'GIRL') {
          this.genderFilter.set(params['gender']);
        } else {
          this.genderFilter.set(null);
        }
      });

      this.loadProducts();
      // this.loadCompanies();
    });
  }

  setGender(gender: string | null) {
    this.genderFilter.set(gender);
    this.router.navigate([], {
      queryParams: gender ? { gender } : {},
      queryParamsHandling: gender ? 'merge' : '',
    });
  }

  setCategoryFilter(value: string | string[]) {
    this.categoryFilter.set(Array.isArray(value) ? value[0] ?? '' : value);
  }

  // setCompanyFilter(value: string | string[]) {
  //   this.companyFilter.set(Array.isArray(value) ? value[0] ?? '' : value);
  // }

  getMinPrice(product: IProduct): number {
    if (!product.variants?.length) return 0;
    return Math.min(...product.variants.map((v) => v.price));
  }

  getCompareAtPrice(product: IProduct): number | null {
    if (!product.variants?.length) return null;
    const minPriceVariant = product.variants.reduce((min, v) =>
      v.price < min.price ? v : min
    );
    if (minPriceVariant.compareAtPrice && minPriceVariant.compareAtPrice > minPriceVariant.price) {
      return minPriceVariant.compareAtPrice;
    }
    return null;
  }

  getDiscountPercent(product: IProduct): number | null {
    const compareAt = this.getCompareAtPrice(product);
    if (!compareAt) return null;
    const price = this.getMinPrice(product);
    return Math.round(((compareAt - price) / compareAt) * 100);
  }

  getProductImage(product: IProduct): string {
    return product.images?.[0] || product.variants?.[0]?.images?.[0] || '';
  }

  isOutOfStock(product: IProduct): boolean {
    if (!product.variants?.length) return true;
    return product.variants.every((v) => !v.isActive || v.stock <= 0);
  }

  private loadProducts() {
    this.loading.set(true);
    this.http.get<IProduct[]>('/api/products').subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  // private loadCompanies() {
  //   this.http.get<ICompany[]>('/api/companies').subscribe({
  //     next: (companies) => this.companies.set(companies),
  //   });
  // }
}
