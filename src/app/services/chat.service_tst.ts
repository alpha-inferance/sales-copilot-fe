// src/app/services/chat.service.ts
// ─────────────────────────────────────────────────────────────
// Central state + orchestration service.
// Sends messages over WebSocket to ws://localhost:8000/ws and
// handles streaming token responses as a chatbot UI.
//
// Supported server response formats:
//   1. Full typed protocol : stream_start → token × N → stream_end
//   2. Tokens only         : token × N  (bubble auto-started on first token)
//   3. Plain text frames   : each WS frame is a raw text chunk
//   4. { content/token }   : JSON without a type field
// ─────────────────────────────────────────────────────────────

import { Injectable, OnDestroy, signal, computed } from '@angular/core';
import { firstValueFrom, Subscription } from 'rxjs';
import { ApiService }        from './api.service';
import { WebSocketService }  from './websocket.service';
import { Conversation, Deal, Message, Template } from '../model/chat.models';


@Injectable({ providedIn: 'root' })
export class ChatService implements OnDestroy {

  /** Static prompt templates shown on the welcome screen and as follow-up suggestions. */
  readonly templates: Template[] = [
    { icon: '📄', label: 'Show me recent proposal summaries',          iconBg: '#EFF6FF' },
    { icon: '📊', label: 'What case studies do we have for fintech?',  iconBg: '#F0FDF4' },
    { icon: '📑', label: 'Summarise our latest whitepaper',            iconBg: '#FFF7ED' },
    { icon: '🏆', label: 'Which proposals had the highest win rate?',  iconBg: '#FDF4FF' },
    { icon: '🔍', label: 'Find content about cloud migration',         iconBg: '#FFFBEB' },
    { icon: '💡', label: 'What are our key differentiators?',          iconBg: '#F0F9FF' },
  ];

  // ── App state signals ──────────────────────────────────────
  readonly screen        = signal<'welcome' | 'chat' | 'dealradar'>('welcome');
  readonly messages      = signal<Message[]>([]);
  readonly typing        = signal(false);          // true = waiting for first token
  readonly activeConvId  = signal<string | null>(null);
  readonly sourceMsg     = signal<Message | null>(null);
  readonly banner        = signal<{ msg: string; color: string; icon: string } | null>(null);
  readonly conversations = signal<Conversation[]>([]);
  readonly deals         = signal<Deal[]>([]);

  /** True while tokens are arriving (streaming bubble visible). */
  readonly isStreaming = computed(() => this.messages().some(m => m.streaming));

  readonly activeConvTitle = computed(() =>
    this.conversations().find(c => c.id === this.activeConvId())?.title ?? null
  );

  private wsSub?: Subscription;
  private streamingMsgId: string | null = null;
  private pollInterval?: ReturnType<typeof setInterval>;

  constructor(
    private api: ApiService,
    private ws:  WebSocketService,
  ) {
    this.initWelcome();
    this.loadConversations();
    // Subscribe to all WS messages before connecting
    this.wsSub = this.ws.messages$.subscribe(msg => this.onWsMessage(msg));
    this.ws.connect();
    // Poll conversations list every 10 seconds
    this.pollInterval = setInterval(() => this.loadConversations(), 10_000);
  }

  // ── WebSocket message handler ──────────────────────────────
  private onWsMessage(msg: any): void {
    switch (msg.type) {

      case 'session_started':
        this.activeConvId.set(msg.conversation_id);
        if (!msg.new_conversation) this.loadConversations();
        break;

      case 'chat_history': {
        const histMsgs: Message[] = (msg.messages ?? []).map((m: any) => ({
          id: this.uid(), role: m.role as 'user' | 'assistant',
          text: m.content, kind: 'answer' as const,
          sources: m.sources ?? [], timestamp: new Date(),
        }));
        this.messages.update(ms => [...ms, ...histMsgs]);
        break;
      }

      case 'stream_start': {
        // Explicit stream_start from server — switch dots → streaming bubble
        this.typing.set(false);
        this._ensureStreamingBubble(msg.sources ?? []);
        break;
      }

      case 'token': {
        // Auto-start a streaming bubble if the server never sent stream_start
        if (!this.streamingMsgId) {
          this.typing.set(false);
          this._ensureStreamingBubble([]);
        }
        // Append the chunk to the active streaming bubble
        const chunk = msg.content ?? '';
        if (chunk && this.streamingMsgId) {
          this.messages.update(ms => ms.map(m =>
            m.id === this.streamingMsgId
              ? { ...m, text: m.text + chunk }
              : m
          ));
        }
        break;
      }

      case 'stream_end':
        this._finalizeStream(msg.sources ?? []);
        this.typing.set(false);
        this.loadConversations();
        break;

      case 'conversation_title_updated':
        this.loadConversations();
        break;

      case 'error':
        this.typing.set(false);
        this._finalizeStream([]);
        this.banner.set({
          msg: msg.content ?? 'Something went wrong. Please try again.',
          color: '#D13438', icon: '⚠️',
        });
        break;

      case 'ws_closed':
        this.typing.set(false);
        this._finalizeStream([]);
        break;
    }
  }

  /**
   * Creates a new streaming assistant bubble if one doesn't already exist.
   * Returns the ID of the bubble.
   */
  private _ensureStreamingBubble(sources: string[]): void {
    if (this.streamingMsgId) return;   // already have one
    const sid = this.uid();
    this.streamingMsgId = sid;
    this.messages.update(ms => [
      ...ms,
      {
        id: sid, role: 'assistant', kind: 'answer',
        text: '', streaming: true, sources, timestamp: new Date(),
      },
    ]);
  }

  /** Finalize any in-progress streaming message (e.g. on stream_end / error / disconnect). */
  private _finalizeStream(sources: string[]): void {
    if (!this.streamingMsgId) return;
    this.messages.update(ms => ms.map(m =>
      m.id === this.streamingMsgId
        ? { ...m, streaming: false, sources: sources.length ? sources : m.sources ?? [] }
        : m
    ));
    this.streamingMsgId = null;
  }

  // ── Init ───────────────────────────────────────────────────
  private initWelcome(): void {
    this.messages.set([{
      id: this.uid(), role: 'assistant', kind: 'answer', timestamp: new Date(),
      text: "Hello! I'm your **Sales Co-Pilot**. Ask me anything about our proposals, case studies, or whitepapers — every answer is cited and grounded.\n\nWhat would you like to explore today?",
      followUps: this.templates.slice(0, 3).map(t => t.label),
    }]);
    this.typing.set(false);
    this.sourceMsg.set(null);
    this.banner.set(null);
  }

  // ── Load conversations from API ────────────────────────────
  async loadConversations(): Promise<void> {
    try {
      const data = await firstValueFrom(this.api.getConversations());
      this.conversations.set(data);
    } catch { this.conversations.set([]); }
  }

  // ── Load deals ─────────────────────────────────────────────
  async loadDeals(): Promise<void> {
    try {
      const data = await firstValueFrom(this.api.getDeals());
      this.deals.set(data);
    } catch { /* deals stay empty if API unreachable */ }
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
    this._finalizeStream([]);
    this.streamingMsgId = null;
    this.activeConvId.set(null);
    this.initWelcome();
    // Open a fresh WebSocket session (no conversationId / sessionId)
    this.ws.reset();
    this.ws.connect();
  }

  // ── Send message via WebSocket ─────────────────────────────
  sendMessage(text: string): void {
    if (!text.trim() || this.typing() || this.isStreaming()) return;

    this.banner.set(null);

    const userMsg: Message = {
      id: this.uid(), role: 'user', kind: 'answer',
      text: text.trim(), timestamp: new Date(),
    };
    this.messages.update(m => [...m, userMsg]);
    this.typing.set(true);

    // Sends: { type: "message", message: "<text>" }
    this.ws.sendChatMessage(text.trim());
  }

  // ── Helpers ────────────────────────────────────────────────
  setActiveConv(id: string): void { this.activeConvId.set(id); }
  setSourceMsg(m: Message | null): void { this.sourceMsg.set(m); }
  clearBanner():                   void { this.banner.set(null); }

  async submitFeedback(msgId: string, fb: 'helpful' | 'not_helpful'): Promise<void> {
    await firstValueFrom(this.api.submitFeedback(msgId, fb)).catch(() => {});
  }

  ngOnDestroy(): void {
    this.wsSub?.unsubscribe();
    clearInterval(this.pollInterval);
    this.ws.disconnect();
  }

  private uid(): string { return Math.random().toString(36).slice(2) + Date.now(); }
}
