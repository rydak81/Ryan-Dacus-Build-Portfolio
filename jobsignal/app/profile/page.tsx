import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { ProfileForm, ResumeUpload } from '@/components/ProfileForm';
import { getCurrentUser } from '@/lib/auth';
import { getStore } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const profile = await getStore().getProfile(user.id);

  return (
    <AppShell active="/profile" demo={user.isDemo}>
      <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
      <p className="mt-1 text-sm text-ink-2">
        Everything here feeds your Candidate Match score. Match is scored against the job content —
        it never inflates, and it never touches Job Confidence.
      </p>
      <div className="mt-5 space-y-4">
        <ProfileForm profile={profile} />
        <ResumeUpload hasResume={Boolean(profile?.resume_text)} />
      </div>
    </AppShell>
  );
}
