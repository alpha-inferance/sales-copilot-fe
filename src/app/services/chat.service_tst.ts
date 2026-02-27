// src/app/services/chat.service.ts
// ─────────────────────────────────────────────────────────────
// Central state + orchestration service.
// Switch USE_MOCK = false to connect to FastAPI.
// ─────────────────────────────────────────────────────────────

import { Injectable, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService }      from './api.service';
import { MockDataService } from './mock-data.service';
import { ChatRequest, Conversation, CorpusStats, Deal, Message } from '../model/chat.models';

// ── SET TO false WHEN FASTAPI IS RUNNING ──────────────────────
const USE_MOCK = true;
// ─────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ChatService {

  // ── App state signals ──────────────────────────────────────
  readonly screen        = signal<'welcome' | 'chat' | 'dealradar'>('welcome');
  readonly messages      = signal<Message[]>([]);
  readonly typing        = signal(false);
  readonly activeConvId  = signal(1);
  readonly sourceMsg     = signal<Message | null>(null);
  readonly banner        = signal<{ msg: string; color: string; icon: string } | null>(null);
  readonly conversations = signal<Conversation[]>([]);
  readonly deals         = signal<Deal[]>([]);
  readonly stats         = signal<CorpusStats | null>(null);

  // Session ID — sent to FastAPI for multi-turn memory
  readonly sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  constructor(
    private api:  ApiService,
    private mock: MockDataService,
  ) {
    this.initWelcome();
    this.loadConversations();
    this.loadStats();
  }

  // ── Init ───────────────────────────────────────────────────
  private initWelcome(): void {
    this.messages.set([{
      id: this.uid(), role: 'assistant', kind: 'answer', timestamp: new Date(),
      text: "Hello! I'm your **Sales Co-Pilot**. Ask me anything about our proposals, case studies, or whitepapers — every answer is cited and grounded.\n\nWhat would you like to explore today?",
      followUps: this.mock.templates.slice(0, 3).map(t => t.label),
    }]);
    this.typing.set(false);
    this.sourceMsg.set(null);
    this.banner.set(null);
  }

  // ── Load conversations from API or mock ────────────────────
  async loadConversations(): Promise<void> {
    if (USE_MOCK) {
      this.conversations.set(this.mock.conversations);
      return;
    }
    try {
      const data = await firstValueFrom(this.api.getConversations('user_1'));
      this.conversations.set(data);
    } catch {
      this.conversations.set(this.mock.conversations);
    }
  }

  // ── Load corpus stats ──────────────────────────────────────
  async loadStats(): Promise<void> {
    if (USE_MOCK) {
      this.stats.set(this.mock.stats);
      return;
    }
    try {
      const data = await firstValueFrom(this.api.getCorpusStats());
      this.stats.set(data);
    } catch {
      this.stats.set(this.mock.stats);
    }
  }

  // ── Load deals ─────────────────────────────────────────────
  async loadDeals(): Promise<void> {
    if (USE_MOCK) {
      this.deals.set(this.mock.deals);
      return;
    }
    try {
      const data = await firstValueFrom(this.api.getDeals());
      this.deals.set(data);
    } catch {
      this.deals.set(this.mock.deals);
    }
  }

  // ── Navigation ─────────────────────────────────────────────
  navigateTo(s: 'welcome' | 'chat' | 'dealradar'): void {
    if (s === 'dealradar') this.loadDeals();
    this.screen.set(s);
  }

  startConversation(query: string | null): void {
    this.screen.set('chat');
    this.initWelcome();
    if (query) setTimeout(() => this.sendMessage(query), 400);
  }

  newConversation(): void {
    this.initWelcome();
    this.sessionId; // new session is already a unique value
  }

  // ── Send message ───────────────────────────────────────────
  async sendMessage(text: string): Promise<void> {
    if (!text.trim() || this.typing()) return;

    this.banner.set(null);

    // Add user message
    const userMsg: Message = {
      id: this.uid(), role: 'user', kind: 'answer',
      text: text.trim(), timestamp: new Date(),
    };
    this.messages.update(m => [...m, userMsg]);
    this.typing.set(true);

    try {
      let response;

      if (USE_MOCK) {
        // ── MOCK PATH ──────────────────────────────────────
        response = await firstValueFrom(this.mock.getMockReply(text));
      } else {
        // ── FASTAPI PATH ───────────────────────────────────
        // Build conversation history for multi-turn context
        const history = this.messages().map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.text,
        }));

        const req: ChatRequest = {
          query: text.trim(),
          session_id: this.sessionId,
          conversation_history: history,
        };
        response = await firstValueFrom(this.api.sendMessage(req));
      }

      this.typing.set(false);

      // Show banner for guardrails
      if (response.kind === 'guardrail_input') {
        this.banner.set({ msg: 'Off-topic query blocked — I only search internal sales knowledge.', color: '#D13438', icon: '🚫' });
      }

      const botMsg: Message = {
        id: this.uid(), role: 'assistant',
        text: response.answer,
        citations: response.citations,
        followUps: response.follow_ups,
        kind: response.kind,
        timestamp: new Date(),
      };
      this.messages.update(m => [...m, botMsg]);

      if (botMsg.citations?.length) this.sourceMsg.set(botMsg);

    } catch (err: any) {
      this.typing.set(false);
      this.banner.set({
        msg: err?.message ?? 'Something went wrong. Please try again.',
        color: '#D13438', icon: '⚠️',
      });
    }
  }

  // ── Helpers ────────────────────────────────────────────────
  setActiveConv(id: number):            void { this.activeConvId.set(id); }
  setSourceMsg(m: Message | null):      void { this.sourceMsg.set(m); }
  clearBanner():                        void { this.banner.set(null); }

  async submitFeedback(msgId: string, fb: 'helpful' | 'not_helpful'): Promise<void> {
    if (!USE_MOCK) {
      await firstValueFrom(this.api.submitFeedback(msgId, fb)).catch(() => {});
    }
  }

  private uid(): string { return Math.random().toString(36).slice(2) + Date.now(); }
}