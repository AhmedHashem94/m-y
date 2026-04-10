import { Component, inject, signal, computed, afterNextRender } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { TranslateModule } from '@ngx-translate/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideShoppingCart, lucideMinus, lucidePlus, lucideChevronRight, lucideChevronLeft, lucideChevronDown, lucideX, lucideZoomIn, lucideMaximize } from '@ng-icons/lucide';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmAccordionImports } from '@spartan-ng/helm/accordion';
import { BrnAccordionImports } from '@spartan-ng/brain/accordion';
import { IProduct, IProductVariant } from '@mamy/shared-models';
import { ThemeService } from '../../services/theme.service';
import { CartService } from '../../services/cart.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [RouterLink, TranslateModule, NgIcon, HlmIcon, HlmButton, ...HlmCardImports, ...HlmAccordionImports, ...BrnAccordionImports],
  providers: [provideIcons({ lucideShoppingCart, lucideMinus, lucidePlus, lucideChevronRight, lucideChevronLeft, lucideChevronDown, lucideX, lucideZoomIn, lucideMaximize })],
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
            <div class="relative aspect-square overflow-hidden rounded-lg bg-muted cursor-zoom-in group"
              tabindex="0"
              role="button"
              (click)="openLightbox(activeImageIndex())"
              (keydown.enter)="openLightbox(activeImageIndex())"
              (keydown.space)="openLightbox(activeImageIndex()); $event.preventDefault()">
              @if (galleryImages().length) {
                <img
                  [src]="galleryImages()[activeImageIndex()]"
                  [alt]="isAr() ? product()!.nameAr : product()!.name"
                  class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <!-- Fullscreen hint -->
                <div class="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-black/40 py-2 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                  <ng-icon hlmIcon size="xs" name="lucideMaximize" />
                  {{ 'store.tap_to_zoom' | translate }}
                </div>
              } @else {
                <div class="flex h-full w-full items-center justify-center bg-muted/50 p-8">
                  <img src="icons/logo-wide.svg" alt="M&Y Store" class="w-3/4 max-w-60 opacity-40" />
                </div>
              }
            </div>
            <!-- Thumbnails -->
            @if (galleryImages().length > 1) {
              <div class="flex gap-2 overflow-x-auto pb-2">
                @for (img of galleryImages(); track img; let i = $index) {
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

            <!-- Description (collapsible accordion) -->
            @if (getDescription()) {
              <div hlmAccordion type="single">
                <div hlmAccordionItem [isOpened]="true">
                  <h3>
                    <button hlmAccordionTrigger class="no-underline! hover:no-underline!">
                      {{ 'store.description' | translate }}
                      <ng-icon hlmAccIcon name="lucideChevronDown" />
                    </button>
                  </h3>
                  <hlm-accordion-content>
                    <p class="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{{ getDescription() }}</p>
                  </hlm-accordion-content>
                </div>
              </div>
            }

            <!-- Variant Selector -->
            @if (product()!.variants?.length) {
              <div>
                <h2 class="text-sm font-semibold text-foreground mb-3">{{ 'store.select_variant' | translate }}</h2>
                <div class="flex flex-wrap gap-2">
                  @for (variant of product()!.variants; track variant.id) {
                    @if (!variant.attributes?.['size'] && getVariantColor(variant); as color) {
                      <!-- Color swatch variant (color-only, no size) -->
                      <button
                        class="relative h-10 w-10 rounded-full border-2 transition-all"
                        [class]="variant.id === selectedVariant()?.id
                          ? 'border-primary ring-2 ring-primary/30 scale-110'
                          : 'border-border hover:border-primary/50'"
                        [style.background-color]="color"
                        [disabled]="!variant.isActive || variant.stock <= 0"
                        [title]="formatVariantLabel(variant)"
                        (click)="selectVariant(variant)">
                        @if (!variant.isActive || variant.stock <= 0) {
                          <span class="absolute inset-0 flex items-center justify-center">
                            <span class="block h-0.5 w-full rotate-45 bg-muted-foreground/60 rounded-full"></span>
                          </span>
                        }
                      </button>
                    } @else {
                      <!-- Text variant (color + size) -->
                      <button
                        class="rounded-md border px-3 py-2 text-sm transition-colors"
                        [class]="variant.id === selectedVariant()?.id
                          ? 'border-primary bg-primary text-primary-foreground font-medium'
                          : 'border-border text-foreground hover:border-primary/50'"
                        [class.line-through]="!variant.isActive || variant.stock <= 0"
                        [disabled]="!variant.isActive || variant.stock <= 0"
                        (click)="selectVariant(variant)">
                        {{ formatVariantLabel(variant) }}
                      </button>
                    }
                  }
                </div>
                <!-- Selected variant label -->
                @if (selectedVariant()) {
                  <p class="mt-2 text-xs text-muted-foreground">{{ formatVariantLabel(selectedVariant()!) }}</p>
                }
              </div>
            }

            <!-- Selected variant details -->
            @if (selectedVariant()) {
              <div class="flex flex-col gap-3">
                <!-- Price -->
                <div class="flex flex-wrap items-baseline gap-3">
                  <span class="text-3xl font-bold text-primary">
                    {{ selectedVariant()!.price }} {{ 'common.egp' | translate }}
                  </span>
                  @if (selectedVariant()!.compareAtPrice && selectedVariant()!.compareAtPrice! > selectedVariant()!.price) {
                    <span class="text-base text-muted-foreground line-through">
                      {{ selectedVariant()!.compareAtPrice }} {{ 'common.egp' | translate }}
                    </span>
                    <span class="rounded-full bg-destructive px-2.5 py-0.5 text-xs font-bold text-destructive-foreground">
                      {{ getVariantDiscountPercent() }}% {{ 'store.off' | translate }}
                    </span>
                  }
                </div>
                <!-- Save amount -->
                @if (selectedVariant()!.compareAtPrice && selectedVariant()!.compareAtPrice! > selectedVariant()!.price) {
                  <p class="text-sm text-green-600 font-medium">
                    {{ 'store.you_save' | translate }} {{ selectedVariant()!.compareAtPrice! - selectedVariant()!.price }} {{ 'common.egp' | translate }}
                  </p>
                }

                <!-- Stock -->
                <div class="flex items-center gap-2 text-sm">
                  @if (selectedVariant()!.stock > 0 && selectedVariant()!.stock <= 5) {
                    <span class="inline-block h-2 w-2 rounded-full bg-orange-500"></span>
                    <span class="text-orange-600 font-medium">{{ 'store.only_left' | translate: { count: selectedVariant()!.stock } }}</span>
                  } @else if (selectedVariant()!.stock > 0) {
                    <span class="inline-block h-2 w-2 rounded-full bg-green-500"></span>
                    <span class="text-muted-foreground">{{ 'store.in_stock' | translate }}</span>
                  } @else {
                    <span class="inline-block h-2 w-2 rounded-full bg-destructive"></span>
                    <span class="text-destructive">{{ 'store.out_of_stock' | translate }}</span>
                  }
                </div>
              </div>

              <!-- Add to cart / Quantity controls -->
              @if (cartQty() > 0) {
                <!-- Already in cart — show quantity controls -->
                <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                  <div class="flex items-center justify-center gap-2 rounded-md border border-primary">
                    <button hlmBtn variant="ghost" size="icon"
                      (click)="updateCartQty(cartQty() - 1)">
                      <ng-icon hlmIcon size="xs" name="lucideMinus" />
                    </button>
                    <span class="w-8 text-center text-sm font-bold text-primary">{{ cartQty() }}</span>
                    <button hlmBtn variant="ghost" size="icon"
                      (click)="updateCartQty(cartQty() + 1)"
                      [disabled]="cartQty() >= selectedVariant()!.stock">
                      <ng-icon hlmIcon size="xs" name="lucidePlus" />
                    </button>
                  </div>
                  <span class="text-sm text-muted-foreground">{{ 'store.in_cart' | translate }}</span>
                </div>
              } @else {
                <!-- Not in cart — show add button with quantity picker -->
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
                    [disabled]="selectedVariant()!.stock <= 0"
                    (click)="addToCart()">
                    <ng-icon hlmIcon size="sm" name="lucideShoppingCart" class="me-2" />
                    {{ 'store.add_to_cart' | translate }}
                  </button>
                </div>
              }
            }
          </div>
        </div>
      </div>

      <!-- Fullscreen Lightbox -->
      @if (lightboxOpen()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          tabindex="0"
          role="dialog"
          (click)="closeLightbox()"
          (keydown.escape)="closeLightbox()"
          (keydown.arrowRight)="lightboxNext($event)"
          (keydown.arrowLeft)="lightboxPrev($event)">
          <!-- Close button -->
          <button class="absolute top-4 inset-e-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
            (click)="closeLightbox()">
            <ng-icon hlmIcon size="sm" name="lucideX" />
          </button>

          <!-- Nav arrows -->
          @if (galleryImages().length > 1) {
            <button class="absolute inset-s-2 sm:inset-s-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
              (click)="lightboxPrev($event)">
              <ng-icon hlmIcon size="sm" name="lucideChevronRight" />
            </button>
            <button class="absolute inset-e-2 sm:inset-e-4 z-10 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
              (click)="lightboxNext($event)">
              <ng-icon hlmIcon size="sm" name="lucideChevronLeft" />
            </button>
          }

          <!-- Image -->
          <!-- eslint-disable-next-line @angular-eslint/template/click-events-have-key-events, @angular-eslint/template/interactive-supports-focus -->
          <div class="relative max-h-[90vh] max-w-[90vw] overflow-auto" (click)="$event.stopPropagation()">
            <img
              [src]="galleryImages()[lightboxIndex()]"
              [alt]="isAr() ? product()!.nameAr : product()!.name"
              class="max-h-[90vh] max-w-[90vw] object-contain transition-transform duration-200"
              [class.scale-150]="lightboxZoomed()"
              [class.cursor-zoom-in]="!lightboxZoomed()"
              [class.cursor-zoom-out]="lightboxZoomed()"
              tabindex="0"
              role="button"
              (click)="toggleZoom()"
              (keydown.enter)="toggleZoom()"
            />
          </div>

          <!-- Counter -->
          @if (galleryImages().length > 1) {
            <div class="absolute bottom-4 inset-s-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs text-white">
              {{ lightboxIndex() + 1 }} / {{ galleryImages().length }}
            </div>
          }
        </div>
      }
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
  // TranslateService available via TranslateModule in template

  readonly product = signal<IProduct | null>(null);
  readonly loading = signal(true);
  readonly activeImageIndex = signal(0);
  readonly selectedVariant = signal<IProductVariant | null>(null);
  readonly quantity = signal(1);

  // Lightbox state
  readonly lightboxOpen = signal(false);
  readonly lightboxIndex = signal(0);
  readonly lightboxZoomed = signal(false);

  readonly isAr = computed(() => this.langService.currentLang() === 'ar');

  /** Current quantity of selected variant in cart */
  readonly cartQty = computed(() => {
    const v = this.selectedVariant();
    if (!v) return 0;
    return this.cartService.getItemQuantity(v.id);
  });

  /** Combines product images + unique variant images into one gallery */
  readonly galleryImages = computed(() => {
    const p = this.product();
    if (!p) return [];
    const images = [...(p.images || [])];
    // Add variant images that aren't already in the product images
    for (const v of p.variants || []) {
      if (v.image && !images.includes(v.image)) {
        images.push(v.image);
      }
    }
    return images;
  });

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
    // Switch to variant image if available
    if (variant.image) {
      const idx = this.galleryImages().indexOf(variant.image);
      if (idx >= 0) this.activeImageIndex.set(idx);
    }
  }

  // Lightbox methods
  openLightbox(index: number) {
    this.lightboxIndex.set(index);
    this.lightboxZoomed.set(false);
    this.lightboxOpen.set(true);
  }

  closeLightbox() {
    this.lightboxOpen.set(false);
    this.lightboxZoomed.set(false);
  }

  lightboxNext(e: Event) {
    e.stopPropagation();
    this.lightboxZoomed.set(false);
    const len = this.galleryImages().length;
    this.lightboxIndex.set((this.lightboxIndex() + 1) % len);
  }

  lightboxPrev(e: Event) {
    e.stopPropagation();
    this.lightboxZoomed.set(false);
    const len = this.galleryImages().length;
    this.lightboxIndex.set((this.lightboxIndex() - 1 + len) % len);
  }

  toggleZoom() {
    this.lightboxZoomed.set(!this.lightboxZoomed());
  }

  formatVariantLabel(variant: IProductVariant): string {
    const attrs = variant.attributes;
    if (!attrs || Object.keys(attrs).length === 0) return variant.sku;
    const parts: string[] = [];
    if (attrs['color']) parts.push(attrs['color']);
    if (attrs['size']) parts.push(attrs['size']);
    if (parts.length === 0) return Object.values(attrs).join(' / ');
    return parts.join(' / ');
  }

  getVariantColor(variant: IProductVariant): string | null {
    const color = variant.attributes?.['color'] || variant.attributes?.['Color'] || variant.attributes?.['اللون'];
    if (!color || typeof color !== 'string') return null;
    // Check if it's a CSS color value (hex, rgb, named color)
    if (color.startsWith('#') || color.startsWith('rgb') || color.startsWith('hsl')) return color;
    // Map common color names to hex
    const colorMap: Record<string, string> = {
      red: '#EF4444', أحمر: '#EF4444',
      blue: '#3B82F6', أزرق: '#3B82F6',
      green: '#22C55E', أخضر: '#22C55E',
      yellow: '#EAB308', أصفر: '#EAB308',
      black: '#1F2937', أسود: '#1F2937',
      white: '#F9FAFB', أبيض: '#F9FAFB',
      pink: '#EC4899', وردي: '#EC4899',
      purple: '#A855F7', بنفسجي: '#A855F7',
      orange: '#F97316', برتقالي: '#F97316',
      brown: '#92400E', بني: '#92400E',
      gray: '#6B7280', grey: '#6B7280', رمادي: '#6B7280',
      navy: '#1E3A5F', كحلي: '#1E3A5F',
      beige: '#D4C5A9', بيج: '#D4C5A9',
      olive: '#808000', زيتي: '#808000',
      turquoise: '#40E0D0', تركواز: '#40E0D0',
      fuchsia: '#D946EF', فوشيا: '#D946EF',
      camel: '#C19A6B', جملي: '#C19A6B',
    };
    return colorMap[color.toLowerCase()] ?? null;
  }

  getVariantDiscountPercent(): number {
    const v = this.selectedVariant();
    if (!v?.compareAtPrice || v.compareAtPrice <= v.price) return 0;
    return Math.round(((v.compareAtPrice - v.price) / v.compareAtPrice) * 100);
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

    this.quantity.set(1);
  }

  updateCartQty(qty: number) {
    const variant = this.selectedVariant();
    if (!variant) return;
    this.cartService.updateQuantity(variant.id, qty);
  }

  private loadProduct(id: string) {
    this.loading.set(true);
    this.http.get<IProduct>(`/api/products/${id}`).subscribe({
      next: (product) => {
        this.loading.set(false);
        this.product.set(product);

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
