import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { ProfileForm, ResumeUpload } from '@/components/ProfileForm';
import { getCurrentUser } from '@/lib/auth';
import { getStore } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const profile = await getStore().getProfile(user.id);

  return (
    <AppShell active="/profile" demo={user.isDemo}>
      <h1 className="text-2xl font-bold tracking-tight">Welcome to JobSignal</h1>
      <p className="mt-1 max-w-2xl text-sm text-ink-2">
        Two steps: tell us what you’re targeting, then add your resume. From there every job gets
        two independent numbers — how real the job looks, and how well it fits you.
      </p>
      <div className="mt-5 space-y-4">
        <ProfileForm profile={profile} />
        <ResumeUpload hasResume={Boolean(profile?.resume_text)} />
        <div className="rounded-xl border border-brand/20 bg-brand-soft p-4 text-sm">
          Done here?{' '}
          <a href="/dashboard" className="font-semibold text-brand hover:underline">
            Go to your dashboard →
          </a>
        </div>
      </div>
    </AppShell>
  );
}
