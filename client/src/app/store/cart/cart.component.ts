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
  templateUrl: './cart.component.html',
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
