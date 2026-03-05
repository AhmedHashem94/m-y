import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { TranslateModule } from '@ngx-translate/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideShoppingCart, lucideMenu, lucideX, lucideUser, lucideShield, lucideLogOut, lucideGlobe } from '@ng-icons/lucide';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { HlmButton } from '@spartan-ng/helm/button';
import { LanguageService } from './services/language.service';
import { ThemeService } from './services/theme.service';
import { AuthService } from './services/auth.service';
import { CartService } from './services/cart.service';

@Component({
  imports: [RouterOutlet, RouterLink, TranslateModule, NgIcon, HlmIcon, HlmButton],
  providers: [provideIcons({ lucideShoppingCart, lucideMenu, lucideX, lucideUser, lucideShield, lucideLogOut, lucideGlobe })],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly lang = inject(LanguageService);
  private readonly theme = inject(ThemeService);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);
  protected readonly cart = inject(CartService);

  protected mobileMenuOpen = false;

  constructor() {
    this.lang.init();

    // Reset theme to default when navigating away from product pages
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e) => {
        const url = (e as NavigationEnd).urlAfterRedirects;
        if (!url.startsWith('/store/product/')) {
          this.theme.reset();
        }
        this.mobileMenuOpen = false;
      });
  }

  toggleLang() {
    this.lang.switchLang(this.lang.currentLang() === 'ar' ? 'en' : 'ar');
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/store']);
  }
}
