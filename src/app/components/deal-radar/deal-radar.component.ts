// ══════════════════════════════════════════════════════════════
// src/app/components/deal-radar/deal-radar.component.ts
// ══════════════════════════════════════════════════════════════

import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Deal } from '../../model/chat.models';
import { ChatService } from '../../services/chat.service_tst';

@Component({
  selector: 'app-deal-radar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './deal-radar.component.html',
  styleUrls: ['./deal-radar.component.scss'],
})
export class DealRadarComponent implements OnInit {

chat = inject(ChatService);

selIndex = signal(0);

  ngOnInit(): void {
    this.chat.loadDeals();
  }

  get deals(): Deal[] { return this.chat.deals(); }
  get deal():  Deal   { return this.deals[this.selIndex()]; }

  scoreClass(score: number): string {
    return score >= 80 ? 'high' : score >= 60 ? 'mid' : 'low';
  }
  matchLabel(score: number): string {
    return score >= 80 ? 'High Match' : score >= 60 ? 'Moderate Match' : 'Low Match';
  }
}