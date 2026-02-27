// ══════════════════════════════════════════════════════════════
// src/app/components/source-panel/source-panel.component.ts
// ══════════════════════════════════════════════════════════════

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatService } from '../../services/chat.service_tst';

@Component({
  selector: 'app-source-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './source-panel.component.html',
  styleUrls: ['./source-panel.component.scss'],
})
export class SourcePanelComponent {
  chat = inject(ChatService);
  get msg() { return this.chat.sourceMsg(); }
}