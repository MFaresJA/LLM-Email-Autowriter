import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class VerifiedEmailGuard implements CanActivate {

  constructor(private api: ApiService, private router: Router) {}

  canActivate(): Observable<boolean> {
    return this.api.getUserProfile().pipe(
      map(user => {
        if (user?.is_verified) {
          return true;
        } else {
          alert("Please verify your email first.");
          this.router.navigate(['/login']);
          return false;
        }
      }),
      catchError(() => {
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }
}
