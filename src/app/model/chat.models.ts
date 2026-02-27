// src/app/models/chat.models.ts

export interface Citation {
    title: string;
    year: string;
    type: 'Case Study' | 'Proposal' | 'Whitepaper' | 'Pitch Deck';
    confidence: number;
    page: string;
    doc_url?: string;
  }
  
  export interface Message {
    id: string;
    role: 'user' | 'assistant';
    text: string;
    citations?: Citation[];
    followUps?: string[];
    kind: 'answer' | 'guardrail_input' | 'guardrail_oos' | 'loading';
    timestamp: Date;
    feedback?: 'helpful' | 'not_helpful';
  }
  
  export interface Conversation {
    id: number;
    title: string;
    time: string;
    turns: number;
    messages: Message[];
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
  
  export interface Template {
    icon: string;
    label: string;
    iconBg: string;
  }
  
  export interface ChatRequest {
    query: string;
    session_id: string;
    conversation_history: { role: string; content: string }[];
  }
  
  export interface ChatResponse {
    answer: string;
    citations: Citation[];
    follow_ups: string[];
    confidence: number;
    kind: 'answer' | 'guardrail_input' | 'guardrail_oos';
  }
  
  export interface CorpusStats {
    total_docs: number;
    accuracy: string;
    avg_response: string;
    proposals_count: number;
  }