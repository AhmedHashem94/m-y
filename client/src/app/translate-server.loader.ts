import { TranslateLoader, TranslationObject } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';

/**
 * A no-op translate loader for SSR.
 * Returns empty translations so Angular stabilizes immediately.
 * The real translations load on the client after hydration.
 */
export class TranslateServerLoader implements TranslateLoader {
  getTranslation(): Observable<TranslationObject> {
    return of({});
  }
}
