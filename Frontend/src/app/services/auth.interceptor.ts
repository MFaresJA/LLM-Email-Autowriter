import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const isLogin = /\/auth\/login(\?|$)/.test(req.url);
  const isRegister = /\/auth\/register(\?|$)/.test(req.url);
  const isVerifyEmail = /\/auth\/verify-email(\?|$)/.test(req.url);
  const isRefresh = /\/auth\/refresh(\?|$)/.test(req.url);

  if (isRefresh) {
    const refresh = auth.getRefreshToken();
    const headers = refresh ? req.headers.set('X-Refresh-Token', `Bearer ${refresh}`) : req.headers;
    return next(req.clone({ headers }));
  }

  if (isLogin || isRegister || isVerifyEmail) return next(req);

  const token = auth.getAccessToken();
  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && !isRefresh) {
        return auth.refreshToken().pipe(
          switchMap(ok => {
            if (!ok) { auth.logout(); router.navigate(['/login']); return throwError(() => err); }
            const newToken = auth.getAccessToken();
            const retried = newToken ? req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }) : req;
            return next(retried);
          }),
          catchError(e => { auth.logout(); router.navigate(['/login']); return throwError(() => e); })
        );
      }
      return throwError(() => err);
    })
  );
};
