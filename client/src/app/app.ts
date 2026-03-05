import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { LanguageService } from './services/language.service';
import { ThemeService } from './services/theme.service';

@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly lang = inject(LanguageService);
  private readonly theme = inject(ThemeService);
  private readonly router = inject(Router);

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
      });
  }
}
