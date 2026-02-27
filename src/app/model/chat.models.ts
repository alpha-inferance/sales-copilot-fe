// src/app/model/chat.models.ts

export interface Conversation {
  id: string;            // UUID from API e.g. "006c3d05-77a6-4401-ba04-adf4712a1ca9"
  title: string;
  created_at: string;    // ISO timestamp e.g. "2026-02-27T15:46:13.065668"
  updated_at: string;    // ISO timestamp
  message_count: number; // e.g. 0
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  kind?: 'answer' | 'guardrail_input' | 'guardrail_oos';
  citations?: Citation[];
  followUps?: string[];
  sources?: string[];    // raw source filenames from WebSocket stream
  streaming?: boolean;   // true while token stream is in progress
  timestamp?: Date;
}

export interface ChatRequest {
  query: string;
  session_id: string;
  conversation_history: { role: 'user' | 'assistant'; content: string }[];
}

export interface Citation {
  title: string;
  year: string;
  type: string;
  confidence: number;
  page: string;
}

export interface ChatResponse {
  answer: string;
  citations: Citation[];
  follow_ups: string[];
  confidence: number;
  kind: 'answer' | 'guardrail_input' | 'guardrail_oos';
}

export interface Template {
  icon: string;
  label: string;
  iconBg: string;
}

export interface Deal {
  id: number;
  name: string;
  industry: string;
  size: string;
  score: number;
  docs: string[];
  tags: string[];
  brief: string;
}

