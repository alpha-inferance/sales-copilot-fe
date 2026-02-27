import { Injectable, signal, computed } from '@angular/core';

import { MockDataService } from './mock-data.service';
import { Message } from '../model/chat.models';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private _messages = signal<Message[]>([]);
  private _typing = signal(false);
  private _activeConvId = signal<number>(1);
  private _sourceMsg = signal<Message | null>(null);
  private _banner = signal<{ msg: string; color: string; icon: string } | null>(null);
  private _screen = signal<'welcome' | 'chat' | 'dealradar'>('welcome');

  messages = this._messages.asReadonly();
  typing = this._typing.asReadonly();
  activeConvId = this._activeConvId.asReadonly();
  sourceMsg = this._sourceMsg.asReadonly();
  banner = this._banner.asReadonly();
  screen = this._screen.asReadonly();

  constructor(private mock: MockDataService) {
    this.resetToWelcome();
  }

  private makeId(): string {
    return Math.random().toString(36).slice(2);
  }

  resetToWelcome(): void {
    this._messages.set([{
      id: this.makeId(),
      role: 'assistant',
      text: "Hello! I'm your **Sales Co-Pilot**. Ask me anything about our proposals, case studies, or whitepapers — every answer is cited and grounded.\n\nWhat would you like to explore today?",
      followUps: this.mock.templates.slice(0, 3).map(t => t.label),
      kind: 'answer',
      timestamp: new Date()
    }]);
    this._typing.set(false);
    this._sourceMsg.set(null);
    this._banner.set(null);
  }

  navigateTo(screen: 'welcome' | 'chat' | 'dealradar'): void {
    this._screen.set(screen);
  }

  startConversation(query: string | null): void {
    this._screen.set('chat');
    this.resetToWelcome();
    if (query) {
      setTimeout(() => this.sendMessage(query), 400);
    }
  }

  newConversation(): void {
    this.resetToWelcome();
    this._banner.set(null);
  }

  setActiveConv(id: number): void {
    this._activeConvId.set(id);
  }

  setSourceMsg(msg: Message | null): void {
    this._sourceMsg.set(msg);
  }

  clearBanner(): void {
    this._banner.set(null);
  }

  submitFeedback(msgId: string, fb: 'helpful' | 'not_helpful'): Promise<void> {
    return Promise.resolve();
  }

  sendMessage(text: string): void {
    if (!text.trim() || this._typing()) return;

    this._banner.set(null);
    const userMsg: Message = {
      id: this.makeId(), role: 'user', text: text.trim(), timestamp: new Date()
    };
    this._messages.update(msgs => [...msgs, userMsg]);
    this._typing.set(true);

    const delay = 1400 + Math.random() * 600;
    setTimeout(() => {
      this._typing.set(false);
      const reply = this.mock.getMockReply(text);

      if (reply.kind === 'guardrail_input') {
        this._banner.set({ msg: 'Off-topic query blocked — I only search internal sales knowledge.', color: '#D13438', icon: '🚫' });
      }

      const assistantMsg: Message = {
        id: this.makeId(),
        role: 'assistant',
        text: reply.text,
        citations: reply.citations,
        followUps: reply.followUps,
        kind: reply.kind as any,
        timestamp: new Date()
      };
      this._messages.update(msgs => [...msgs, assistantMsg]);

      if (assistantMsg.citations?.length) {
        this._sourceMsg.set(assistantMsg);
      }
    }, delay);
  }
}