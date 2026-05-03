'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

const REDIRECT_KEY = 'clone:post-login-redirect';

export function CloneMeButton({
  className,
  redirectTo = '/setup',
}: {
  className?: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const { ready, authenticated, login } = useAuth();
  const [waitingForLogin, setWaitingForLogin] = useState(false);

  useEffect(() => {
    if (!ready || !authenticated) return;
    const redirectTo = window.localStorage.getItem(REDIRECT_KEY);
    if (redirectTo) {
      window.localStorage.removeItem(REDIRECT_KEY);
      router.push(redirectTo);
    }
  }, [authenticated, ready, router]);

  const handleClick = () => {
    if (authenticated) {
      router.push(redirectTo);
      return;
    }

    window.localStorage.setItem(REDIRECT_KEY, redirectTo);
    setWaitingForLogin(true);
    login();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!ready || waitingForLogin}
      className={className}
    >
      {waitingForLogin ? (
        <span className="inline-flex items-center gap-2">
          <Loader2 size={16} className="animate-spin" /> Continue
        </span>
      ) : (
        'Clone Me'
      )}
    </button>
  );
}
