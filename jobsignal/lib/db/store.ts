/**
 * Data access interface. Two implementations: SupabaseStore (production)
 * and DemoStore (in-memory, seeded — used when Supabase env vars are
 * absent so the product runs and demos with zero setup).
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
import type { SignalWeight } from '@/lib/config/scoring';

export interface JobFilter {
  query?: string;
  location?: string;
  remote?: boolean;
  minConfidence?: number;
  minMatch?: number;
  verifiedWithinHours?: number;
  minSalary?: number;
  maxAgeDays?: number;
  source?: string;
  status?: string;
  companyId?: string;
}

export interface JobWithIntel {
  job: Job;
  company: Company;
  score: JobScore | null;
  duplicateCount: number;
  sources: string[];
}

export interface JobBundle extends JobWithIntel {
  verifications: JobVerification[];
  events: JobEvent[];
  duplicates: JobDuplicate[];
  contacts: Contact[];
}

export interface JobSignalStore {
  listCompanies(): Promise<Company[]>;
  getCompany(id: string): Promise<Company | null>;
  getCompanyJobs(companyId: string): Promise<JobWithIntel[]>;
  upsertCompany(company: Omit<Company, 'id' | 'created_at'> & { id?: string }): Promise<Company>;

  listJobs(filter?: JobFilter): Promise<JobWithIntel[]>;
  getJob(id: string): Promise<JobBundle | null>;
  findJobByExternalId(companyId: string, source: string, externalId: string): Promise<Job | null>;
  findJobByUrl(url: string): Promise<JobBundle | null>;
  saveJob(job: Job): Promise<void>;

  insertVerification(v: Omit<JobVerification, 'id'>): Promise<void>;
  insertEvents(jobId: string, events: Array<Pick<JobEvent, 'kind' | 'detail'>>, occurredAt: string): Promise<void>;
  saveScore(score: JobScore): Promise<void>;
  saveDuplicates(duplicates: JobDuplicate[]): Promise<void>;

  getScoringWeights(): Promise<SignalWeight[]>;

  getProfile(userId: string): Promise<UserProfile | null>;
  saveProfile(profile: UserProfile): Promise<void>;

  listApplications(userId: string): Promise<Array<Application & { intel: JobWithIntel | null }>>;
  getApplication(userId: string, jobId: string): Promise<Application | null>;
  upsertApplication(userId: string, jobId: string, status: ApplicationStatus, notes?: string): Promise<Application>;

  listContacts(companyId: string): Promise<Contact[]>;
  insertFeedback(feedback: Omit<UserFeedback, 'id' | 'created_at'>): Promise<void>;
}
