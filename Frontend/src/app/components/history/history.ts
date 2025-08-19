import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService, EmailResponse, UserProfile } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './history.html',
  styleUrls: ['./history.css'],
})
export class HistoryComponent implements OnInit {
  
  showProfile = false;
  profile: UserProfile | null = null;

  
  loading = false;
  error = '';
  emails: EmailResponse[] = [];
  filtered: EmailResponse[] = [];
  copiedId: number | null = null;

  
  search = '';

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.fetchProfile();
    this.fetchEmails();
  }

  fetchProfile() {
    this.api.getUserProfile().subscribe({
      next: (u) => (this.profile = u),
      error: () => (this.profile = null),
    });
  }

  fetchEmails() {
    this.loading = true;
    this.api.getEmails().subscribe({
      next: (list) => {
        this.emails = list || [];
        this.filtered = this.emails.slice();
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.detail || 'Failed to load history';
        this.loading = false;
      },
    });
  }

 
  toggleProfile() { this.showProfile = !this.showProfile; }
  goGenerate() { this.router.navigateByUrl('/generate'); }
  logout() { this.auth.logout(); this.router.navigateByUrl('/home'); }

  onSearchChange() {
    const q = this.search.trim().toLowerCase();
    if (!q) { this.filtered = this.emails.slice(); return; }
    this.filtered = this.emails.filter(e =>
      (e.prompt ?? '').toLowerCase().includes(q) ||
      (e.generated_email ?? '').toLowerCase().includes(q) ||
      (e.tone ?? '').toLowerCase().includes(q) ||
      (e.length ?? '').toLowerCase().includes(q)
    );
  }

  copyEmail(e: EmailResponse) {
    const text = e.generated_email || '';
    navigator.clipboard.writeText(text).then(() => {
      this.copiedId = e.id;
      setTimeout(() => this.copiedId = null, 1200);
    });
  }
}
