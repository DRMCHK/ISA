'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { PostCard } from '@/components/ui/PostCard';
import { CreatePost } from '@/components/ui/CreatePost';
import { Loader2, Rss } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Post } from '@/types';

export default function FeedPage() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadPosts = useCallback(async (cursor?: string) => {
    try {
      const url = `/api/posts${cursor ? `?cursor=${cursor}` : ''}`;
      const res = await fetch(url);
      const data = (await res.json()) as { posts: Post[]; nextCursor: string | null };
      if (cursor) {
        setPosts((prev) => [...prev, ...data.posts]);
      } else {
        setPosts(data.posts);
      }
      setNextCursor(data.nextCursor);
    } catch {
      toast.error('Failed to load posts');
    }
  }, []);

  useEffect(() => {
    loadPosts().finally(() => setLoading(false));
  }, [loadPosts]);

  function handleNewPost(post: Post) {
    setPosts((prev) => [post, ...prev]);
  }

  function handleDeletePost(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }

  async function handleLoadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    await loadPosts(nextCursor);
    setLoadingMore(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-isa-600" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
      {/* Create Post */}
      <CreatePost onPostCreated={handleNewPost} />

      {/* Feed */}
      {posts.length === 0 ? (
        <div className="card p-12 text-center">
          <Rss className="mx-auto text-gray-300 dark:text-gray-600 mb-4" size={48} />
          <h3 className="font-semibold text-gray-600 dark:text-gray-400 text-lg mb-1">Your feed is empty</h3>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Add some friends and start sharing to see their posts here.
          </p>
        </div>
      ) : (
        <>
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={session?.user?.id ?? ''}
              isAdmin={session?.user?.role === 'ADMIN'}
              onDelete={handleDeletePost}
            />
          ))}
          {nextCursor && (
            <div className="flex justify-center pt-2">
              <button onClick={handleLoadMore} disabled={loadingMore}
                className="btn-secondary flex items-center gap-2">
                {loadingMore ? <Loader2 size={16} className="animate-spin" /> : null}
                Load more
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
