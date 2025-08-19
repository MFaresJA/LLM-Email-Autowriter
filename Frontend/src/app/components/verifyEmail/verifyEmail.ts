
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './verifyEmail.html',
  styleUrls: ['./verifyEmail.css']
})
export class VerifyEmailComponent implements OnInit, OnDestroy {
  userEmail = '';
  isVerified = false;
  isLoading = false;
  error = '';
  info = '';
  countdown = 10;
  private timerId: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    const email = this.route.snapshot.queryParamMap.get('email');

    if (token && email) {
      
      this.verifyFromLink(token, email);
    } else {
      
      this.userEmail = this.auth.getPendingEmail();
      this.checkVerificationStatus();
    }
  }

  ngOnDestroy(): void {
    if (this.timerId) clearInterval(this.timerId);
  }

  verifyFromLink(token: string, email: string) {
    this.isLoading = true;
    this.api.verifyEmail(token, email).subscribe({
      next: () => {
        this.auth.setPendingEmail(email);
        this.isVerified = true;
        this.info = '✅ Your email has been verified! Redirecting to Generate in 10s...';
        this.startRedirectCountdown();
      },
      error: (err) => {
        this.error = err?.error?.detail || 'Verification failed.';
      }
    }).add(() => (this.isLoading = false));
  }

  checkVerificationStatus() {
    this.error = '';
    this.info = '';
    this.isLoading = true;

    this.api.checkVerificationStatus().subscribe({
      next: (res) => {
        if (res.verified) {
          this.isVerified = true;
          this.info = '✅ Your email has been verified! Redirecting to Generate in 10s...';
          this.startRedirectCountdown();
        } else {
          this.info = 'Email not verified yet.';
        }
      },
      error: (err) => {
        this.error = err?.error?.detail || 'Failed to check verification status.';
      }
    }).add(() => this.isLoading = false);
  }

  resendVerification() {
    this.error = '';
    this.info = '';
    this.isLoading = true;

    this.api.resendVerification().subscribe({
      next: () => {
        this.info = '📩 Verification email resent. Please check your inbox.';
      },
      error: (err) => {
        this.error = err?.error?.detail || 'Failed to resend verification email.';
      }
    }).add(() => this.isLoading = false);
  }

  startRedirectCountdown() {
    if (this.timerId) return;

    this.countdown = 10;
    this.timerId = setInterval(() => {
      this.countdown -= 1;
      this.info = `Your email has been verified! Redirecting to Generate in ${this.countdown}s...`;

      if (this.countdown <= 0) {
        clearInterval(this.timerId);
        this.router.navigate(['/generate']);
      }
    }, 1000);
  }

  goNow() {
    if (this.timerId) clearInterval(this.timerId);
    this.router.navigate(['/generate']);
  }
}
