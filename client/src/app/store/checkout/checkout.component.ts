import { Component, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmCardImports } from '@spartan-ng/helm/card';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import { EGYPT_PHONE_RE } from '@mamy/shared-models';
import { CartService } from '../../services/cart.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslateModule, HlmButton, ...HlmCardImports, HlmInput, HlmLabel],
  template: `
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold text-foreground mb-6">{{ 'checkout.title' | translate }}</h1>

      @if (cart.items().length === 0) {
        <div class="flex flex-col items-center justify-center py-20 gap-4">
          <p class="text-lg font-medium text-muted-foreground">{{ 'cart.empty' | translate }}</p>
          <a routerLink="/store">
            <button hlmBtn>{{ 'cart.continue_shopping' | translate }}</button>
          </a>
        </div>
      } @else {
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Customer Form -->
          <div class="lg:col-span-2">
            <section hlmCard>
              <div hlmCardHeader>
                <h2 hlmCardTitle>{{ 'checkout.customer_info' | translate }}</h2>
              </div>
              <div hlmCardContent>
                <form [formGroup]="form" (ngSubmit)="onSubmit()" class="flex flex-col gap-4">
                  <div class="flex flex-col gap-2">
                    <label hlmLabel for="name">{{ 'checkout.customer_name' | translate }}</label>
                    <input hlmInput id="name" formControlName="name" />
                    @if (form.get('name')?.touched && form.get('name')?.hasError('required')) {
                      <p class="text-xs text-destructive">{{ 'checkout.required_field' | translate }}</p>
                    }
                  </div>

                  <div class="flex flex-col gap-2">
                    <label hlmLabel for="phone">{{ 'checkout.phone' | translate }}</label>
                    <input hlmInput id="phone" formControlName="phone" dir="ltr"
                      [placeholder]="'checkout.phone_placeholder' | translate" />
                    @if (form.get('phone')?.touched && form.get('phone')?.hasError('required')) {
                      <p class="text-xs text-destructive">{{ 'checkout.required_field' | translate }}</p>
                    }
                    @if (form.get('phone')?.touched && form.get('phone')?.hasError('pattern')) {
                      <p class="text-xs text-destructive">{{ 'checkout.phone_invalid' | translate }}</p>
                    }
                  </div>

                  <div class="flex flex-col gap-2">
                    <label hlmLabel for="address">{{ 'checkout.address' | translate }}</label>
                    <input hlmInput id="address" formControlName="address" />
                    @if (form.get('address')?.touched && form.get('address')?.hasError('required')) {
                      <p class="text-xs text-destructive">{{ 'checkout.required_field' | translate }}</p>
                    }
                  </div>

                  <div class="flex flex-col gap-2">
                    <label hlmLabel for="city">{{ 'checkout.city' | translate }}</label>
                    <input hlmInput id="city" formControlName="city" />
                    @if (form.get('city')?.touched && form.get('city')?.hasError('required')) {
                      <p class="text-xs text-destructive">{{ 'checkout.required_field' | translate }}</p>
                    }
                  </div>

                  @if (error()) {
                    <p class="text-sm text-destructive">{{ error() }}</p>
                  }

                  <button hlmBtn type="submit" class="mt-2"
                    [disabled]="submitting() || form.invalid">
                    @if (submitting()) {
                      {{ 'checkout.placing_order' | translate }}
                    } @else {
                      {{ 'checkout.place_order' | translate }}
                    }
                  </button>
                </form>
              </div>
            </section>
          </div>

          <!-- Order Summary -->
          <div>
            <section hlmCard class="sticky top-20">
              <div hlmCardHeader>
                <h2 hlmCardTitle>{{ 'checkout.order_summary' | translate }}</h2>
              </div>
              <div hlmCardContent>
                <div class="flex flex-col gap-3">
                  @for (item of cart.items(); track item.variantId) {
                    <div class="flex items-center justify-between text-sm">
                      <span class="text-foreground">
                        {{ isAr() ? item.nameAr : item.name }}
                        <span class="text-muted-foreground">&times; {{ item.quantity }}</span>
                      </span>
                      <span class="font-medium">{{ item.price * item.quantity }} {{ 'common.egp' | translate }}</span>
                    </div>
                  }
                  <hr class="border-border" />
                  <div class="flex items-center justify-between">
                    <span class="font-semibold">{{ 'cart.total' | translate }}</span>
                    <span class="text-xl font-bold text-primary">{{ cart.totalPrice() }} {{ 'common.egp' | translate }}</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      }
    </div>
  `,
})
export class CheckoutComponent {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  protected readonly cart = inject(CartService);
  private readonly langService = inject(LanguageService);

  readonly submitting = signal(false);
  readonly error = signal('');

  readonly isAr = computed(() => this.langService.currentLang() === 'ar');

  readonly form: FormGroup = this.fb.group({
    name: ['', Validators.required],
    phone: ['', [Validators.required, Validators.pattern(EGYPT_PHONE_RE)]],
    address: ['', Validators.required],
    city: ['', Validators.required],
  });

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set('');

    const items = this.cart.items();
    const payload = {
      customerDetails: this.form.value,
      items: items.map((i) => ({
        variantId: i.variantId,
        productId: i.productId,
        name: i.name,
        sku: i.sku,
        quantity: i.quantity,
        unitPrice: i.price,
        attributes: i.attributes,
      })),
      total: this.cart.totalPrice(),
    };

    this.http.post<{ id: string }>('/api/orders', payload).subscribe({
      next: (res) => {
        this.cart.clearCart();
        this.router.navigate(['/track', res.id]);
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(err.error?.message || 'checkout.order_failed');
      },
    });
  }
}
