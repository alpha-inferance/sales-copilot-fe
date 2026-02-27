// src/app/services/mock-data.service.ts
// ─────────────────────────────────────────────────────────────
// Used only until FastAPI backend is connected.
// Once backend is live, chat.service.ts switches to api.service.ts
// ─────────────────────────────────────────────────────────────

import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { ChatResponse, Citation, Conversation, CorpusStats, Deal, Template } from '../model/chat.models';

@Injectable({ providedIn: 'root' })
export class MockDataService {

  readonly templates: Template[] = [
    { icon: '🏭', label: 'Find similar manufacturing engagements for a new prospect', iconBg: '#EFF6FC' },
    { icon: '📊', label: 'Pull quantified outcomes from past case studies for a deck', iconBg: '#F3F9FD' },
    { icon: '🌿', label: 'Generate ESG conversation starters from whitepapers',         iconBg: '#DFF6DD' },
    { icon: '⚔️', label: 'Surface competitive differentiators used in winning bids',    iconBg: '#FFF4CE' },
    { icon: '🗺️', label: 'Find regional experience for South India manufacturing pitch', iconBg: '#F4ECF7' },
    { icon: '📋', label: 'Summarise our strongest proposal for a ₹100–200 Cr client',   iconBg: '#EFF6FC' },
  ];

  readonly workItems    = ['Manufacturing & OEM','ESG Proposals','South India Clients','Competitive Bids','MES Digitization'];
  readonly generalItems = ['Whitepapers','Case Studies','Pitch Decks'];
  readonly corpusItems  = ['Proposals 2023','Proposals 2022','Proposals 2021'];

  // ── Mock Conversations ─────────────────────────────────────
  readonly conversations: Conversation[] = [
    { id: 1, title: 'Manufacturing Digital Transformation', time: '2h ago',    turns: 4, messages: [] },
    { id: 2, title: 'ESG & Sustainability Whitepapers',     time: 'Yesterday', turns: 2, messages: [] },
    { id: 3, title: 'South India Market Experience',        time: '2 days ago',turns: 3, messages: [] },
    { id: 4, title: 'Competitive Differentiators Pitch',    time: 'Last week', turns: 5, messages: [] },
  ];

  // ── Mock Deals ─────────────────────────────────────────────
  readonly deals: Deal[] = [
    {
      id: 1, name: 'Tata AutoComp', industry: 'Automotive', size: '₹180Cr', score: 92,
      docs: [
        'Case Study: Smart Factory – Automotive OEM (2023)',
        'Proposal – Tier-1 Auto Supplier (2022)',
        'Whitepaper: MFG Digitalization Framework',
      ],
      tags: ['MES','SCADA','IoT'],
      brief: 'Strong match on MES integration and OEE outcomes. Use Smart Factory case study to open the conversation. Differentiator: outcome-based pricing tied to OEE milestones.',
    },
    {
      id: 2, name: 'Mahindra Agri', industry: 'Agriculture', size: '₹90Cr', score: 67,
      docs: [
        'Case Study: Energy Optimisation (2022)',
        'Whitepaper: Digital Enablement for ESG Compliance',
      ],
      tags: ['ESG','Energy','Analytics'],
      brief: 'Moderate match via ESG and energy optimisation. Lead with sustainability credentials. Recommend ESG whitepaper as a leave-behind.',
    },
    {
      id: 3, name: 'Reliance Infra', industry: 'Infrastructure', size: '₹250Cr', score: 41,
      docs: ['Proposal – Mid-Market Manufacturing Client (2023)'],
      tags: ['Digital Transformation'],
      brief: 'Low match — limited specific infrastructure experience in corpus. Recommend uploading relevant assets before the pitch.',
    },
  ];

  // ── Mock Stats ─────────────────────────────────────────────
  readonly stats: CorpusStats = {
    total_docs: 142, accuracy: '98%', avg_response: '<3s', proposals_count: 47
  };

  // ── Citations ──────────────────────────────────────────────
  private mfgCitations: Citation[] = [
    { title: 'Case Study: Smart Factory – Automotive OEM', year: '2023', type: 'Case Study',  confidence: 94, page: 'pp. 4–7' },
    { title: 'Proposal – FMCG Manufacturer',               year: '2021', type: 'Proposal',    confidence: 88, page: 'Section 3.2' },
    { title: 'Whitepaper: MFG Digitalization Framework',   year: '2023', type: 'Whitepaper',  confidence: 81, page: 'pp. 12–15' },
  ];
  private esgCitations: Citation[] = [
    { title: 'Whitepaper: Digital Enablement for ESG Compliance', year: '2023', type: 'Whitepaper', confidence: 96, page: 'pp. 2–9' },
    { title: 'Case Study: Energy Optimisation Programme',         year: '2022', type: 'Case Study',  confidence: 89, page: 'pp. 1–5' },
  ];
  private diffCitations: Citation[] = [
    { title: 'Proposal – Competitive Positioning (Multiple Sources)', year: '2022–23', type: 'Proposal', confidence: 91, page: 'Section 4' },
    { title: 'Proposal – Tier-1 Auto Supplier',                       year: '2022',    type: 'Proposal', confidence: 85, page: 'pp. 8–11' },
  ];

  // ── Mock Reply (simulates FastAPI response shape) ──────────
  getMockReply(query: string): Observable<ChatResponse> {
    const q = query.toLowerCase();
    const guardrailWords = ['poem','weather','joke','recipe','news','stock','movie','song','cricket','football','write me','tell me a story'];
    const oosWords       = ['aerospace','shipping','mining','retail','banking','hospital'];

    let response: ChatResponse;

    if (guardrailWords.some(w => q.includes(w))) {
      response = {
        answer: "I'm scoped to internal sales knowledge only — proposals, case studies, and whitepapers. I can't help with that.\n\nTry asking about past engagements or client outcomes.",
        citations: [], follow_ups: this.templates.slice(0,2).map(t => t.label),
        confidence: 0, kind: 'guardrail_input',
      };
    } else if (oosWords.some(w => q.includes(w))) {
      const word = oosWords.find(w => q.includes(w))!;
      response = {
        answer: `I searched our full knowledge base and found **no documents** matching "${word}". I won't fabricate an answer.\n\nIf relevant assets exist, please ask the knowledge management team to upload them.`,
        citations: [], follow_ups: ['Show manufacturing experience instead','What industries do we have strong case studies in?'],
        confidence: 0, kind: 'guardrail_oos',
      };
    } else if (q.includes('esg') || q.includes('sustain')) {
      response = {
        answer: "Yes — we have **2 directly relevant assets** for ESG conversations:\n\n**Whitepaper: Digital Enablement for ESG Compliance (2023)**\nScope 1/2/3 tracking, digital ESG reporting, IoT-driven energy optimisation.\n\n**Case Study: Energy Optimisation Programme (2022)**\nDeployed across 3 plants → **28% energy reduction** and full ESG audit readiness.",
        citations: this.esgCitations, follow_ups: ['What ESG metrics can we demonstrate?','Which clients asked about ESG?','Show full energy case study'],
        confidence: 92, kind: 'answer',
      };
    } else if (q.includes('differentiator') || q.includes('competi')) {
      response = {
        answer: "Across **12 competitive proposals**, our top differentiators were:\n\n**1. Domain Accelerators** — Pre-built MES connectors that cut go-live time by 40%.\n**2. Regional Delivery** — Proven South India cluster experience.\n**3. Outcome-Based Pricing** — Milestone-linked fees tied to OEE gains.\n**4. CoE Model** — 80+ specialists cited in 8 of 12 winning proposals.",
        citations: this.diffCitations, follow_ups: ['Best differentiators vs SAP?','Show outcome-based pricing example','Our win rate in manufacturing?'],
        confidence: 88, kind: 'answer',
      };
    } else {
      response = {
        answer: "Based on **3 highly relevant engagements**, here's what we've delivered in manufacturing digital transformation:\n\n**Smart Factory – Automotive OEM (2023)**\nEnd-to-end MES integration across 6 plants → **18% OEE improvement**, ₹12 Cr annual savings in 9 months.\n\n**FMCG Manufacturer Digitalization (2021)**\nSCADA + predictive maintenance → downtime **↓34%**, throughput **↑22%**.\n\n**Tamil Nadu Automotive Cluster (2022)**\nFull IoT + MES deployment — our first South India cluster engagement.",
        citations: this.mfgCitations, follow_ups: ['Narrow to 2023 only','Show team size & timeline','Similar work in pharma?'],
        confidence: 91, kind: 'answer',
      };
    }
    return of(response).pipe(delay(1400 + Math.random() * 500));
  }
}