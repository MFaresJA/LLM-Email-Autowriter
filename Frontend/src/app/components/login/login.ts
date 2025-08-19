
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  email = ''; password = ''; isLoading = false; error = '';
  constructor(private api: ApiService, private auth: AuthService, private router: Router) {}
  submit() {
    if (this.isLoading) return;
    this.error=''; this.isLoading=true;
    this.api.login({ email: this.email.trim(), password: this.password }).subscribe({
      next: res => {
        this.auth.setTokens(res.access_token, res.refresh_token);
        this.auth.setPendingEmail(this.email.trim());
        this.api.checkVerificationStatus().subscribe({
          next: st => this.router.navigate([st?.verified ? '/generate' : '/verify-email']),
          error: () => this.router.navigate(['/verify-email'])
        });
      },
      error: err => this.error = err?.error?.detail || 'Login failed.'
    }).add(()=> this.isLoading=false);
  }
}
