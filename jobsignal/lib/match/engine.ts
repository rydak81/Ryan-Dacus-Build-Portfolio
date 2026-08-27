/**
 * Candidate Match scoring — deterministic keyword/criteria matching between
 * a user profile and a job. Kept strictly separate from Job Confidence:
 * "94% match, 29% confidence" is a first-class product state.
 *
 * AI may later rewrite the explanation prose, but never the number.
 */

import type { Job, MatchResult, UserProfile } from '@/lib/types';
import { normalizeTitle } from '@/lib/utils';

const SENIORITY_LADDER = [
  'intern', 'junior', 'associate', 'mid', 'senior', 'lead', 'manager',
  'director', 'vice president', 'svp', 'evp', 'c-level',
];

export function matchJob(profile: UserProfile, job: Job): MatchResult {
  const strong: string[] = [];
  const weak: string[] = [];
  let points = 0;
  let possible = 0;

  const jobText = `${job.title} ${job.description}`.toLowerCase();
  const jobTitle = normalizeTitle(job.title);

  // Title alignment (up to 30)
  possible += 30;
  const titleHit = profile.desired_titles.find((t) => {
    const nt = normalizeTitle(t);
    return jobTitle.includes(nt) || nt.includes(jobTitle) || overlapWords(nt, jobTitle) >= 2;
  });
  if (titleHit) {
    points += 30;
    strong.push(`Title aligns with target role “${titleHit}”`);
  } else if (
    profile.current_title &&
    overlapWords(normalizeTitle(profile.current_title), jobTitle) >= 1
  ) {
    points += 15;
    weak.push('Title partially overlaps your current role but is not a listed target');
  } else {
    weak.push('Title does not match your target roles');
  }

  // Skills coverage (up to 40)
  const skills = profile.skills.filter(Boolean);
  if (skills.length > 0) {
    possible += 40;
    const hits = skills.filter((s) => jobText.includes(s.toLowerCase()));
    points += Math.round((hits.length / skills.length) * 40);
    hits.slice(0, 6).forEach((s) => strong.push(`${s} experience matches the description`));
    const misses = requirementGaps(jobText, skills);
    misses.slice(0, 4).forEach((m) => weak.push(m));
  }

  // Seniority (up to 10)
  possible += 10;
  const jobLevel = detectSeniority(jobTitle);
  const userLevel = profile.seniority ? detectSeniority(profile.seniority.toLowerCase()) : null;
  if (jobLevel !== null && userLevel !== null) {
    const gap = Math.abs(jobLevel - userLevel);
    if (gap === 0) {
      points += 10;
      strong.push('Seniority level matches');
    } else if (gap === 1) {
      points += 6;
    } else {
      weak.push(jobLevel > userLevel ? 'Role is more senior than your stated level' : 'Role is more junior than your stated level');
    }
  } else {
    points += 5; // no evidence either way
  }

  // Location / remote (up to 10)
  possible += 10;
  const loc = (job.location ?? '').toLowerCase();
  const isRemote = loc.includes('remote');
  if (profile.remote_preference === 'remote' && isRemote) {
    points += 10;
    strong.push('Remote role matches your remote preference');
  } else if (
    profile.preferred_locations.some((l) => loc.includes(l.toLowerCase()))
  ) {
    points += 10;
    strong.push('Location matches your preferences');
  } else if (profile.remote_preference === 'flexible' || isRemote) {
    points += 6;
  } else {
    weak.push(`Location “${job.location ?? 'unspecified'}” is outside your preferred locations`);
  }

  // Compensation (up to 10)
  possible += 10;
  if (profile.salary_min && job.salary_max) {
    if (job.salary_max >= profile.salary_min) {
      points += 10;
      strong.push('Compensation range meets your minimum');
    } else {
      weak.push('Posted salary range is below your minimum');
    }
  } else {
    points += 5; // unknown — neutral
  }

  const score = possible === 0 ? 0 : Math.max(0, Math.min(100, Math.round((points / possible) * 100)));

  return {
    score,
    strong_matches: dedupe(strong),
    weak_or_missing: dedupe(weak),
    explanation: null,
  };
}

/** Common hard requirements the candidate's skill list doesn't cover. */
const REQUIREMENT_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /salesforce/i, label: 'Position requests Salesforce ecosystem experience' },
  { pattern: /cybersecurity|security clearance/i, label: 'Position references security/cybersecurity experience' },
  { pattern: /\bphd\b/i, label: 'Position requests a PhD' },
  { pattern: /machine learning|\bml\b/i, label: 'Position references machine learning experience' },
  { pattern: /\bsql\b/i, label: 'Position requests SQL proficiency' },
  { pattern: /\bkubernetes\b/i, label: 'Position references Kubernetes experience' },
];

function requirementGaps(jobText: string, skills: string[]): string[] {
  const covered = skills.map((s) => s.toLowerCase());
  return REQUIREMENT_PATTERNS.filter(
    ({ pattern }) => pattern.test(jobText) && !covered.some((s) => pattern.test(s)),
  ).map(({ label }) => label);
}

function detectSeniority(text: string): number | null {
  for (let i = SENIORITY_LADDER.length - 1; i >= 0; i--) {
    if (text.includes(SENIORITY_LADDER[i])) return i;
  }
  if (/\bvp\b/.test(text)) return SENIORITY_LADDER.indexOf('vice president');
  if (/head of/.test(text)) return SENIORITY_LADDER.indexOf('director');
  return null;
}

function overlapWords(a: string, b: string): number {
  const wa = new Set(a.split(' ').filter((w) => w.length > 3));
  let n = 0;
  for (const w of b.split(' ')) if (wa.has(w)) n++;
  return n;
}

function dedupe(items: string[]): string[] {
  return [...new Set(items)];
}
