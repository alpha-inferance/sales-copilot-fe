// src/app/services/websocket.service.ts
// Manages the WebSocket connection to ws://localhost:8000/ws
// Sends messages as { type: "message", message: "..." }
// Handles streaming responses: typed protocol, plain JSON, or raw text chunks.

import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WebSocketService {
  private readonly WS_URL = 'ws://localhost:8000/ws';

  private ws: WebSocket | null = null;
  private pendingMessages: string[] = [];

  // All normalised messages from the server are pushed here
  private messageSubject = new Subject<any>();
  readonly messages$ = this.messageSubject.asObservable();

  // Persisted across reconnects
  sessionId: string | null = null;
  conversationId: string | null = null;

  connect(): void {
    if (
      this.ws?.readyState === WebSocket.OPEN ||
      this.ws?.readyState === WebSocket.CONNECTING
    ) return;

    const params: string[] = [];
    if (this.sessionId)      params.push(`session_id=${this.sessionId}`);
    if (this.conversationId) params.push(`conversation_id=${this.conversationId}`);
    const url = params.length ? `${this.WS_URL}?${params.join('&')}` : this.WS_URL;

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log('[WS] Connected to', this.WS_URL);
      for (const msg of this.pendingMessages) {
        this.ws!.send(msg);
      }
      this.pendingMessages = [];
    };

    this.ws.onmessage = (event) => {
      const raw = event.data as string;

      try {
        const msg = JSON.parse(raw);

        // Capture session / conversation IDs from the server
        if (msg.type === 'session_started') {
          this.sessionId      = msg.session_id;
          this.conversationId = msg.conversation_id;
          this.messageSubject.next(msg);
          return;
        }

        // Typed protocol already used by the server → pass through as-is
        if (msg.type) {
          this.messageSubject.next(msg);
          return;
        }

        // Server sends { content: '...' } or { token: '...' } without a type →
        // normalise to a token event so the chat service can handle it uniformly
        const chunk = msg.content ?? msg.token ?? msg.text ?? msg.delta ?? null;
        if (chunk !== null && chunk !== undefined) {
          // If the server signals end-of-stream with done / finished flags
          if (msg.done === true || msg.finished === true) {
            this.messageSubject.next({ type: 'stream_end', sources: msg.sources ?? [] });
          } else {
            this.messageSubject.next({ type: 'token', content: String(chunk) });
          }
          return;
        }

        // Fallback: re-emit as-is and let the consumer decide
        this.messageSubject.next(msg);

      } catch {
        // Non-JSON frame → treat every non-empty raw text line as a streaming token
        const trimmed = raw.trim();
        if (trimmed) {
          this.messageSubject.next({ type: 'token', content: trimmed });
        }
      }
    };

    this.ws.onerror = (err) => {
      console.error('[WS] Error', err);
      this.messageSubject.next({ type: 'error', content: 'WebSocket connection error' });
    };

    this.ws.onclose = (ev) => {
      console.log('[WS] Closed', ev.code, ev.reason);
      this.messageSubject.next({ type: 'ws_closed' });
    };
  }

  /**
   * Send a chat message to the server.
   * Format: { type: "message", message: "<user input>" }
   */
  sendChatMessage(message: string): void {
    const payload = JSON.stringify({ type: 'chat', message });
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(payload);
    } else {
      this.pendingMessages.push(payload);
      this.connect();
    }
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
    this.pendingMessages = [];
  }

  /** Reset session state and disconnect (call before starting a new conversation). */
  reset(): void {
    this.disconnect();
    this.sessionId      = null;
    this.conversationId = null;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
