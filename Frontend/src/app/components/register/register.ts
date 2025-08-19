
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent {
  name=''; email=''; password=''; isLoading=false; error=''; success='';
  constructor(private api: ApiService, private auth: AuthService, private router: Router) {}
  submit() {
    if (this.isLoading) return;
    this.error=''; this.success=''; this.isLoading=true;
    this.api.register({ name: this.name.trim(), email: this.email.trim(), password: this.password }).subscribe({
      next: res => {
        this.auth.setTokens(res.access_token, res.refresh_token);
        this.auth.setPendingEmail(this.email.trim());
        this.success='Account created. Check your email for the verification link.';
        this.router.navigate(['/verify-email']);
      },
      error: err => this.error = err?.error?.detail || 'Registration failed.'
    }).add(()=> this.isLoading=false);
  }
}
