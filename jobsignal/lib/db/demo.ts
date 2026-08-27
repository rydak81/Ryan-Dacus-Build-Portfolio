/**
 * In-memory demo store. Active when Supabase env vars are absent — seeds
 * realistic data and runs the real scoring + matching engines over it, so
 * the product demos end-to-end with zero external setup.
 */

import type {
  Application,
  ApplicationStatus,
  Company,
  Contact,
  Job,
  JobDuplicate,
  JobEvent,
  JobScore,
  JobVerification,
  UserFeedback,
  UserProfile,
} from '@/lib/types';
import { DEFAULT_WEIGHTS, type SignalWeight } from '@/lib/config/scoring';
import { scoreJob, toJobScore } from '@/lib/scoring/engine';
import { buildFacts } from '@/lib/scoring/facts';
import { matchJob } from '@/lib/match/engine';
import { daysAgo } from '@/lib/utils';
import {
  DEMO_USER_ID,
  demoProfile,
  seedCompanies,
  seedContacts,
  seedEvents,
  seedJobs,
  seedVerifications,
} from './seed-data';
import type { JobBundle, JobFilter, JobSignalStore, JobWithIntel } from './store';

interface DemoState {
  companies: Map<string, Company>;
  jobs: Map<string, Job>;
  verifications: JobVerification[];
  events: JobEvent[];
  scores: Map<string, JobScore>;
  duplicates: JobDuplicate[];
  contacts: Contact[];
  profiles: Map<string, UserProfile>;
  applications: Map<string, Application>;
  feedback: UserFeedback[];
}

function initState(): DemoState {
  const state: DemoState = {
    companies: new Map(seedCompanies.map((c) => [c.id, c])),
    jobs: new Map(seedJobs.map((j) => [j.id, j])),
    verifications: [...seedVerifications],
    events: [...seedEvents],
    scores: new Map(),
    duplicates: [],
    contacts: [...seedContacts],
    profiles: new Map([[DEMO_USER_ID, demoProfile]]),
    applications: new Map(),
    feedback: [],
  };
  recomputeScores(state);
  return state;
}

function recomputeScores(state: DemoState): void {
  const now = new Date();
  for (const job of state.jobs.values()) {
    const company = state.companies.get(job.company_id);
    if (!company) continue;
    const verifications = state.verifications.filter((v) => v.job_id === job.id);
    const duplicates = state.duplicates.filter(
      (d) => d.canonical_job_id === job.id || d.duplicate_job_id === job.id,
    );
    const companyJobs = [...state.jobs.values()].filter((j) => j.company_id === job.company_id);
    const facts = buildFacts({ job, company, verifications, duplicates, companyJobs, now });
    const engine = scoreJob(facts);
    const profile = state.profiles.get(DEMO_USER_ID);
    const match = profile ? matchJob(profile, job) : null;
    state.scores.set(job.id, toJobScore(job.id, engine, match?.score ?? null, now));
  }
}

// Survive dev-server module reloads.
const g = globalThis as typeof globalThis & { __jobsignalDemo?: DemoState };
function state(): DemoState {
  if (!g.__jobsignalDemo) g.__jobsignalDemo = initState();
  return g.__jobsignalDemo;
}

function intel(s: DemoState, job: Job): JobWithIntel {
  const dupes = s.duplicates.filter((d) => d.canonical_job_id === job.id);
  return {
    job,
    company: s.companies.get(job.company_id)!,
    score: s.scores.get(job.id) ?? null,
    duplicateCount: dupes.length,
    sources: [job.source, ...dupes.map((d) => s.jobs.get(d.duplicate_job_id)?.source ?? '')].filter(
      (v, i, arr) => v && arr.indexOf(v) === i,
    ),
  };
}

function applyFilter(items: JobWithIntel[], f?: JobFilter): JobWithIntel[] {
  if (!f) return items;
  return items.filter(({ job, company, score }) => {
    if (f.companyId && job.company_id !== f.companyId) return false;
    if (f.query) {
      const q = f.query.toLowerCase();
      const haystack = `${job.title} ${company.name} ${job.description}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (f.location) {
      const loc = (job.location ?? '').toLowerCase();
      if (!loc.includes(f.location.toLowerCase())) return false;
    }
    if (f.remote && !(job.location ?? '').toLowerCase().includes('remote')) return false;
    if (f.minConfidence !== undefined && (score?.overall_score ?? 0) < f.minConfidence) return false;
    if (f.minMatch !== undefined && (score?.match_score ?? 0) < f.minMatch) return false;
    if (f.verifiedWithinHours !== undefined) {
      if (!job.last_verified_at) return false;
      const hours = (Date.now() - new Date(job.last_verified_at).getTime()) / 3_600_000;
      if (hours > f.verifiedWithinHours) return false;
    }
    if (f.minSalary !== undefined && (job.salary_max ?? 0) < f.minSalary) return false;
    if (f.maxAgeDays !== undefined && daysAgo(job.first_seen_at) > f.maxAgeDays) return false;
    if (f.source && job.source !== f.source) return false;
    if (f.status && job.status !== f.status) return false;
    return true;
  });
}

export class DemoStore implements JobSignalStore {
  async listCompanies(): Promise<Company[]> {
    return [...state().companies.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  async getCompany(id: string): Promise<Company | null> {
    return state().companies.get(id) ?? null;
  }

  async getCompanyJobs(companyId: string): Promise<JobWithIntel[]> {
    const s = state();
    return [...s.jobs.values()].filter((j) => j.company_id === companyId).map((j) => intel(s, j));
  }

  async upsertCompany(company: Omit<Company, 'id' | 'created_at'> & { id?: string }): Promise<Company> {
    const s = state();
    const existing = [...s.companies.values()].find((c) => c.name === company.name);
    if (existing) return existing;
    const created: Company = {
      ...company,
      id: company.id ?? crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    s.companies.set(created.id, created);
    return created;
  }

  async listJobs(filter?: JobFilter): Promise<JobWithIntel[]> {
    const s = state();
    // Duplicates fold into their canonical job — one job, not five.
    const duplicateIds = new Set(s.duplicates.map((d) => d.duplicate_job_id));
    const items = [...s.jobs.values()]
      .filter((j) => !duplicateIds.has(j.id))
      .map((j) => intel(s, j));
    return applyFilter(items, filter).sort(
      (a, b) => (b.score?.overall_score ?? 0) - (a.score?.overall_score ?? 0),
    );
  }

  async getJob(id: string): Promise<JobBundle | null> {
    const s = state();
    const job = s.jobs.get(id);
    if (!job) return null;
    return {
      ...intel(s, job),
      verifications: s.verifications
        .filter((v) => v.job_id === id)
        .sort((a, b) => new Date(b.checked_at).getTime() - new Date(a.checked_at).getTime()),
      events: s.events
        .filter((e) => e.job_id === id)
        .sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime()),
      duplicates: s.duplicates.filter((d) => d.canonical_job_id === id || d.duplicate_job_id === id),
      contacts: s.contacts.filter((c) => c.company_id === job.company_id),
    };
  }

  async findJobByExternalId(companyId: string, source: string, externalId: string): Promise<Job | null> {
    return (
      [...state().jobs.values()].find(
        (j) => j.company_id === companyId && j.source === source && j.external_job_id === externalId,
      ) ?? null
    );
  }

  async findJobByUrl(url: string): Promise<JobBundle | null> {
    const job = [...state().jobs.values()].find(
      (j) => j.source_url === url || j.application_url === url,
    );
    return job ? this.getJob(job.id) : null;
  }

  async saveJob(job: Job): Promise<void> {
    state().jobs.set(job.id, job);
    recomputeScores(state());
  }

  async insertVerification(v: Omit<JobVerification, 'id'>): Promise<void> {
    const s = state();
    s.verifications.push({ ...v, id: crypto.randomUUID() });
    const job = s.jobs.get(v.job_id);
    if (job) s.jobs.set(job.id, { ...job, last_verified_at: v.checked_at });
    recomputeScores(s);
  }

  async insertEvents(
    jobId: string,
    events: Array<Pick<JobEvent, 'kind' | 'detail'>>,
    occurredAt: string,
  ): Promise<void> {
    const s = state();
    for (const e of events) {
      s.events.push({ id: crypto.randomUUID(), job_id: jobId, occurred_at: occurredAt, ...e });
    }
  }

  async saveScore(score: JobScore): Promise<void> {
    state().scores.set(score.job_id, score);
  }

  async saveDuplicates(duplicates: JobDuplicate[]): Promise<void> {
    const s = state();
    for (const d of duplicates) {
      const exists = s.duplicates.some(
        (x) => x.canonical_job_id === d.canonical_job_id && x.duplicate_job_id === d.duplicate_job_id,
      );
      if (!exists) s.duplicates.push(d);
    }
  }

  async getScoringWeights(): Promise<SignalWeight[]> {
    return DEFAULT_WEIGHTS;
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    return state().profiles.get(userId) ?? null;
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    state().profiles.set(profile.user_id, profile);
    recomputeScores(state());
  }

  async listApplications(userId: string): Promise<Array<Application & { intel: JobWithIntel | null }>> {
    const s = state();
    return [...s.applications.values()]
      .filter((a) => a.user_id === userId)
      .map((a) => {
        const job = s.jobs.get(a.job_id);
        return { ...a, intel: job ? intel(s, job) : null };
      });
  }

  async getApplication(userId: string, jobId: string): Promise<Application | null> {
    return state().applications.get(`${userId}:${jobId}`) ?? null;
  }

  async upsertApplication(
    userId: string,
    jobId: string,
    status: ApplicationStatus,
    notes?: string,
  ): Promise<Application> {
    const s = state();
    const key = `${userId}:${jobId}`;
    const existing = s.applications.get(key);
    const app: Application = {
      id: existing?.id ?? crypto.randomUUID(),
      user_id: userId,
      job_id: jobId,
      status,
      applied_at:
        status === 'applied' ? (existing?.applied_at ?? new Date().toISOString()) : (existing?.applied_at ?? null),
      application_method: existing?.application_method ?? null,
      notes: notes ?? existing?.notes ?? null,
      last_followup_at: status === 'followup' ? new Date().toISOString() : (existing?.last_followup_at ?? null),
      created_at: existing?.created_at ?? new Date().toISOString(),
    };
    s.applications.set(key, app);
    return app;
  }

  async listContacts(companyId: string): Promise<Contact[]> {
    return state().contacts.filter((c) => c.company_id === companyId);
  }

  async insertFeedback(feedback: Omit<UserFeedback, 'id' | 'created_at'>): Promise<void> {
    state().feedback.push({
      ...feedback,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    });
  }
}
