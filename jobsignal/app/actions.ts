'use server';

/**
 * Server actions: the write path for the UI. Each validates input with
 * Zod, resolves the current user, and delegates to the store/services.
 */

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCurrentUser } from '@/lib/auth';
import { getStore } from '@/lib/db';
import { verifyAndRescore } from '@/lib/services/verify';
import { generateOutreach, extractSkillsFromResume, type OutreachTone } from '@/lib/ai/tasks';
import { matchJob } from '@/lib/match/engine';
import type { ApplicationStatus, UserProfile } from '@/lib/types';

const statusSchema = z.enum(['saved', 'contacted', 'applied', 'interview', 'followup', 'rejected', 'offer']);

export async function setApplicationStatus(jobId: string, status: ApplicationStatus): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  const parsed = statusSchema.parse(status);
  await getStore().upsertApplication(user.id, z.string().min(1).parse(jobId), parsed);
  revalidatePath('/saved');
  revalidatePath('/applications');
  revalidatePath(`/jobs/${jobId}`);
}

export async function verifyJobNow(jobId: string): Promise<{ ok: boolean; message: string }> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  try {
    const result = await verifyAndRescore(z.string().min(1).parse(jobId));
    revalidatePath(`/jobs/${jobId}`);
    revalidatePath('/jobs');
    if (!result) return { ok: false, message: 'Job not found' };
    return {
      ok: true,
      message: result.still_exists
        ? 'Verified — the listing still exists at its source.'
        : 'Verification could not confirm the listing still exists.',
    };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Verification failed' };
  }
}

const feedbackSchema = z.enum([
  'applied', 'recruiter_responded', 'interview_scheduled', 'already_filled',
  'position_frozen', 'rejected', 'link_broken', 'posting_disappeared',
]);

export async function submitFeedback(jobId: string, kind: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  await getStore().insertFeedback({
    user_id: user.id,
    job_id: z.string().min(1).parse(jobId),
    kind: feedbackSchema.parse(kind),
  });
  revalidatePath(`/jobs/${jobId}`);
}

const profileSchema = z.object({
  current_title: z.string().max(200).nullable(),
  desired_titles: z.array(z.string().max(200)).max(10),
  seniority: z.string().max(50).nullable(),
  preferred_locations: z.array(z.string().max(100)).max(10),
  remote_preference: z.enum(['remote', 'hybrid', 'onsite', 'flexible']),
  salary_min: z.number().int().min(0).max(5_000_000).nullable(),
  industries: z.array(z.string().max(100)).max(10),
  skills: z.array(z.string().max(100)).max(40),
  years_experience: z.number().int().min(0).max(60).nullable(),
  linkedin_url: z.string().url().nullable().or(z.literal('').transform(() => null)),
  portfolio_url: z.string().url().nullable().or(z.literal('').transform(() => null)),
});

export async function updateProfile(input: Omit<UserProfile, 'user_id' | 'resume_text'>): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  const store = getStore();
  const existing = await store.getProfile(user.id);
  const parsed = profileSchema.parse(input);
  await store.saveProfile({ ...parsed, user_id: user.id, resume_text: existing?.resume_text ?? null });
  revalidatePath('/profile');
  revalidatePath('/dashboard');
  revalidatePath('/jobs');
}

export async function uploadResumeText(resumeText: string): Promise<{ skills: string[] }> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  const text = z.string().min(50).max(100_000).parse(resumeText);
  const store = getStore();
  const existing = await store.getProfile(user.id);
  const skills = await extractSkillsFromResume(text);
  await store.saveProfile({
    user_id: user.id,
    current_title: existing?.current_title ?? null,
    desired_titles: existing?.desired_titles ?? [],
    seniority: existing?.seniority ?? null,
    preferred_locations: existing?.preferred_locations ?? [],
    remote_preference: existing?.remote_preference ?? 'flexible',
    salary_min: existing?.salary_min ?? null,
    industries: existing?.industries ?? [],
    skills: [...new Set([...(existing?.skills ?? []), ...skills])],
    years_experience: existing?.years_experience ?? null,
    resume_text: text,
    linkedin_url: existing?.linkedin_url ?? null,
    portfolio_url: existing?.portfolio_url ?? null,
  });
  revalidatePath('/profile');
  return { skills };
}

const toneSchema = z.enum(['direct', 'conversational', 'executive', 'recruiter', 'networking']);

export async function generateOutreachAction(
  jobId: string,
  contactId: string,
  tone: OutreachTone,
): Promise<{ ok: boolean; message: string }> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');
  const store = getStore();
  const bundle = await store.getJob(z.string().min(1).parse(jobId));
  if (!bundle) return { ok: false, message: 'Job not found' };
  const contact = bundle.contacts.find((c) => c.id === contactId);
  if (!contact) return { ok: false, message: 'Contact not found' };
  const profile = await store.getProfile(user.id);
  if (!profile) return { ok: false, message: 'Complete your profile first' };
  try {
    const message = await generateOutreach({
      profile,
      job: bundle.job,
      companyName: bundle.company.name,
      contact,
      match: matchJob(profile, bundle.job),
      tone: toneSchema.parse(tone),
    });
    return { ok: true, message };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Generation failed' };
  }
}
