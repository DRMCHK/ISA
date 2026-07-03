'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Heart, MessageCircle, Trash2, ExternalLink, MoreHorizontal, Flag } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { CommentSection } from '@/components/ui/CommentSection';
import { formatRelativeTime } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { Post } from '@/types';

interface PostCardProps {
  post: Post;
  currentUserId: string;
  isAdmin?: boolean;
  onDelete?: (id: string) => void;
}

export function PostCard({ post, currentUserId, isAdmin, onDelete }: PostCardProps) {
  const [liked, setLiked] = useState(post.isLiked ?? false);
  const [likeCount, setLikeCount] = useState(post._count?.likes ?? 0);
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isOwner = post.author.id === currentUserId;

  const handleLike = useCallback(async () => {
    const prev = liked;
    setLiked(!prev);
    setLikeCount((c) => c + (prev ? -1 : 1));

    const res = await fetch(`/api/posts/${post.id}/like`, { method: 'POST' });
    if (!res.ok) {
      setLiked(prev);
      setLikeCount((c) => c + (prev ? 1 : -1));
    }
  }, [liked, post.id]);

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return;
    const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Post deleted');
      onDelete?.(post.id);
    } else {
      toast.error('Failed to delete post');
    }
  };

  const handleApprove = async () => {
    const res = await fetch(`/api/posts/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flagged: false }),
    });
    if (res.ok) toast.success('Post approved');
  };

  return (
    <article className="card overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="p-4 pb-3 flex items-start gap-3">
        <Link href={`/profile/${post.author.username}`}>
          <Avatar name={post.author.name} avatarUrl={post.author.avatarUrl} size="sm" />
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/profile/${post.author.username}`} className="font-semibold text-gray-900 dark:text-white hover:underline text-sm">
            {post.author.name}
          </Link>
          <p className="text-xs text-gray-400 dark:text-gray-500">@{post.author.username} · {formatRelativeTime(post.createdAt)}</p>
        </div>

        {(isOwner || isAdmin) && (
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="btn-ghost p-1.5">
              <MoreHorizontal size={18} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-8 z-20 card shadow-xl p-1.5 min-w-36">
                {isAdmin && post.flagged && (
                  <button onClick={handleApprove} className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 text-green-600 flex items-center gap-2">
                    <Flag size={14} /> Approve post
                  </button>
                )}
                <button onClick={handleDelete} className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center gap-2">
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Flagged banner */}
      {post.flagged && (
        <div className="mx-4 mb-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
          <Flag size={12} /> This post was flagged for review
        </div>
      )}

      {/* Content */}
      {post.content && (
        <p className="px-4 pb-3 text-gray-800 dark:text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
          {post.content}
        </p>
      )}

      {/* Media */}
      {post.mediaUrl && post.mediaType === 'image' && (
        <div className="relative w-full max-h-96 overflow-hidden">
          <Image src={post.mediaUrl} alt="Post image" width={600} height={400}
            className="w-full object-cover" />
        </div>
      )}
      {post.mediaUrl && post.mediaType === 'video' && (
        <video controls className="w-full max-h-96" src={post.mediaUrl} />
      )}
      {post.linkUrl && (
        <div className="mx-4 mb-3">
          <a href={post.linkUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-isa-600 dark:text-isa-400 text-sm hover:underline p-3 bg-isa-50 dark:bg-isa-950/30 rounded-xl border border-isa-100 dark:border-isa-900">
            <ExternalLink size={14} /> {post.linkUrl}
          </a>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center gap-4">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 text-sm font-medium transition-all duration-150 hover:scale-105 active:scale-95 ${
            liked ? 'text-red-500' : 'text-gray-400 hover:text-red-400'
          }`}
          aria-label="Like post"
        >
          <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
          <span>{likeCount}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-isa-600 dark:hover:text-isa-400 transition-colors"
          aria-label="Toggle comments"
        >
          <MessageCircle size={18} />
          <span>{post._count?.comments ?? 0}</span>
        </button>
      </div>

      {/* Comments */}
      {showComments && <CommentSection postId={post.id} currentUserId={currentUserId} />}
    </article>
  );
}
