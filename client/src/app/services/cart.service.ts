import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface CartItem {
  variantId: string;
  productId: string;
  name: string;
  nameAr: string;
  sku: string;
  price: number;
  quantity: number;
  image: string;
  attributes: Record<string, string>;
}

const CART_KEY = 'mamy_cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private readonly _items = signal<CartItem[]>(this.loadCart());

  readonly items = this._items.asReadonly();

  readonly totalItems = computed(() =>
    this._items().reduce((sum, item) => sum + item.quantity, 0)
  );

  readonly totalPrice = computed(() =>
    this._items().reduce((sum, item) => sum + item.price * item.quantity, 0)
  );

  addItem(item: CartItem) {
    const current = this._items();
    const existing = current.find((i) => i.variantId === item.variantId);
    if (existing) {
      this._items.set(
        current.map((i) =>
          i.variantId === item.variantId
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        )
      );
    } else {
      this._items.set([...current, item]);
    }
    this.persist();
  }

  removeItem(variantId: string) {
    this._items.set(this._items().filter((i) => i.variantId !== variantId));
    this.persist();
  }

  updateQuantity(variantId: string, qty: number) {
    if (qty <= 0) {
      this.removeItem(variantId);
      return;
    }
    this._items.set(
      this._items().map((i) =>
        i.variantId === variantId ? { ...i, quantity: qty } : i
      )
    );
    this.persist();
  }

  clearCart() {
    this._items.set([]);
    this.persist();
  }

  private persist() {
    if (this.isBrowser) {
      localStorage.setItem(CART_KEY, JSON.stringify(this._items()));
    }
  }

  private loadCart(): CartItem[] {
    if (!this.isBrowser) return [];
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}
