/**
 * AI tasks: explanation, outreach drafting, resume skill extraction.
 * Each degrades gracefully to a deterministic fallback when no provider
 * is configured, so the product never breaks without an API key.
 */

import { getAiClient } from './provider';
import type { Contact, Job, JobScore, MatchResult, UserProfile } from '@/lib/types';
import { confidenceLabel } from '@/lib/config/scoring';

export async function explainScore(job: Job, score: JobScore, companyName: string): Promise<string> {
  const band = confidenceLabel(score.overall_score);
  const breakdown = score.signals
    .map((s) => `${s.points > 0 ? '+' : ''}${s.points} ${s.label}`)
    .join('\n');

  const fallback = `${band.label} (${score.overall_score}/100). ${
    score.signals.filter((s) => s.points > 0).length
  } positive and ${score.signals.filter((s) => s.points < 0).length} negative signals observed.`;

  const ai = getAiClient();
  if (!ai) return fallback;
  try {
    return await ai.complete({
      system:
        'You summarize job-listing verification signals for job seekers. You must only restate the provided signals — never invent facts, dates, or numbers not present in the input. Be candid and concise (2-3 sentences).',
      prompt: `Job: ${job.title} at ${companyName}\nConfidence score: ${score.overall_score}/100 (${band.label})\nSignal breakdown:\n${breakdown}\n\nWrite a plain-language summary of why this job received this score.`,
      maxTokens: 300,
    });
  } catch {
    return fallback;
  }
}

export type OutreachTone = 'direct' | 'conversational' | 'executive' | 'recruiter' | 'networking';

export async function generateOutreach(opts: {
  profile: UserProfile;
  job: Job;
  companyName: string;
  contact: Contact;
  match: MatchResult;
  tone: OutreachTone;
}): Promise<string> {
  const { profile, job, companyName, contact, match, tone } = opts;
  const ai = getAiClient();
  if (!ai) {
    return `${contact.name.split(' ')[0]} — I noticed the ${job.title} role at ${companyName} and wanted to reach out directly rather than only applying through the ATS. My background: ${profile.current_title ?? 'experienced professional'}${
      match.strong_matches[0] ? `, with ${match.strong_matches[0].toLowerCase()}` : ''
    }. I'd welcome a short conversation about what success in this role looks like.`;
  }
  return ai.complete({
    system: `You write concise, specific job-search outreach messages. Rules: never use filler like "I hope this message finds you well"; open with the contact's first name; reference the specific role and the candidate's strongest genuine overlap; 60-110 words; end with a low-pressure ask. Tone: ${tone}. Never fabricate experience the candidate does not have.`,
    prompt: `Contact: ${contact.name}, ${contact.title} at ${companyName} (${contact.relationship_type})
Role: ${job.title} — ${job.location ?? 'location unspecified'}
Candidate: ${profile.current_title ?? 'not specified'}, ${profile.years_experience ?? '?'} years experience
Candidate skills: ${profile.skills.join(', ') || 'not specified'}
Strongest overlaps with this role: ${match.strong_matches.join('; ') || 'none identified'}
Gaps to avoid overclaiming: ${match.weak_or_missing.join('; ') || 'none identified'}

Write the outreach message. Message only, no subject line, no commentary.`,
    maxTokens: 400,
  });
}

export async function extractSkillsFromResume(resumeText: string): Promise<string[]> {
  const deterministic = deterministicSkillScan(resumeText);
  const ai = getAiClient();
  if (!ai) return deterministic;
  try {
    const raw = await ai.complete({
      system:
        'Extract professional skills from resume text. Return ONLY a JSON array of short skill strings (max 25), no prose, no markdown fences. Only include skills actually evidenced in the text.',
      prompt: resumeText.slice(0, 12_000),
      maxTokens: 600,
    });
    const parsed = JSON.parse(raw.replace(/^```(json)?|```$/g, '').trim()) as unknown;
    if (Array.isArray(parsed) && parsed.every((s) => typeof s === 'string')) {
      return [...new Set([...parsed, ...deterministic])].slice(0, 30);
    }
    return deterministic;
  } catch {
    return deterministic;
  }
}

const KNOWN_SKILLS = [
  'partnerships', 'business development', 'saas', 'e-commerce', 'marketplace',
  'sales', 'account management', 'channel', 'enterprise', 'negotiation',
  'go-to-market', 'revenue operations', 'crm', 'salesforce', 'hubspot',
  'python', 'sql', 'javascript', 'typescript', 'react', 'next.js', 'supabase',
  'data analysis', 'forecasting', 'amazon', 'retail', 'logistics', 'api',
  'project management', 'product management', 'customer success', 'marketing',
];

function deterministicSkillScan(text: string): string[] {
  const lower = text.toLowerCase();
  return KNOWN_SKILLS.filter((s) => lower.includes(s));
}
