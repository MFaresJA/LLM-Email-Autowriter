import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { ApiService, AuthResponse } from './api.service';
import { HttpHeaders } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private ACCESS = 'access_token';
  private REFRESH = 'refresh_token';
  private PENDING_EMAIL = 'pending_email';

  constructor(private api: ApiService) {}

  // Token storage
  setTokens(access: string, refresh: string) {
    localStorage.setItem(this.ACCESS, access);
    localStorage.setItem(this.REFRESH, refresh);
  }

  getAccessToken() {
    return localStorage.getItem(this.ACCESS);
  }

  getRefreshToken() {
    return localStorage.getItem(this.REFRESH);
  }

  clearTokens() {
    localStorage.removeItem(this.ACCESS);
    localStorage.removeItem(this.REFRESH);
  }

  // Email during verification flow
  setPendingEmail(email: string) {
    localStorage.setItem(this.PENDING_EMAIL, email);
  }

  getPendingEmail(): string {
    return localStorage.getItem(this.PENDING_EMAIL) || '';
  }

  clearPendingEmail() {
    localStorage.removeItem(this.PENDING_EMAIL);
  }

  // Auth status
  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }

  logout() {
    this.clearTokens();
    this.clearPendingEmail();
  }

  // Use refresh token
  refreshToken(): Observable<boolean> {
    const r = this.getRefreshToken();
    if (!r) return of(false);
    return this.api.refreshToken().pipe(
      tap((res: AuthResponse) => this.setTokens(res.access_token, res.refresh_token)),
      map(() => true),
      catchError(() => of(false))
    );
  }

  
  getAuthHeaders(): HttpHeaders {
    const token = this.getAccessToken();
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }
}
