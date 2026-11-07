'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid password.');
        setLoading(false);
        return;
      }

      router.push('/');
      router.refresh();
    } catch {
      setError('Connection failed. Try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bone flex flex-col justify-center items-center p-6 selection:bg-orange-wash selection:text-ink">
      <div className="w-full max-w-sm">
        {/* Monogram & Title */}
        <div className="text-center mb-8">
          <div className="inline-block border border-rule px-3 py-1 bg-paper font-mono text-xs uppercase tracking-[0.1em] text-ink-mute mb-3">
            Private Access · Edition 304
          </div>
          <h1 className="font-fraunces text-4xl font-semibold text-ink tracking-tight">
            NewsDesk
          </h1>
          <p className="font-inter text-sm text-ink-soft mt-2">
            Editorial intelligence & creation desk for Instagram.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-paper border border-rule rounded-[4px] p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="ACCESS KEY / PASSWORD"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter editorial password"
              autoFocus
              required
              disabled={loading}
              error={error}
            />

            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full mt-2"
            >
              Enter Desk
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-rule text-center">
            <span className="font-mono text-[11px] text-ink-mute">
              Protected single-user environment.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

