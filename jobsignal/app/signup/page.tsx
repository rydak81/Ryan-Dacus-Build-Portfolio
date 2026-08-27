import { AuthForm } from '@/components/AuthForm';
import { isDemoMode } from '@/lib/db';

export const metadata = { title: 'Sign up' };

export default function SignupPage() {
  return <AuthForm mode="signup" demo={isDemoMode()} />;
}
