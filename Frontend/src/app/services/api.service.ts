import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface EmailResponse {
  id: number;
  prompt: string;
  tone: string;
  length: string;
  generated_email: string;
  created_at: string;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  is_verified: boolean;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly BASE_URL = 'http://localhost:8000';

  constructor(private http: HttpClient) {}

  // Reusable helper for headers
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  // Auth
  register(data: { name: string; email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.BASE_URL}/api/auth/register`, data);
  }

  login(data: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.BASE_URL}/api/auth/login`, data);
  }

  refreshToken(): Observable<AuthResponse> {
    const refresh = localStorage.getItem('refresh_token') || '';
    const headers = new HttpHeaders().set('X-Refresh-Token', `Bearer ${refresh}`);
    return this.http.post<AuthResponse>(`${this.BASE_URL}/api/auth/refresh`, {}, { headers });
  }

  me(): Observable<UserProfile> {
    const headers = this.getAuthHeaders();
    return this.http.get<UserProfile>(`${this.BASE_URL}/api/auth/me`, { headers });
  }

  // Emails
  generateEmail(payload: { prompt: string; tone: string; length: string }): Observable<EmailResponse> {
    const headers = this.getAuthHeaders();
    return this.http.post<EmailResponse>(`${this.BASE_URL}/api/generate`, payload, { headers });
  }

  getEmails(): Observable<EmailResponse[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<EmailResponse[]>(`${this.BASE_URL}/api/emails`, { headers });
  }

  // Profile
  getUserProfile(): Observable<UserProfile> {
    const headers = this.getAuthHeaders();
    return this.http.get<UserProfile>(`${this.BASE_URL}/api/user/profile`, { headers });
  }

  updateProfile(data: { name?: string }): Observable<{ message: string }> {
    const headers = this.getAuthHeaders();
    return this.http.patch<{ message: string }>(`${this.BASE_URL}/api/user/profile`, data, { headers });
  }

  changePassword(data: { current_password: string; new_password: string }): Observable<{ message: string }> {
    const headers = this.getAuthHeaders();
    return this.http.post<{ message: string }>(`${this.BASE_URL}/api/user/change-password`, data, { headers });
  }

  // Verification
  verifyEmail(token: string, email: string): Observable<any> {
    const params = new HttpParams().set('token', token).set('email', email);
    return this.http.get(`${this.BASE_URL}/api/auth/verify-email`, { params });
  }

  checkVerificationStatus(): Observable<{ verified: boolean; email: string; message: string }> {
    const headers = this.getAuthHeaders();
    return this.http.get<{ verified: boolean; email: string; message: string }>(
      `${this.BASE_URL}/api/auth/verification-status`, { headers }
    );
  }

  resendVerification(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.post(`${this.BASE_URL}/api/auth/resend-verification`, {}, { headers });
  }
}
