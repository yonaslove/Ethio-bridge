import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const toastService = inject(ToastService);
  const router = inject(Router);

  // Attach auth token if available and not already set
  let authReq = req;
  const token = authService.token;
  if (token && !req.headers.has('Authorization')) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Don't intercept 401 on login request
      if (error.status === 401 && !req.url.includes('/auth/login')) {
        authService.logout();
        toastService.warning('Your session has expired. Please log in again.', 'Session Expired');
        router.navigate(['/login'], { queryParams: { expired: 'true' } });
      } else if (error.status === 403) {
        toastService.error('You do not have permission to perform this action.', 'Access Denied');
      } else if (error.status === 429) {
        toastService.warning(error.error?.message || 'Too many requests. Please wait a few moments.', 'Rate Limit');
      }

      return throwError(() => error);
    })
  );
};
