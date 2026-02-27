// src/app/components/chat/chat.component.ts

import {
    Component, inject, AfterViewChecked,
    ViewChild, ElementRef
  } from '@angular/core';
  import { CommonModule } from '@angular/common';
  import { FormsModule } from '@angular/forms';
  import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
  import { MockDataService } from '../../services/mock-data.service';
import { SourcePanelComponent } from '../source-panel/source-panel.component';
import { ChatService } from '../../services/chat.service';
import { Message } from '../../model/chat.models';

  
  @Component({
    selector: 'app-chat',
    standalone: true,
    imports: [CommonModule, FormsModule, SourcePanelComponent],
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.scss'],
  })
  export class ChatComponent implements AfterViewChecked {
    chat      = inject(ChatService);
    mock      = inject(MockDataService);
    sanitizer = inject(DomSanitizer);
  
    @ViewChild('msgBottom') msgBottom!: ElementRef;
  
    inputText   = '';
    focused     = false;
    feedback: Record<string, 'helpful' | 'not_helpful'> = {};
  
    get activeTitle(): string {
      return this.mock.conversations.find(c => c.id === this.chat.activeConvId())?.title
        ?? 'New Conversation';
    }
  
    ngAfterViewChecked(): void {
      this.msgBottom?.nativeElement?.scrollIntoView({ behavior: 'smooth' });
    }
  
    onSend(): void {
      if (!this.inputText.trim() || this.chat.typing()) return;
      this.chat.sendMessage(this.inputText.trim());
      this.inputText = '';
    }
  
    onKeydown(e: KeyboardEvent): void {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.onSend(); }
    }
  
    async onFeedback(msg: Message, fb: 'helpful' | 'not_helpful'): Promise<void> {
      this.feedback[msg.id] = fb;
      await this.chat.submitFeedback(msg.id, fb);
    }
  
    renderMd(text: string): SafeHtml {
      const html = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br/>');
      return this.sanitizer.bypassSecurityTrustHtml(html);
    }
  
    trackMsg(_: number, m: Message): string { return m.id; }
  }