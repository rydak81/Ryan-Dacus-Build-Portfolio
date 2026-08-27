/**
 * Supabase-backed store. Server-side only — uses the service-role client
 * for pipeline writes; user-scoped reads/writes are still protected by
 * RLS when accessed through the user's session client in server actions.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
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
import { daysAgo } from '@/lib/utils';
import type { JobBundle, JobFilter, JobSignalStore, JobWithIntel } from './store';

export class SupabaseStore implements JobSignalStore {
  private db: SupabaseClient;

  constructor(url: string, serviceRoleKey: string) {
    this.db = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
  }

  async listCompanies(): Promise<Company[]> {
    const { data, error } = await this.db.from('companies').select('*').order('name');
    if (error) throw error;
    return data as Company[];
  }

  async getCompany(id: string): Promise<Company | null> {
    const { data } = await this.db.from('companies').select('*').eq('id', id).maybeSingle();
    return (data as Company) ?? null;
  }

  async getCompanyJobs(companyId: string): Promise<JobWithIntel[]> {
    return this.listJobs({ companyId });
  }

  async upsertCompany(company: Omit<Company, 'id' | 'created_at'> & { id?: string }): Promise<Company> {
    const { data, error } = await this.db
      .from('companies')
      .upsert(company, { onConflict: 'name' })
      .select()
      .single();
    if (error) throw error;
    return data as Company;
  }

  async listJobs(filter?: JobFilter): Promise<JobWithIntel[]> {
    let query = this.db
      .from('jobs')
      .select('*, companies(*), job_scores(*)')
      .order('first_seen_at', { ascending: false })
      .limit(200);
    if (filter?.companyId) query = query.eq('company_id', filter.companyId);
    if (filter?.source) query = query.eq('source', filter.source);
    if (filter?.status) query = query.eq('status', filter.status);
    if (filter?.query) query = query.or(`title.ilike.%${filter.query}%,description.ilike.%${filter.query}%`);
    if (filter?.location) query = query.ilike('location', `%${filter.location}%`);
    if (filter?.remote) query = query.ilike('location', '%remote%');
    const { data, error } = await query;
    if (error) throw error;

    const { data: dupes } = await this.db.from('job_duplicates').select('*');
    const duplicateIds = new Set((dupes as JobDuplicate[] | null)?.map((d) => d.duplicate_job_id));

    let items = (data as Array<Job & { companies: Company; job_scores: JobScore | JobScore[] | null }>)
      .filter((row) => !duplicateIds.has(row.id))
      .map((row) => this.toIntel(row, (dupes as JobDuplicate[] | null) ?? []));

    // Score-dependent filters applied post-query.
    if (filter?.minConfidence !== undefined)
      items = items.filter((i) => (i.score?.overall_score ?? 0) >= filter.minConfidence!);
    if (filter?.minMatch !== undefined)
      items = items.filter((i) => (i.score?.match_score ?? 0) >= filter.minMatch!);
    if (filter?.verifiedWithinHours !== undefined)
      items = items.filter(
        (i) =>
          i.job.last_verified_at &&
          (Date.now() - new Date(i.job.last_verified_at).getTime()) / 3_600_000 <=
            filter.verifiedWithinHours!,
      );
    if (filter?.minSalary !== undefined)
      items = items.filter((i) => (i.job.salary_max ?? 0) >= filter.minSalary!);
    if (filter?.maxAgeDays !== undefined)
      items = items.filter((i) => daysAgo(i.job.first_seen_at) <= filter.maxAgeDays!);

    return items.sort((a, b) => (b.score?.overall_score ?? 0) - (a.score?.overall_score ?? 0));
  }

  private toIntel(
    row: Job & { companies: Company; job_scores: JobScore | JobScore[] | null },
    dupes: JobDuplicate[],
  ): JobWithIntel {
    const { companies, job_scores, ...job } = row;
    const score = Array.isArray(job_scores) ? (job_scores[0] ?? null) : job_scores;
    const myDupes = dupes.filter((d) => d.canonical_job_id === job.id);
    return {
      job: job as Job,
      company: companies,
      score,
      duplicateCount: myDupes.length,
      sources: [job.source],
    };
  }

  async getJob(id: string): Promise<JobBundle | null> {
    const { data: row } = await this.db
      .from('jobs')
      .select('*, companies(*), job_scores(*)')
      .eq('id', id)
      .maybeSingle();
    if (!row) return null;
    const [verifications, events, duplicates, contacts] = await Promise.all([
      this.db.from('job_verifications').select('*').eq('job_id', id).order('checked_at', { ascending: false }),
      this.db.from('job_events').select('*').eq('job_id', id).order('occurred_at'),
      this.db.from('job_duplicates').select('*').or(`canonical_job_id.eq.${id},duplicate_job_id.eq.${id}`),
      this.db.from('contacts').select('*').eq('company_id', (row as { company_id: string }).company_id),
    ]);
    return {
      ...this.toIntel(
        row as Job & { companies: Company; job_scores: JobScore | JobScore[] | null },
        (duplicates.data as JobDuplicate[] | null) ?? [],
      ),
      verifications: (verifications.data as JobVerification[] | null) ?? [],
      events: (events.data as JobEvent[] | null) ?? [],
      duplicates: (duplicates.data as JobDuplicate[] | null) ?? [],
      contacts: (contacts.data as Contact[] | null) ?? [],
    };
  }

  async findJobByExternalId(companyId: string, source: string, externalId: string): Promise<Job | null> {
    const { data } = await this.db
      .from('jobs')
      .select('*')
      .eq('company_id', companyId)
      .eq('source', source)
      .eq('external_job_id', externalId)
      .maybeSingle();
    return (data as Job) ?? null;
  }

  async findJobByUrl(url: string): Promise<JobBundle | null> {
    const { data } = await this.db
      .from('jobs')
      .select('id')
      .or(`source_url.eq.${url},application_url.eq.${url}`)
      .maybeSingle();
    return data ? this.getJob((data as { id: string }).id) : null;
  }

  async saveJob(job: Job): Promise<void> {
    const { error } = await this.db.from('jobs').upsert(job);
    if (error) throw error;
  }

  async insertVerification(v: Omit<JobVerification, 'id'>): Promise<void> {
    const { error } = await this.db.from('job_verifications').insert(v);
    if (error) throw error;
    await this.db.from('jobs').update({ last_verified_at: v.checked_at }).eq('id', v.job_id);
  }

  async insertEvents(
    jobId: string,
    events: Array<Pick<JobEvent, 'kind' | 'detail'>>,
    occurredAt: string,
  ): Promise<void> {
    if (events.length === 0) return;
    const { error } = await this.db
      .from('job_events')
      .insert(events.map((e) => ({ job_id: jobId, occurred_at: occurredAt, ...e })));
    if (error) throw error;
  }

  async saveScore(score: JobScore): Promise<void> {
    const { error } = await this.db.from('job_scores').upsert(score);
    if (error) throw error;
  }

  async saveDuplicates(duplicates: JobDuplicate[]): Promise<void> {
    if (duplicates.length === 0) return;
    const { error } = await this.db
      .from('job_duplicates')
      .upsert(duplicates, { onConflict: 'canonical_job_id,duplicate_job_id' });
    if (error) throw error;
  }

  async getScoringWeights(): Promise<SignalWeight[]> {
    const { data } = await this.db.from('scoring_weights').select('*');
    const rows = data as Array<{ key: string; label: string; points: number; enabled: boolean }> | null;
    if (!rows || rows.length === 0) return DEFAULT_WEIGHTS;
    return rows;
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data } = await this.db.from('user_profiles').select('*').eq('user_id', userId).maybeSingle();
    return (data as UserProfile) ?? null;
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    const { error } = await this.db.from('user_profiles').upsert(profile);
    if (error) throw error;
  }

  async listApplications(userId: string): Promise<Array<Application & { intel: JobWithIntel | null }>> {
    const { data } = await this.db
      .from('applications')
      .select('*, jobs(*, companies(*), job_scores(*))')
      .eq('user_id', userId);
    return ((data as Array<Application & { jobs: (Job & { companies: Company; job_scores: JobScore | JobScore[] | null }) | null }> | null) ?? []).map(
      (row) => {
        const { jobs, ...app } = row;
        return { ...app, intel: jobs ? this.toIntel(jobs, []) : null };
      },
    );
  }

  async getApplication(userId: string, jobId: string): Promise<Application | null> {
    const { data } = await this.db
      .from('applications')
      .select('*')
      .eq('user_id', userId)
      .eq('job_id', jobId)
      .maybeSingle();
    return (data as Application) ?? null;
  }

  async upsertApplication(
    userId: string,
    jobId: string,
    status: ApplicationStatus,
    notes?: string,
  ): Promise<Application> {
    const existing = await this.getApplication(userId, jobId);
    const { data, error } = await this.db
      .from('applications')
      .upsert(
        {
          ...(existing ? { id: existing.id } : {}),
          user_id: userId,
          job_id: jobId,
          status,
          notes: notes ?? existing?.notes ?? null,
          applied_at: status === 'applied' ? (existing?.applied_at ?? new Date().toISOString()) : existing?.applied_at,
        },
        { onConflict: 'user_id,job_id' },
      )
      .select()
      .single();
    if (error) throw error;
    return data as Application;
  }

  async listContacts(companyId: string): Promise<Contact[]> {
    const { data } = await this.db.from('contacts').select('*').eq('company_id', companyId);
    return (data as Contact[] | null) ?? [];
  }

  async insertFeedback(feedback: Omit<UserFeedback, 'id' | 'created_at'>): Promise<void> {
    const { error } = await this.db.from('user_feedback').insert(feedback);
    if (error) throw error;
  }
}
