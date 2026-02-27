import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service_tst';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="welcome-wrap">
  <!-- Topbar -->
  <div class="topbar">
    <div class="topbar-title">Sales Co-Pilot</div>
    <!-- <div class="topbar-actions">
      <button class="btn-upgrade">⬆ Upgrade Plan</button>
      <button class="btn-ghost">🕐 History</button>
      <button class="icon-btn">🔗</button>
      <button class="icon-btn">✉</button>
      <button class="icon-btn">🔔</button>
    </div> -->
  </div>

  <!-- Body -->
  <div class="welcome-body">
    <!-- Hero -->
    <div class="hero">
      <div class="hero-icon">🧭</div>
      <h1 class="hero-title">Welcome to Sales Co-Pilot</h1>
      <p class="hero-subtitle">
        Your AI Knowledge Partner for Proposals, Case Studies &amp; Whitepapers.<br/>
        Every answer is cited and grounded — no hallucinations.
      </p>
    </div>

    <!-- Input -->
    <div class="chat-input-box">
      <input
        [(ngModel)]="query"
        (keydown.enter)="submit()"
        placeholder="Ask anything about our proposals, case studies or whitepapers…"
        class="main-input"
      />
      <div class="input-footer">
        <div class="input-actions">
          <button class="attach-btn">📎 Attach</button>
          <button class="attach-btn">🖼 Upload Media</button>
        </div>
        <button class="send-btn" [class.active]="query.trim()" (click)="submit()">▶</button>
      </div>
    </div>

    <!-- Templates -->
    <div class="templates-section">
      <h2 class="templates-title">Find Your Template Queries</h2>
      <div class="templates-grid">
        @for (t of chat.templates; track t.label) {
          <div class="template-card" (click)="chat.startConversation(t.label)">
            <div class="template-icon" [style.background]="t.iconBg">{{ t.icon }}</div>
            <p class="template-label">{{ t.label }}</p>
            <div class="template-arrow">▶</div>
          </div>
        }
      </div>
    </div>

    <!-- Stats -->
    <!-- <div class="stats-row">
      @for (s of stats; track s.label) {
        <div class="stat-item">
          <div class="stat-value">{{ s.value }}</div>
          <div class="stat-label">{{ s.label }}</div>
        </div>
      }
    </div> -->
  </div>
</div>
  `,
  styleUrls: ['./welcome.component.scss']
})
export class WelcomeComponent {
  chat = inject(ChatService);
  query = '';

  submit() {
    if (this.query.trim()) this.chat.startConversation(this.query.trim());
  }
}