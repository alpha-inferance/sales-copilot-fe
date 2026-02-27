// src/app/services/api.service.ts
// ─────────────────────────────────────────────────────────────
// ALL FastAPI calls are here. To integrate your backend:
//   1. Set BASE_URL to your FastAPI server (e.g. http://localhost:8000)
//   2. Each method maps to one FastAPI endpoint
// ─────────────────────────────────────────────────────────────

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ChatRequest, ChatResponse, Conversation, Deal } from '../model/chat.models';

@Injectable({ providedIn: 'root' })
export class ApiService {

  private readonly BASE_URL = 'http://localhost:8000';

  private get headers(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      // 'Authorization': `Bearer ${localStorage.getItem('token')}`
    });
  }

  constructor(private http: HttpClient) {}

  // ── POST /api/chat ─────────────────────────────────────────
  // Body:    { query, session_id, conversation_history }
  // Returns: { answer, citations, follow_ups, confidence, kind }
  sendMessage(req: ChatRequest): Observable<ChatResponse> {
    return this.http
      .post<ChatResponse>(`${this.BASE_URL}/api/chat`, req, { headers: this.headers })
      .pipe(catchError(this.handleError));
  }

  // ── GET /api/conversations ─────────────────────────────────
  // Returns: Conversation[]
  // Shape:   { id: string (UUID), title, created_at, updated_at, message_count }
  getConversations(): Observable<Conversation[]> {
    return this.http
      .get<{ conversations: Conversation[] }>(`${this.BASE_URL}/api/conversations`, { headers: this.headers })
      .pipe(map(res => res.conversations), catchError(this.handleError));
  }

  // ── GET /api/conversations/{id} ────────────────────────────
  // id: UUID string e.g. "006c3d05-77a6-4401-ba04-adf4712a1ca9"
  getConversationById(id: string): Observable<Conversation> {
    return this.http
      .get<Conversation>(`${this.BASE_URL}/api/conversations/${id}`, { headers: this.headers })
      .pipe(catchError(this.handleError));
  }

  // ── POST /api/conversations ────────────────────────────────
  // Body:    { message, conversation_id? }
  // Returns: Conversation (with UUID id assigned by API)
  createConversation(message: string, conversationId?: string): Observable<Conversation> {
    const payload = { message, ...(conversationId && { conversation_id: conversationId }) };
    return this.http
      .post<Conversation>(`${this.BASE_URL}/api/conversations`, payload, { headers: this.headers })
      .pipe(catchError(this.handleError));
  }

  // ── DELETE /api/conversations/{id} ────────────────────────
  deleteConversation(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.BASE_URL}/api/conversations/${id}`, { headers: this.headers })
      .pipe(catchError(this.handleError));
  }

  // ── GET /api/deals ─────────────────────────────────────────
  getDeals(): Observable<Deal[]> {
    return this.http
      .get<Deal[]>(`${this.BASE_URL}/api/deals`, { headers: this.headers })
      .pipe(catchError(this.handleError));
  }

  // ── GET /api/deals/{id}/pitch-brief ────────────────────────
  getPitchBrief(dealId: number): Observable<{ brief: string }> {
    return this.http
      .get<{ brief: string }>(`${this.BASE_URL}/api/deals/${dealId}/pitch-brief`, { headers: this.headers })
      .pipe(catchError(this.handleError));
  }

  // ── POST /api/feedback ─────────────────────────────────────
  submitFeedback(messageId: string, feedback: 'helpful' | 'not_helpful'): Observable<void> {
    return this.http
      .post<void>(`${this.BASE_URL}/api/feedback`, { message_id: messageId, feedback }, { headers: this.headers })
      .pipe(catchError(this.handleError));
  }

  // ── Error Handler ──────────────────────────────────────────
  private handleError(error: HttpErrorResponse): Observable<never> {
    let msg = 'An unexpected error occurred.';
    if (error.status === 0)        msg = 'Cannot reach the server. Is FastAPI running?';
    else if (error.status === 422) msg = 'Invalid request format sent to API.';
    else if (error.status === 500) msg = 'Server error. Check FastAPI logs.';
    else if (error.error?.detail)  msg = error.error.detail;
    console.error('[ApiService]', error);
    return throwError(() => new Error(msg));
  }
}