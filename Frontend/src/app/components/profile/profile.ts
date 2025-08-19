import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { ApiService, UserProfile } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './Profile.html',
  styleUrls: ['./Profile.css']
})
export class ProfileComponent implements OnInit {
  name = '';
  email = '';
  is_verified = false;
  error = '';
  saving = false;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.api.getUserProfile().subscribe({
      next: (u: UserProfile) => {
        this.name = u.name;
        this.email = u.email;
        this.is_verified = !!u.is_verified;
      },
      error: (err) => {
        this.error = err?.error?.detail || 'Failed to load profile';
      }
    });
  }

  save() {
    if (this.saving) return;
    this.error = '';
    this.saving = true;

    this.api.updateProfile({ name: this.name }).subscribe({
      next: () => { this.saving = false; },
      error: (err) => {
        this.saving = false;
        this.error = err?.error?.detail || 'Failed to save';
      }
    });
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/home');
  }
}
