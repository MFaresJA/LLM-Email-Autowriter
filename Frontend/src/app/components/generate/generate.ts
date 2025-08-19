import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService, UserProfile } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-generate',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './generate.html',
  styleUrls: ['./generate.css'],
})
export class GenerateComponent implements OnInit {
  showProfile = false;
  profile: UserProfile | null = null;

  prompt = '';
  tone: 'formal' | 'informal' | 'neutral' | 'friendly' | 'professional' = 'formal';
  length: 'short' | 'medium' | 'long' = 'short';

  recipientName = '';
  senderName = '';
  extras = '';

  isLoading = false;
  error = '';
  result = '';
  copied = false;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.api.getUserProfile().subscribe({
      next: (u) => {
        this.profile = u;
        if (!this.senderName && u?.name) this.senderName = u.name;
      },
      error: () => (this.profile = null),
    });
  }

  toggleProfile(): void {
    this.showProfile = !this.showProfile;
  }

  goHistory(): void {
    this.router.navigateByUrl('/history');
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/home');
  }

  clearAll(): void {
    this.result = '';
    this.error = '';
    this.copied = false;
  }

  copyResult(): void {
    if (!this.result) return;
    navigator.clipboard.writeText(this.result).then(() => {
      this.copied = true;
      setTimeout(() => (this.copied = false), 1200);
    });
  }

  private getSignOff(tone: string): string {
    const map: Record<string, string> = {
      formal: 'Sincerely,',
      professional: 'Best regards,',
      neutral: 'Kind regards,',
      friendly: 'Cheers,',
      informal: 'Take care,',
    };
    return map[tone] || 'Sincerely,';
  }

  private escRe(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private normalizeExtras(raw: string): string[] {
    if (!raw?.trim()) return [];
    const rawLines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
    const out: string[] = [];

    const idLike = /(student|students)?\s*id[:#]?\s*([A-Za-z0-9-]+)/i;
    const numberLike = /(my\s*)?(phone|mobile|number)[:#]?\s*([+\d][\d\s-]+)/i;
    const orgLike = /(organization|organisation|company|university|school|institute)\s*(is|:)?\s*(.+)$/i;

    for (let line of rawLines) {
      const fromIdx = line.toLowerCase().indexOf(' from ');
      if (fromIdx > -1) {
        const left = line.slice(0, fromIdx).trim();
        const right = line.slice(fromIdx + 6).trim();
        const idm = left.match(idLike);
        if (idm && idm[2]) out.push(idm[2]); else if (left) out.push(left);
        if (right) out.push(right);
        continue;
      }

      const nm = line.match(numberLike);
      if (nm && nm[3]) {
        out.push(nm[3].replace(/\s+/g, ' ').trim());
        continue;
      }

      const om = line.match(orgLike);
      if (om && om[3]) {
        out.push(om[3].trim());
        continue;
      }

      const im = line.match(idLike);
      if (im && im[2]) {
        out.push(im[2].trim());
        continue;
      }

      out.push(line);
    }

    const seen = new Set<string>();
    return out.map((s) => s.trim()).filter((s) => s && !seen.has(s) && (seen.add(s), true));
  }

  private desiredSignatureBlock(): string {
    const sign = this.getSignOff(this.tone);
    const name = (this.senderName || this.profile?.name || '').trim();
    const extraLines = this.normalizeExtras(this.extras);
    const lines = [sign];
    if (name) lines.push(name);
    lines.push(...extraLines);
    return lines.join('\n');
  }

  private buildPromptForModel(): string {
    const parts: string[] = [];

    if (this.recipientName.trim()) {
      parts.push(`This email is addressed to: ${this.recipientName.trim()}.`);
    }
    parts.push(`The purpose/intent is: ${this.prompt.trim()}.`);
    parts.push(`Write a ${this.tone} ${this.length} email. Keep it clear and professional.`);

    const sig = this.desiredSignatureBlock();
    parts.push(
      'After the body, add EXACTLY the following signature block, with a blank line before it. ' +
      'Do NOT add bullets, quotes, or backticks. Do NOT add any other signature. ' +
      'Do NOT duplicate the sender name. Use the block as-is:'
    );
    parts.push(sig);

    return parts.join('\n');
  }

  private enforceSingleSignature(text: string): string {
  const trimmed = text.trimEnd();
  const finalSig = this.desiredSignatureBlock().trim();

  
  const signOffs = [
    'Sincerely,', 'Best regards,', 'Kind regards,', 'Cheers,', 'Take care,'
  ].map(this.escRe).join('|');

  // Regex: capture any sign-off and everything that follows
  const trailingSigRe = new RegExp(`\\n\\s*(${signOffs})[\\s\\S]*$`, 'i');

  // Remove the model-generated signature completely
  const cleaned = trimmed.replace(trailingSigRe, '').trimEnd();

  // Add exactly your formatted signature
  return `${cleaned}\n\n${finalSig}`;
}


  submit(): void {
    this.error = '';
    this.result = '';
    if (!this.prompt.trim()) {
      this.error = 'Please describe what you want to write.';
      return;
    }

    this.isLoading = true;
    const payload = {
      prompt: this.buildPromptForModel(),
      tone: this.tone,
      length: this.length,
    };

    this.api.generateEmail(payload).subscribe({
      next: (res) => {
        const body = (res?.generated_email ?? '').trim();
        this.result = this.enforceSingleSignature(body);
        this.isLoading = false;
      },
      error: (err) => {
        this.error = err?.error?.detail || 'Failed to generate the email.';
        this.isLoading = false;
      },
    });
  }
}
