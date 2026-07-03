'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Users, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function JoinGroupPage() {
  const params = useParams<{ inviteCode: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'joining' | 'success' | 'error'>('loading');
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setStatus('joining');
    fetch(`/api/groups/join/${params.inviteCode}`, { method: 'POST' })
      .then(async (res) => {
        const data = (await res.json()) as { group?: { name: string; id: string }; error?: string; alreadyMember?: boolean };
        if (!res.ok) {
          setError(data.error ?? 'Invalid invite link');
          setStatus('error');
        } else {
          setGroupName(data.group?.name ?? 'Group');
          setStatus('success');
          const gid = data.group?.id;
          setTimeout(() => router.push(`/groups/${gid}`), 2000);
        }
      })
      .catch(() => {
        setError('Network error');
        setStatus('error');
      });
  }, [params.inviteCode, router]);

  return (
    <div className="max-w-md mx-auto mt-20">
      <div className="card p-10 text-center">
        {status === 'loading' || status === 'joining' ? (
          <>
            <Loader2 className="animate-spin text-isa-600 mx-auto mb-4" size={40} />
            <p className="text-gray-600 dark:text-gray-400">Joining group…</p>
          </>
        ) : status === 'success' ? (
          <>
            <CheckCircle className="text-emerald-500 mx-auto mb-4" size={48} />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              You joined <span className="text-isa-600">{groupName}</span>!
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Redirecting to group chat…</p>
          </>
        ) : (
          <>
            <Users className="text-gray-300 dark:text-gray-600 mx-auto mb-4" size={48} />
            <h2 className="text-xl font-bold text-red-600 mb-2">Unable to join</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{error}</p>
          </>
        )}
      </div>
    </div>
  );
}
