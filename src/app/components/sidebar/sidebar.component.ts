import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service_tst';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<aside class="sidebar">
  <!-- Logo -->
  <div class="sidebar-logo">
    <div class="logo-icon">🧭</div>
    <div class="logo-text">Sales Co-Pilot</div>
  </div>

  <!-- Action buttons -->
  <div class="sidebar-actions">
    <button class="btn-primary" (click)="chat.newConversation(); chat.navigateTo('chat')">
      + New Conversation
    </button>
    <!-- <button class="btn-secondary" (click)="chat.navigateTo('dealradar')">
      ⚡ Deal Radar
    </button> -->
    <!-- <button class="btn-outline">
      📂 Import Document
    </button> -->
  </div>

  <!-- Nav icons -->
  <!-- <div class="nav-icons">
    <button class="nav-icon" title="Refresh">⟳</button>
    <button class="nav-icon" title="Knowledge Base">📖</button>
    <button class="nav-icon" title="Integrations">🔗</button>
  </div> -->

  <!-- Search -->
  <div class="sidebar-search">
    <span class="search-icon">🔍</span>
    <input [(ngModel)]="searchQuery" placeholder="Search history…" class="search-input" />
    <span class="search-shortcut">⌘/</span>
  </div>

  <!-- History Section -->
  <div class="sidebar-sections">
    <div class="section-header">📁 Recent Conversations</div>

    <div class="history-list">
      @for (conv of filteredHistory(); track conv.id) {
        <div class="history-item"
             [class.active]="chat.activeConvId() === conv.id"
             (click)="chat.setActiveConv(conv.id)">
          <div class="history-title">{{ conv.title }}</div>
          <div class="history-meta">{{ conv.message_count }} msgs · {{ conv.updated_at | date:'shortDate' }}</div>
        </div>
      }
      @empty {
        <div class="history-item">No conversations found.</div>
      }
    </div>

    <!-- Works
    <div class="section-header collapsible" (click)="worksOpen = !worksOpen">
      📁 Works <span class="chevron">{{ worksOpen ? '∧' : '∨' }}</span>
    </div>
    @if (worksOpen) {
      @for (item of mock.workItems; track item) {
        <div class="section-item">{{ item }}</div>
      }
    } -->

    <!-- General
    <div class="section-header collapsible" (click)="generalOpen = !generalOpen">
      📁 General <span class="chevron">{{ generalOpen ? '∧' : '∨' }}</span>
    </div>
    @if (generalOpen) {
      @for (item of mock.generalItems; track item) {
        <div class="section-item">{{ item }}</div>
      }
    } -->

    <!-- Corpus -->
    <!-- <div class="section-header collapsible" (click)="corpusOpen = !corpusOpen">
      📁 Corpus <span class="chevron">{{ corpusOpen ? '∧' : '∨' }}</span>
    </div>
    @if (corpusOpen) {
      @for (item of mock.corpusItems; track item) {
        <div class="section-item">{{ item }}</div>
      }
    } -->
  </div>

  <!-- Upgrade card -->
  <!-- <div class="upgrade-card">
    <div class="upgrade-title">Pro Plan</div>
    <div class="upgrade-desc">Unlock unlimited queries, advanced analytics & Google Drive sync.</div>
    <button class="upgrade-btn">Upgrade to Pro</button>
  </div> -->

  <!-- User -->
  <div class="sidebar-user">
    <div class="user-avatar">A</div>
    <div class="user-info">
      <div class="user-name">Sales</div>
      <div class="user-role">Account Manager</div>
    </div>
    <span class="user-settings">⚙</span>
  </div>
</aside>
  `,
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  chat = inject(ChatService);

  searchQuery = '';

  filteredHistory = computed(() =>
    this.chat.conversations().filter(c =>
      c.id !== this.chat.activeConvId() &&
      c.title.toLowerCase().includes(this.searchQuery.toLowerCase())
    )
  );
}