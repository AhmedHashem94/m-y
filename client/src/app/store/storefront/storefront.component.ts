import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { IProduct, ICompany, ProductGender, ProductCategory } from '@mamy/shared-models';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-storefront',
  standalone: true,
  imports: [RouterLink, TranslateModule, HlmButton, ...HlmCardImports],
  template: `
    <!-- Hero Section -->
    <section class="bg-gradient-to-b from-primary/10 to-background py-12 px-4 text-center">
      <h1 class="text-4xl font-bold text-foreground mb-2">{{ 'store.hero_title' | translate }}</h1>
      <p class="text-muted-foreground text-lg mb-8">{{ 'store.hero_subtitle' | translate }}</p>
      <div class="flex items-center justify-center gap-3">
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
      <div class="flex flex-wrap items-center gap-3 mb-6">
        <!-- Category Filter -->
        <select
          class="rounded-md border border-input bg-background px-3 py-2 text-sm"
          [value]="categoryFilter()"
          (change)="setCategoryFromEvent($event)">
          <option value="">{{ 'store.all_categories' | translate }}</option>
          @for (cat of categories; track cat) {
            <option [value]="cat">{{ 'categories.' + cat | translate }}</option>
          }
        </select>

        <!-- Brand Filter -->
        <select
          class="rounded-md border border-input bg-background px-3 py-2 text-sm"
          [value]="companyFilter()"
          (change)="setCompanyFromEvent($event)">
          <option value="">{{ 'store.all_brands' | translate }}</option>
          @for (company of companies(); track company.id) {
            <option [value]="company.id">{{ isAr() ? company.nameAr : company.name }}</option>
          }
        </select>

        <!-- Results count -->
        <span class="text-sm text-muted-foreground ms-auto">
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
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                      loading="lazy"
                    />
                  } @else {
                    <div class="flex h-full w-full items-center justify-center text-muted-foreground">
                      {{ 'app.name' | translate }}
                    </div>
                  }
                  <!-- Gender badge -->
                  <span class="absolute top-2 start-2 rounded-full px-2 py-0.5 text-xs font-medium"
                    [class]="product.gender === 'BOY'
                      ? 'bg-boy/20 text-boy-dark'
                      : 'bg-girl/20 text-girl-muted'">
                    {{ 'gender.' + product.gender | translate }}
                  </span>
                </div>
                <div hlmCardContent class="p-3">
                  <!-- Brand -->
                  @if (product.company) {
                    <p class="text-xs text-muted-foreground mb-1">
                      {{ isAr() ? product.company.nameAr : product.company.name }}
                    </p>
                  }
                  <!-- Name -->
                  <h3 class="font-semibold text-sm text-foreground line-clamp-2 mb-2">
                    {{ isAr() ? product.nameAr : product.name }}
                  </h3>
                  <!-- Price -->
                  @if (product.variants?.length) {
                    <p class="text-sm font-bold text-primary">
                      {{ getMinPrice(product) }} {{ 'common.egp' | translate }}
                    </p>
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
export class StorefrontComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly langService = inject(LanguageService);

  readonly products = signal<IProduct[]>([]);
  readonly companies = signal<ICompany[]>([]);
  readonly loading = signal(true);

  readonly genderFilter = signal<string | null>(null);
  readonly categoryFilter = signal<string>('');
  readonly companyFilter = signal<string>('');

  readonly categories = Object.values(ProductCategory);

  readonly isAr = computed(() => this.langService.currentLang() === 'ar');

  readonly filteredProducts = computed(() => {
    let result = this.products();
    const gender = this.genderFilter();
    const category = this.categoryFilter();
    const companyId = this.companyFilter();

    if (gender) {
      result = result.filter((p) => p.gender === gender);
    }
    if (category) {
      result = result.filter((p) => p.category === category);
    }
    if (companyId) {
      result = result.filter((p) => p.companyId === companyId);
    }
    return result;
  });

  ngOnInit() {
    // Read gender from query params
    this.route.queryParams.subscribe((params) => {
      if (params['gender'] === 'BOY' || params['gender'] === 'GIRL') {
        this.genderFilter.set(params['gender']);
      }
    });

    this.loadProducts();
    this.loadCompanies();
  }

  setGender(gender: string | null) {
    this.genderFilter.set(gender);
    this.router.navigate([], {
      queryParams: gender ? { gender } : {},
      queryParamsHandling: gender ? 'merge' : '',
    });
  }

  setCategoryFromEvent(event: Event) {
    this.categoryFilter.set((event.target as HTMLSelectElement).value);
  }

  setCompanyFromEvent(event: Event) {
    this.companyFilter.set((event.target as HTMLSelectElement).value);
  }

  getMinPrice(product: IProduct): number {
    if (!product.variants?.length) return 0;
    return Math.min(...product.variants.map((v) => v.price));
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

  private loadCompanies() {
    this.http.get<ICompany[]>('/api/companies').subscribe({
      next: (companies) => this.companies.set(companies),
    });
  }
}
