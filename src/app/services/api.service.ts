// src/app/services/api.service.ts
// ─────────────────────────────────────────────────────────────
// ALL FastAPI calls are here. To integrate your backend:
//   1. Set BASE_URL to your FastAPI server (e.g. http://localhost:8000)
//   2. Each method maps to one FastAPI endpoint
//   3. Replace mock fallbacks with real HTTP calls
// ─────────────────────────────────────────────────────────────

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ChatRequest, ChatResponse, Conversation, CorpusStats, Deal } from '../model/chat.models';

@Injectable({ providedIn: 'root' })
export class ApiService {

  // ── CHANGE THIS TO YOUR FASTAPI URL ───────────────────────
  private readonly BASE_URL = 'http://localhost:8000';
  // ──────────────────────────────────────────────────────────

  private get headers(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      // Add auth header here when ready:
      // 'Authorization': `Bearer ${localStorage.getItem('token')}`
    });
  }

  constructor(private http: HttpClient) {}

  // ── POST /api/chat ─────────────────────────────────────────
  // FastAPI endpoint: receives query + session_id + history
  // Returns: answer, citations, follow_ups, confidence, kind
  sendMessage(req: ChatRequest): Observable<ChatResponse> {
    return this.http
      .post<ChatResponse>(`${this.BASE_URL}/api/chat`, req, { headers: this.headers })
      .pipe(catchError(this.handleError));
  }

  // ── GET /api/conversations ─────────────────────────────────
  // FastAPI endpoint: returns list of past conversations for user
  getConversations(userId: string): Observable<Conversation[]> {
    return this.http
      .get<Conversation[]>(`${this.BASE_URL}/api/conversations?user_id=${userId}`, { headers: this.headers })
      .pipe(catchError(this.handleError));
  }

  // ── GET /api/conversations/{id} ────────────────────────────
  getConversationById(id: number): Observable<Conversation> {
    return this.http
      .get<Conversation>(`${this.BASE_URL}/api/conversations/${id}`, { headers: this.headers })
      .pipe(catchError(this.handleError));
  }

  // ── DELETE /api/conversations/{id} ────────────────────────
  deleteConversation(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.BASE_URL}/api/conversations/${id}`, { headers: this.headers })
      .pipe(catchError(this.handleError));
  }

  // ── GET /api/deals ─────────────────────────────────────────
  // FastAPI endpoint: returns deal radar prospects
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

  // ── GET /api/corpus/stats ──────────────────────────────────
  // FastAPI endpoint: returns corpus statistics for welcome screen
  getCorpusStats(): Observable<CorpusStats> {
    return this.http
      .get<CorpusStats>(`${this.BASE_URL}/api/corpus/stats`, { headers: this.headers })
      .pipe(catchError(this.handleError));
  }

  // ── POST /api/feedback ────────────────────────────────────
  // FastAPI endpoint: submit thumbs up/down for a message
  submitFeedback(messageId: string, feedback: 'helpful' | 'not_helpful'): Observable<void> {
    return this.http
      .post<void>(`${this.BASE_URL}/api/feedback`, { message_id: messageId, feedback }, { headers: this.headers })
      .pipe(catchError(this.handleError));
  }

  // ── Error Handler ─────────────────────────────────────────
  private handleError(error: HttpErrorResponse): Observable<never> {
    let msg = 'An unexpected error occurred.';
    if (error.status === 0) msg = 'Cannot reach the server. Is FastAPI running?';
    else if (error.status === 422) msg = 'Invalid request format sent to API.';
    else if (error.status === 500) msg = 'Server error. Check FastAPI logs.';
    else if (error.error?.detail) msg = error.error.detail;
    console.error('[ApiService]', error);
    return throwError(() => new Error(msg));
  }
}