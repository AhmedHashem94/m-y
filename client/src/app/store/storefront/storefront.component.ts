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
  template: `
    <!-- Hero Section -->
    <section class="bg-gradient-to-b from-primary/10 to-background py-8 sm:py-12 px-4 text-center">
      <h1 class="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">{{ 'store.hero_title' | translate }}</h1>
      <p class="text-muted-foreground text-sm sm:text-base md:text-lg mb-6 sm:mb-8">{{ 'store.hero_subtitle' | translate }}</p>
      <div class="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        <button hlmBtn
          [variant]="genderFilter() === 'BOY' ? 'default' : 'outline'"
          (click)="setGender('BOY')">
          {{ 'store.boys_collection' | translate }}
        </button>
        <button hlmBtn
          [variant]="genderFilter() === 'GIRL' ? 'default' : 'outline'"
          (click)="setGender('GIRL')">
          {{ 'store.girls_collection' | translate }}
        </button>
        @if (genderFilter()) {
          <button hlmBtn variant="ghost" (click)="setGender(null)">
            {{ 'store.all_products' | translate }}
          </button>
        }
      </div>
    </section>

    <!-- Filter Bar -->
    <section class="container mx-auto px-4 py-6">
      <div class="flex flex-row flex-wrap items-center gap-3 mb-6">
        <!-- Category Filter -->
        <brn-select hlm [value]="categoryFilter()" (valueChange)="setCategoryFilter($event)" [placeholder]="'store.all_categories' | translate">
          <hlm-select-trigger class="w-40 sm:w-45">
            <hlm-select-value />
          </hlm-select-trigger>
          <hlm-select-content hlmSelectContent>
            <hlm-option value="">{{ 'store.all_categories' | translate }}</hlm-option>
            @for (cat of categories(); track cat) {
              <hlm-option [value]="cat">{{ 'categories.' + cat | translate }}</hlm-option>
            }
          </hlm-select-content>
        </brn-select>

        <!-- Brand Filter (commented out for now)
        <brn-select hlm [value]="companyFilter()" (valueChange)="setCompanyFilter($event)" [placeholder]="'store.all_brands' | translate">
          <hlm-select-trigger class="w-40 sm:w-45">
            <hlm-select-value />
          </hlm-select-trigger>
          <hlm-select-content hlmSelectContent>
            <hlm-option value="">{{ 'store.all_brands' | translate }}</hlm-option>
            @for (company of companies(); track company.id) {
              <hlm-option [value]="company.id">{{ isAr() ? company.nameAr : company.name }}</hlm-option>
            }
          </hlm-select-content>
        </brn-select>
        -->

        <!-- Results count -->
        <span class="text-sm text-muted-foreground sm:ms-auto text-center sm:text-end">
          {{ filteredProducts().length }} {{ 'store.items_count' | translate }}
        </span>
      </div>

      <!-- Product Grid -->
      @if (loading()) {
        <div class="flex items-center justify-center py-20">
          <p class="text-muted-foreground">{{ 'common.loading' | translate }}</p>
        </div>
      } @else if (filteredProducts().length === 0) {
        <div class="flex flex-col items-center justify-center py-20 gap-2">
          <p class="text-lg font-medium text-muted-foreground">{{ 'store.no_products' | translate }}</p>
          <p class="text-sm text-muted-foreground">{{ 'store.try_different_filter' | translate }}</p>
        </div>
      } @else {
        <div class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          @for (product of filteredProducts(); track product.id) {
            <a [routerLink]="['/store/product', product.id]" class="group block">
              <section hlmCard class="overflow-hidden transition-shadow hover:shadow-lg">
                <!-- Product Image -->
                <div class="relative aspect-[3/4] overflow-hidden bg-muted">
                  @if (product.images?.length) {
                    <img
                      [src]="product.images[0]"
                      [alt]="isAr() ? product.nameAr : product.name"
                      class="h-full w-full object-cover transition-transform group-hover:scale-105"
                      [class.grayscale]="isOutOfStock(product)"
                      [class.opacity-60]="isOutOfStock(product)"
                      loading="lazy"
                    />
                  } @else {
                    <div class="flex h-full w-full items-center justify-center bg-muted/50 p-6">
                      <img src="icons/logo-wide.svg" alt="M&Y Store" class="w-3/4 max-w-45 opacity-40" />
                    </div>
                  }
                  <!-- Out of stock overlay -->
                  @if (isOutOfStock(product)) {
                    <div class="absolute inset-0 flex items-center justify-center bg-black/30">
                      <span class="rounded-full bg-background/90 px-3 py-1 text-xs font-bold text-destructive">
                        {{ 'store.out_of_stock' | translate }}
                      </span>
                    </div>
                  }
                  <!-- Gender badge -->
                  <span class="absolute top-2 start-2 rounded-full px-2 py-0.5 text-xs font-medium"
                    [class]="product.gender === 'BOY'
                      ? 'bg-boy/40 text-boy-dark'
                      : 'bg-girl/30 text-girl-accent'">
                    {{ 'gender.' + product.gender | translate }}
                  </span>
                  <!-- Discount badge -->
                  @if (!isOutOfStock(product) && getDiscountPercent(product); as discount) {
                    <span class="absolute top-2 inset-e-2 rounded-full bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground">
                      {{ discount }}% {{ 'store.off' | translate }}
                    </span>
                  }
                </div>
                <div hlmCardContent class="p-3">
                  <!-- Brand (commented out for now)
                  @if (product.company) {
                    <p class="text-xs text-muted-foreground mb-1">
                      {{ isAr() ? product.company.nameAr : product.company.name }}
                    </p>
                  }
                  -->
                  <!-- Name -->
                  <h3 class="font-semibold text-sm text-foreground line-clamp-2 mb-2">
                    {{ isAr() ? product.nameAr : product.name }}
                  </h3>
                  <!-- Price -->
                  @if (product.variants?.length) {
                    <div class="flex flex-wrap items-center gap-1.5">
                      <span class="text-sm font-bold text-primary">
                        {{ getMinPrice(product) }} {{ 'common.egp' | translate }}
                      </span>
                      @if (getCompareAtPrice(product); as compareAt) {
                        <span class="text-xs text-muted-foreground line-through">
                          {{ compareAt }} {{ 'common.egp' | translate }}
                        </span>
                      }
                    </div>
                  }
                </div>
              </section>
            </a>
          }
        </div>
      }
    </section>
  `,
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
