'use client';

import { useState, useEffect, useRef } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Send } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string; username: string; avatarUrl: string | null };
}

export function CommentSection({ postId, currentUserId }: { postId: string; currentUserId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/posts/${postId}/comments`)
      .then((r) => r.json())
      .then((d: { comments: Comment[] }) => setComments(d.comments))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [postId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);

    const res = await fetch(`/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text }),
    });

    setSubmitting(false);
    if (res.ok) {
      const { comment } = (await res.json()) as { comment: Comment };
      setComments((prev) => [...prev, comment]);
      setText('');
    } else {
      toast.error('Failed to post comment');
    }
  }

  return (
    <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-3 space-y-3 bg-gray-50/50 dark:bg-gray-900/50">
      {loading ? (
        <div className="h-8 flex items-center">
          <div className="w-4 h-4 border-2 border-isa-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        comments.map((c) => (
          <div key={c.id} className="flex gap-2.5 animate-fade-in">
            <Avatar name={c.author.name} avatarUrl={c.author.avatarUrl} size="xs" />
            <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl px-3 py-2 text-sm">
              <span className="font-semibold text-gray-900 dark:text-white mr-1.5">{c.author.name}</span>
              <span className="text-gray-700 dark:text-gray-300">{c.content}</span>
              <p className="text-xs text-gray-400 mt-0.5">{formatRelativeTime(c.createdAt)}</p>
            </div>
          </div>
        ))
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 items-center">
        <input
          ref={inputRef}
          type="text"
          placeholder="Add a comment…"
          className="input py-2 text-sm"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={1000}
        />
        <button type="submit" disabled={submitting || !text.trim()} className="btn-primary p-2.5">
          {submitting ? (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <Send size={16} />
          )}
        </button>
      </form>
    </div>
  );
}
