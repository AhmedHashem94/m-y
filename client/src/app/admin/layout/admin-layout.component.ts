import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { HlmButton } from '@spartan-ng/helm/button';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideMenu, lucideX } from '@ng-icons/lucide';
import { HlmIcon } from '@spartan-ng/helm/icon';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../services/auth.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, HlmButton, NgIcon, HlmIcon, TranslateModule],
  providers: [provideIcons({ lucideMenu, lucideX })],
  templateUrl: './admin-layout.component.html',
})
export class AdminLayoutComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly lang = inject(LanguageService);

  sidebarOpen = false;

  get isLtr() {
    return this.lang.currentLang() !== 'ar';
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/auth/login']);
  }
}
