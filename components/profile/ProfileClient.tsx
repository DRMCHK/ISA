'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { PostCard } from '@/components/ui/PostCard';
import { Avatar } from '@/components/ui/Avatar';
import { formatRelativeTime } from '@/lib/utils';
import { UserPlus, UserCheck, MessageSquare, Clock, Calendar, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Post } from '@/types';

interface ProfileUser {
  id: string; name: string; username: string; avatarUrl: string | null;
  bio: string | null; role: string; isOnline?: boolean; lastSeen?: Date | string | null;
  publicKey: string; createdAt: Date | string;
  _count: { posts: number };
}

interface Friendship {
  id: string; status: string; userId: string; friendId: string;
}

interface CurrentUser { id: string; role: string; }

export function ProfileClient({
  profileUser, posts, currentUser, friendship,
}: {
  profileUser: ProfileUser; posts: Post[]; currentUser: CurrentUser; friendship: Friendship | null;
}) {
  const [localFriendship, setLocalFriendship] = useState(friendship);
  const [postList, setPostList] = useState(posts);
  const isOwn = profileUser.id === currentUser.id;

  async function sendRequest() {
    const res = await fetch('/api/friends', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId: profileUser.id }),
    });
    if (res.ok) {
      const { friendship: f } = (await res.json()) as { friendship: Friendship };
      setLocalFriendship(f);
      toast.success('Friend request sent!');
    } else {
      toast.error('Failed to send friend request');
    }
  }

  async function acceptRequest() {
    if (!localFriendship) return;
    const res = await fetch(`/api/friends/${localFriendship.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ACCEPTED' }),
    });
    if (res.ok) {
      setLocalFriendship((prev) => prev ? { ...prev, status: 'ACCEPTED' } : prev);
      toast.success('Friend request accepted!');
    }
  }

  const isFriend = localFriendship?.status === 'ACCEPTED';
  const isPending = localFriendship?.status === 'PENDING';
  const isIncoming = isPending && localFriendship?.friendId === currentUser.id;

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-fade-in">
      {/* Profile card */}
      <div className="card overflow-hidden">
        {/* Cover */}
        <div className="h-32 bg-isa-gradient" />

        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-14 mb-4">
            <div className="relative">
              <Avatar name={profileUser.name} avatarUrl={profileUser.avatarUrl} size="xl"
                isOnline={isFriend || isOwn ? profileUser.isOnline : undefined}
                className="border-4 border-white dark:border-gray-900" />
              {profileUser.role === 'ADMIN' && (
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-isa-600 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">
                  <Shield size={12} className="text-white" />
                </div>
              )}
            </div>

            {/* Actions */}
            {!isOwn && (
              <div className="flex items-center gap-2 mt-16">
                <Link href={`/messages/${profileUser.id}`} className="btn-secondary flex items-center gap-1.5 text-sm">
                  <MessageSquare size={15} /> Message
                </Link>
                {isFriend ? (
                  <button className="btn-secondary flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400" disabled>
                    <UserCheck size={15} /> Friends
                  </button>
                ) : isIncoming ? (
                  <button onClick={acceptRequest} className="btn-primary flex items-center gap-1.5 text-sm">
                    <UserCheck size={15} /> Accept Request
                  </button>
                ) : isPending ? (
                  <button className="btn-secondary text-sm opacity-60 cursor-default" disabled>
                    <Clock size={15} /> Pending…
                  </button>
                ) : (
                  <button onClick={sendRequest} className="btn-primary flex items-center gap-1.5 text-sm">
                    <UserPlus size={15} /> Add Friend
                  </button>
                )}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">{profileUser.name}</h1>
              {profileUser.role === 'ADMIN' && (
                <span className="text-xs bg-isa-100 dark:bg-isa-900 text-isa-700 dark:text-isa-300 px-2 py-0.5 rounded-full font-semibold">Admin</span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">@{profileUser.username}</p>
            {profileUser.bio && (
              <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{profileUser.bio}</p>
            )}
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar size={13} />
                Joined {formatRelativeTime(profileUser.createdAt.toString())}
              </span>
              <span className="font-medium text-gray-600 dark:text-gray-400">
                {profileUser._count.posts} posts
              </span>
              {(isFriend || isOwn) && profileUser.isOnline !== undefined && (
                <span className={`flex items-center gap-1 ${profileUser.isOnline ? 'text-emerald-500' : 'text-gray-400'}`}>
                  <span className={`w-2 h-2 rounded-full ${profileUser.isOnline ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                  {profileUser.isOnline ? 'Online' : profileUser.lastSeen ? `Last seen ${formatRelativeTime(profileUser.lastSeen.toString())}` : 'Offline'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      <h2 className="text-base font-semibold text-gray-700 dark:text-gray-300 px-1">Posts</h2>
      {postList.length === 0 ? (
        <div className="card p-10 text-center text-gray-400 dark:text-gray-500 text-sm">No posts yet.</div>
      ) : (
        postList.map((post) => (
          <PostCard key={post.id} post={post} currentUserId={currentUser.id}
            isAdmin={currentUser.role === 'ADMIN'}
            onDelete={(id) => setPostList((prev) => prev.filter((p) => p.id !== id))} />
        ))
      )}
    </div>
  );
}
