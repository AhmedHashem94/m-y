import { Component, inject, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideMinus, lucidePlus, lucideTrash2, lucideShoppingBag } from '@ng-icons/lucide';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { CartService } from '../../services/cart.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterLink, TranslateModule, NgIcon, HlmIcon, HlmButton, ...HlmCardImports],
  providers: [provideIcons({ lucideMinus, lucidePlus, lucideTrash2, lucideShoppingBag })],
  template: `
    <div class="container mx-auto px-4 py-6 sm:py-8">
      <h1 class="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6">{{ 'cart.title' | translate }}</h1>

      @if (cart.items().length === 0) {
        <!-- Empty cart -->
        <div class="flex flex-col items-center justify-center py-20 gap-4">
          <ng-icon hlmIcon size="xl" name="lucideShoppingBag" class="text-muted-foreground" />
          <p class="text-lg font-medium text-muted-foreground">{{ 'cart.empty' | translate }}</p>
          <p class="text-sm text-muted-foreground">{{ 'cart.empty_subtitle' | translate }}</p>
          <a routerLink="/store">
            <button hlmBtn>{{ 'cart.continue_shopping' | translate }}</button>
          </a>
        </div>
      } @else {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <!-- Cart items -->
          <div class="lg:col-span-2 flex flex-col gap-3 sm:gap-4">
            @for (item of cart.items(); track item.variantId) {
              <section hlmCard class="p-3 sm:p-4">
                <div class="flex gap-3 sm:gap-4">
                  <!-- Image -->
                  <div class="h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-md bg-muted">
                    @if (item.image) {
                      <img [src]="item.image" [alt]="isAr() ? item.nameAr : item.name"
                        class="h-full w-full object-cover" loading="lazy" />
                    }
                  </div>

                  <!-- Info -->
                  <div class="flex flex-1 flex-col justify-between">
                    <div>
                      <h3 class="font-semibold text-sm text-foreground">
                        {{ isAr() ? item.nameAr : item.name }}
                      </h3>
                      <!-- Variant attributes -->
                      @if (item.attributes && objectKeys(item.attributes).length) {
                        <p class="text-xs text-muted-foreground mt-1">
                          {{ formatAttributes(item.attributes) }}
                        </p>
                      }
                    </div>

                    <div class="flex flex-wrap items-center gap-2 sm:gap-0 sm:justify-between mt-2">
                      <!-- Quantity controls -->
                      <div class="flex items-center gap-1 rounded-md border border-border">
                        <button hlmBtn variant="ghost" size="icon" class="h-7 w-7 sm:h-8 sm:w-8"
                          (click)="cart.updateQuantity(item.variantId, item.quantity - 1)">
                          <ng-icon hlmIcon size="xs" name="lucideMinus" />
                        </button>
                        <span class="w-7 sm:w-8 text-center text-sm font-medium">{{ item.quantity }}</span>
                        <button hlmBtn variant="ghost" size="icon" class="h-7 w-7 sm:h-8 sm:w-8"
                          (click)="cart.updateQuantity(item.variantId, item.quantity + 1)">
                          <ng-icon hlmIcon size="xs" name="lucidePlus" />
                        </button>
                      </div>

                      <!-- Price -->
                      <span class="font-bold text-sm text-primary">
                        {{ item.price * item.quantity }} {{ 'common.egp' | translate }}
                      </span>

                      <!-- Remove -->
                      <button hlmBtn variant="ghost" size="icon" class="h-7 w-7 sm:h-8 sm:w-8 text-destructive"
                        (click)="cart.removeItem(item.variantId)">
                        <ng-icon hlmIcon size="xs" name="lucideTrash2" />
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            }
          </div>

          <!-- Cart Summary -->
          <div>
            <section hlmCard class="p-6 sticky top-20">
              <h2 class="text-lg font-bold text-foreground mb-4">{{ 'cart.cart_summary' | translate }}</h2>
              <div class="flex flex-col gap-3">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-muted-foreground">{{ 'cart.total_items' | translate }}</span>
                  <span class="font-medium">{{ cart.totalItems() }}</span>
                </div>
                <hr class="border-border" />
                <div class="flex items-center justify-between">
                  <span class="font-semibold text-foreground">{{ 'cart.total' | translate }}</span>
                  <span class="text-xl font-bold text-primary">{{ cart.totalPrice() }} {{ 'common.egp' | translate }}</span>
                </div>
              </div>
              <a routerLink="/checkout" class="block mt-6">
                <button hlmBtn class="w-full">{{ 'cart.checkout' | translate }}</button>
              </a>
              <a routerLink="/store" class="block mt-3">
                <button hlmBtn variant="outline" class="w-full">{{ 'cart.continue_shopping' | translate }}</button>
              </a>
            </section>
          </div>
        </div>
      }
    </div>
  `,
})
export class CartComponent {
  protected readonly cart = inject(CartService);
  private readonly langService = inject(LanguageService);

  readonly isAr = computed(() => this.langService.currentLang() === 'ar');

  objectKeys = Object.keys;

  formatAttributes(attrs: Record<string, string>): string {
    return Object.values(attrs).join(' / ');
  }
}
