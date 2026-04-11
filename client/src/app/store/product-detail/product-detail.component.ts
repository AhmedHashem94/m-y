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
  templateUrl: './product-detail.component.html',
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

  readonly selectedColor = signal<string | null>(null);
  readonly selectedSize = signal<string | null>(null);

  /** Unique color names from all variants */
  readonly uniqueColors = computed(() => {
    const p = this.product();
    if (!p?.variants) return [] as string[];
    const seen = new Set<string>();
    const colors: string[] = [];
    for (const v of p.variants) {
      const c = v.attributes?.['color'] || '';
      if (c && !seen.has(c)) { seen.add(c); colors.push(c); }
    }
    return colors;
  });

  /** Unique sizes available for the selected color */
  readonly availableSizes = computed(() => {
    const p = this.product();
    const color = this.selectedColor();
    if (!p?.variants) return [] as string[];
    const seen = new Set<string>();
    const sizes: string[] = [];
    for (const v of p.variants) {
      const vc = v.attributes?.['color'] || '';
      const vs = v.attributes?.['size'] || '';
      if (vs && vc === color && !seen.has(vs)) { seen.add(vs); sizes.push(vs); }
    }
    return sizes;
  });

  /** Whether this product uses color+size variant structure */
  readonly hasColorSizeVariants = computed(() => {
    const p = this.product();
    if (!p?.variants?.length) return false;
    return p.variants.some(v => v.attributes?.['color']) && p.variants.some(v => v.attributes?.['size']);
  });

  /** Check if a specific size is in stock for the selected color */
  getSizeVariant(size: string): IProductVariant | null {
    const p = this.product();
    const color = this.selectedColor();
    if (!p?.variants) return null;
    return p.variants.find(v =>
      v.attributes?.['color'] === color && v.attributes?.['size'] === size
    ) || null;
  }

  /** Map of color name → images array (from first variant of each color) */
  readonly colorImageMap = computed(() => {
    const p = this.product();
    if (!p?.variants) return new Map<string, string[]>();
    const map = new Map<string, string[]>();
    for (const v of p.variants) {
      const color = v.attributes?.['color'] || '';
      if (!map.has(color) && v.images?.length) {
        map.set(color, v.images);
      }
    }
    return map;
  });

  /** Gallery: selected color's images first, then all others */
  readonly galleryImages = computed(() => {
    const p = this.product();
    if (!p) return [];
    const color = this.selectedColor();
    const colorMap = this.colorImageMap();

    if (color !== null && colorMap.has(color)) {
      const colorImages = colorMap.get(color) || [];
      const otherImages: string[] = [];
      for (const [c, imgs] of colorMap) {
        if (c !== color) {
          for (const img of imgs) {
            if (!otherImages.includes(img)) otherImages.push(img);
          }
        }
      }
      return [...colorImages, ...otherImages];
    }

    // No color selected: flat gallery of all variant images (deduped)
    const images: string[] = [];
    for (const v of p.variants || []) {
      for (const img of v.images || []) {
        if (!images.includes(img)) images.push(img);
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
    const color = variant.attributes?.['color'] || '';
    this.selectedColor.set(color);
    this.selectedSize.set(variant.attributes?.['size'] || null);
    this.activeImageIndex.set(0);
  }

  selectColor(color: string) {
    this.selectedColor.set(color);
    this.activeImageIndex.set(0);
    // Auto-select same size in new color, or first available
    const currentSize = this.selectedSize();
    const p = this.product();
    if (!p?.variants) return;
    const match = p.variants.find(v =>
      v.attributes?.['color'] === color && v.attributes?.['size'] === currentSize && v.isActive && v.stock > 0
    ) || p.variants.find(v =>
      v.attributes?.['color'] === color && v.isActive && v.stock > 0
    ) || p.variants.find(v =>
      v.attributes?.['color'] === color
    );
    if (match) {
      this.selectedVariant.set(match);
      this.selectedSize.set(match.attributes?.['size'] || null);
      this.quantity.set(1);
    }
  }

  selectSize(size: string) {
    this.selectedSize.set(size);
    const variant = this.getSizeVariant(size);
    if (variant) {
      this.selectedVariant.set(variant);
      this.quantity.set(1);
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

  private readonly colorMap: Record<string, string> = {
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

  getVariantColor(variant: IProductVariant): string | null {
    const color = variant.attributes?.['color'] || variant.attributes?.['Color'] || variant.attributes?.['اللون'];
    if (!color || typeof color !== 'string') return null;
    if (color.startsWith('#') || color.startsWith('rgb') || color.startsWith('hsl')) return color;
    return this.colorMap[color.toLowerCase()] ?? null;
  }

  /** Get hex color from a color name string */
  getVariantColorHex(colorName: string): string | null {
    if (!colorName) return null;
    if (colorName.startsWith('#') || colorName.startsWith('rgb') || colorName.startsWith('hsl')) return colorName;
    return this.colorMap[colorName.toLowerCase()] ?? null;
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
      image: variant.images?.[0] || product.images?.[0] || '',
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
        const autoSelected = firstActive || product.variants?.[0] || null;
        if (autoSelected) {
          this.selectedVariant.set(autoSelected);
          this.selectedColor.set(autoSelected.attributes?.['color'] || '');
          this.selectedSize.set(autoSelected.attributes?.['size'] || null);
        }

        // SEO
        const name = this.isAr() ? product.nameAr : product.name;
        this.title.setTitle(`${name} - M&Y`);
        this.meta.updateTag({ name: 'description', content: this.isAr() ? product.descriptionAr : product.description });
        const ogImage = product.images?.[0] || product.variants?.[0]?.images?.[0];
        if (ogImage) {
          this.meta.updateTag({ property: 'og:image', content: ogImage });
        }
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
