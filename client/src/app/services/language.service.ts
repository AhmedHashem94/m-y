import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';

const LANG_KEY = 'mamy_lang';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly currentLang = signal(this.getStoredLang());

  init() {
    this.translate.addLangs(['ar', 'en']);
    this.translate.setDefaultLang('ar');
    const lang = this.currentLang();
    this.translate.use(lang);
    if (this.isBrowser) {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }
  }

  switchLang(lang: 'ar' | 'en') {
    this.translate.use(lang);
    this.currentLang.set(lang);
    if (this.isBrowser) {
      localStorage.setItem(LANG_KEY, lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }
  }

  private getStoredLang(): 'ar' | 'en' {
    if (this.isBrowser) {
      const stored = localStorage.getItem(LANG_KEY);
      if (stored === 'ar' || stored === 'en') return stored;
    }
    return 'ar';
  }
}
