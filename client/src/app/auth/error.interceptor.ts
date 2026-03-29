import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error) => {
      // Only redirect to login for admin API requests, not public ones
      if (
        (error.status === 401 || error.status === 403) &&
        req.url.includes('/api/') &&
        router.url.startsWith('/admin')
      ) {
        router.navigate(['/auth/login']);
      }
      return throwError(() => error);
    })
  );
};
