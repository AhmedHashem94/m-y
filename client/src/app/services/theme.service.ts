import { Injectable, inject, signal, effect, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ProductGender } from '@mamy/shared-models';

export type AppTheme = 'default' | 'boy' | 'girl';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  /** Current active theme — drives CSS `data-theme` on <html> */
  readonly theme = signal<AppTheme>('default');

  constructor() {
    effect(() => {
      if (!this.isBrowser) return;
      const t = this.theme();
      const el = document.documentElement;
      if (t === 'default') {
        el.removeAttribute('data-theme');
      } else {
        el.setAttribute('data-theme', t);
      }
    });
  }

  /** Set theme from a product's gender tag */
  setFromGender(gender: ProductGender | undefined) {
    switch (gender) {
      case ProductGender.BOY:
        this.theme.set('boy');
        break;
      case ProductGender.GIRL:
        this.theme.set('girl');
        break;
      default:
        this.theme.set('default');
    }
  }

  /** Reset to neutral brand theme */
  reset() {
    this.theme.set('default');
  }
}
