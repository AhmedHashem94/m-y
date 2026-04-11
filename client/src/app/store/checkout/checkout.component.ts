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
  templateUrl: './checkout.component.html',
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
