import { AuthForm } from '@/components/AuthForm';
import { isDemoMode } from '@/lib/db';

export const metadata = { title: 'Log in' };

export default function LoginPage() {
  return <AuthForm mode="login" demo={isDemoMode()} />;
}
