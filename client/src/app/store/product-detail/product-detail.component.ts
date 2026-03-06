import { Component, inject, signal, computed, afterNextRender } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideShoppingCart, lucideMinus, lucidePlus, lucideChevronRight, lucideChevronLeft } from '@ng-icons/lucide';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { IProduct, IProductVariant, ProductGender } from '@mamy/shared-models';
import { ThemeService } from '../../services/theme.service';
import { CartService } from '../../services/cart.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [RouterLink, TranslateModule, NgIcon, HlmIcon, HlmButton, ...HlmCardImports],
  providers: [provideIcons({ lucideShoppingCart, lucideMinus, lucidePlus, lucideChevronRight, lucideChevronLeft })],
  template: `
    @if (loading()) {
      <div class="flex items-center justify-center py-20">
        <p class="text-muted-foreground">{{ 'common.loading' | translate }}</p>
      </div>
    } @else if (product()) {
      <div class="container mx-auto px-4 py-6 sm:py-8">
        <!-- Back link -->
        <a routerLink="/store" class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4 sm:mb-6">
          <ng-icon hlmIcon size="xs" name="lucideChevronRight" />
          {{ 'common.back' | translate }}
        </a>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <!-- Image Gallery -->
          <div class="flex flex-col gap-3">
            <!-- Main image -->
            <div class="relative aspect-square overflow-hidden rounded-lg bg-muted">
              @if (product()!.images?.length) {
                <img
                  [src]="product()!.images[activeImageIndex()]"
                  [alt]="isAr() ? product()!.nameAr : product()!.name"
                  class="h-full w-full object-cover"
                />
              } @else {
                <div class="flex h-full w-full items-center justify-center bg-muted/50 p-8">
                  <img src="icons/logo-wide.svg" alt="M&Y Store" class="w-3/4 max-w-60 opacity-40" />
                </div>
              }
            </div>
            <!-- Thumbnails -->
            @if (product()!.images?.length > 1) {
              <div class="flex gap-2 overflow-x-auto pb-2">
                @for (img of product()!.images; track img; let i = $index) {
                  <button
                    class="h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-md border-2 transition-colors"
                    [class]="i === activeImageIndex() ? 'border-primary' : 'border-border'"
                    (click)="activeImageIndex.set(i)">
                    <img [src]="img" [alt]="'Image ' + (i + 1)" class="h-full w-full object-cover" loading="lazy" />
                  </button>
                }
              </div>
            }
          </div>

          <!-- Product Info -->
          <div class="flex flex-col gap-5">
            <!-- Brand -->
            @if (product()!.company) {
              <p class="text-sm text-muted-foreground">
                {{ isAr() ? product()!.company!.nameAr : product()!.company!.name }}
              </p>
            }

            <!-- Name -->
            <h1 class="text-xl sm:text-2xl font-bold text-foreground">
              {{ isAr() ? product()!.nameAr : product()!.name }}
            </h1>

            <!-- Gender badge -->
            <span class="inline-block w-fit rounded-full px-3 py-1 text-xs font-medium"
              [class]="product()!.gender === 'BOY'
                ? 'bg-boy/40 text-boy-dark'
                : 'bg-girl/30 text-girl-accent'">
              {{ 'gender.' + product()!.gender | translate }}
            </span>

            <!-- Description -->
            @if (getDescription()) {
              <div>
                <h2 class="text-sm font-semibold text-foreground mb-1">{{ 'store.description' | translate }}</h2>
                <p class="text-sm text-muted-foreground leading-relaxed">{{ getDescription() }}</p>
              </div>
            }

            <!-- Variant Selector -->
            @if (product()!.variants?.length) {
              <div>
                <h2 class="text-sm font-semibold text-foreground mb-3">{{ 'store.select_variant' | translate }}</h2>
                <div class="flex flex-wrap gap-2">
                  @for (variant of product()!.variants; track variant.id) {
                    <button
                      class="rounded-md border px-3 py-2 text-sm transition-colors"
                      [class]="variant.id === selectedVariant()?.id
                        ? 'border-primary bg-primary text-primary-foreground font-medium'
                        : 'border-border text-foreground hover:border-primary/50'"
                      [disabled]="!variant.isActive || variant.stock <= 0"
                      (click)="selectVariant(variant)">
                      {{ formatVariantLabel(variant) }}
                    </button>
                  }
                </div>
              </div>
            }

            <!-- Selected variant details -->
            @if (selectedVariant()) {
              <section hlmCard class="p-4">
                <div class="flex flex-col gap-3">
                  <!-- Price -->
                  <div class="flex items-center gap-3">
                    <span class="text-2xl font-bold text-primary">
                      {{ selectedVariant()!.price }} {{ 'common.egp' | translate }}
                    </span>
                    @if (selectedVariant()!.compareAtPrice && selectedVariant()!.compareAtPrice! > selectedVariant()!.price) {
                      <span class="text-sm text-muted-foreground line-through">
                        {{ selectedVariant()!.compareAtPrice }} {{ 'common.egp' | translate }}
                      </span>
                    }
                  </div>

                  <!-- Stock -->
                  <div class="flex items-center gap-2 text-sm">
                    @if (selectedVariant()!.stock > 0) {
                      <span class="inline-block h-2 w-2 rounded-full bg-green-500"></span>
                      <span class="text-muted-foreground">{{ 'store.in_stock' | translate }} ({{ selectedVariant()!.stock }})</span>
                    } @else {
                      <span class="inline-block h-2 w-2 rounded-full bg-destructive"></span>
                      <span class="text-destructive">{{ 'store.out_of_stock' | translate }}</span>
                    }
                  </div>

                  <!-- SKU -->
                  <p class="text-xs text-muted-foreground">
                    {{ 'store.sku' | translate }}: {{ selectedVariant()!.sku }}
                  </p>
                </div>
              </section>

              <!-- Quantity + Add to cart -->
              <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <div class="flex items-center justify-center gap-2 rounded-md border border-border">
                  <button hlmBtn variant="ghost" size="icon"
                    (click)="decrementQty()"
                    [disabled]="quantity() <= 1">
                    <ng-icon hlmIcon size="xs" name="lucideMinus" />
                  </button>
                  <span class="w-8 text-center text-sm font-medium">{{ quantity() }}</span>
                  <button hlmBtn variant="ghost" size="icon"
                    (click)="incrementQty()"
                    [disabled]="quantity() >= selectedVariant()!.stock">
                    <ng-icon hlmIcon size="xs" name="lucidePlus" />
                  </button>
                </div>

                <button hlmBtn class="flex-1"
                  [disabled]="selectedVariant()!.stock <= 0 || addedToCart()"
                  (click)="addToCart()">
                  @if (addedToCart()) {
                    {{ 'store.added_to_cart' | translate }}
                  } @else {
                    <ng-icon hlmIcon size="sm" name="lucideShoppingCart" class="me-2" />
                    {{ 'store.add_to_cart' | translate }}
                  }
                </button>
              </div>
            }
          </div>
        </div>
      </div>
    }
  `,
})
export class ProductDetailComponent {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly themeService = inject(ThemeService);
  private readonly cartService = inject(CartService);
  private readonly langService = inject(LanguageService);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly translate = inject(TranslateService);

  readonly product = signal<IProduct | null>(null);
  readonly loading = signal(true);
  readonly activeImageIndex = signal(0);
  readonly selectedVariant = signal<IProductVariant | null>(null);
  readonly quantity = signal(1);
  readonly addedToCart = signal(false);

  readonly isAr = computed(() => this.langService.currentLang() === 'ar');

  constructor() {
    afterNextRender(() => {
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.loadProduct(id);
      }
    });
  }

  selectVariant(variant: IProductVariant) {
    this.selectedVariant.set(variant);
    this.quantity.set(1);
    this.addedToCart.set(false);
    // Switch to variant image if available
    if (variant.image && this.product()?.images) {
      const idx = this.product()!.images.indexOf(variant.image);
      if (idx >= 0) this.activeImageIndex.set(idx);
    }
  }

  formatVariantLabel(variant: IProductVariant): string {
    const attrs = variant.attributes;
    if (!attrs || Object.keys(attrs).length === 0) return variant.sku;
    return Object.values(attrs).join(' / ');
  }

  getDescription(): string {
    const p = this.product();
    if (!p) return '';
    return this.isAr() ? p.descriptionAr : p.description;
  }

  incrementQty() {
    const max = this.selectedVariant()?.stock ?? 1;
    if (this.quantity() < max) {
      this.quantity.set(this.quantity() + 1);
    }
  }

  decrementQty() {
    if (this.quantity() > 1) {
      this.quantity.set(this.quantity() - 1);
    }
  }

  addToCart() {
    const variant = this.selectedVariant();
    const product = this.product();
    if (!variant || !product) return;

    this.cartService.addItem({
      variantId: variant.id,
      productId: product.id,
      name: product.name,
      nameAr: product.nameAr,
      sku: variant.sku,
      price: variant.price,
      quantity: this.quantity(),
      image: variant.image || product.images?.[0] || '',
      attributes: variant.attributes,
    });

    this.addedToCart.set(true);
    setTimeout(() => this.addedToCart.set(false), 2000);
  }

  private loadProduct(id: string) {
    this.loading.set(true);
    this.http.get<IProduct>(`/api/products/${id}`).subscribe({
      next: (product) => {
        this.product.set(product);
        this.loading.set(false);

        // Set theme from gender
        this.themeService.setFromGender(product.gender);

        // Auto-select first active variant
        const firstActive = product.variants?.find((v) => v.isActive && v.stock > 0);
        if (firstActive) {
          this.selectedVariant.set(firstActive);
        } else if (product.variants?.length) {
          this.selectedVariant.set(product.variants[0]);
        }

        // SEO
        const name = this.isAr() ? product.nameAr : product.name;
        this.title.setTitle(`${name} - MAMY Store`);
        this.meta.updateTag({ name: 'description', content: this.isAr() ? product.descriptionAr : product.description });
        if (product.images?.[0]) {
          this.meta.updateTag({ property: 'og:image', content: product.images[0] });
        }
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
