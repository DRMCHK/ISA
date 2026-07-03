'use client';

import { useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { Avatar } from '@/components/ui/Avatar';
import { Image as ImageIcon, Video, Link as LinkIcon, Send, X } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Post } from '@/types';

interface CreatePostProps {
  onPostCreated: (post: Post) => void;
}

export function CreatePost({ onPostCreated }: CreatePostProps) {
  const { data: session } = useSession();
  const [content, setContent] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [showLink, setShowLink] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxMb = 50;
    if (file.size > maxMb * 1024 * 1024) {
      toast.error(`File too large (max ${maxMb}MB)`);
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUri = reader.result as string;

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUri }),
      });

      setUploading(false);
      if (res.ok) {
        const { url, resourceType } = (await res.json()) as { url: string; resourceType: 'image' | 'video' };
        setPreviewMedia({ url, type: resourceType });
      } else {
        toast.error('Upload failed. Check your Cloudinary config.');
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() && !previewMedia && !linkUrl) return;

    setSubmitting(true);

    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: content.trim() || undefined,
        mediaUrl: previewMedia?.url,
        mediaType: previewMedia?.type ?? (linkUrl ? 'link' : undefined),
        linkUrl: linkUrl || undefined,
      }),
    });

    setSubmitting(false);

    if (res.ok) {
      const { post, flagged } = (await res.json()) as { post: Post; flagged: boolean };
      if (flagged) {
        toast('Your post is under review.', { icon: '⚠️' });
      } else {
        toast.success('Post shared!');
        onPostCreated(post);
      }
      setContent('');
      setPreviewMedia(null);
      setLinkUrl('');
      setShowLink(false);
    } else {
      const { error } = (await res.json()) as { error: string };
      toast.error(error ?? 'Failed to post');
    }
  }

  if (!session) return null;

  return (
    <div className="card p-4 animate-fade-in">
      <div className="flex gap-3">
        <Avatar name={session.user.name} avatarUrl={session.user.avatarUrl} size="sm" />
        <div className="flex-1">
          <form onSubmit={handleSubmit}>
            <textarea
              rows={3}
              placeholder="What's on your mind?"
              className="input resize-none text-sm mb-3"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={3000}
            />

            {previewMedia && (
              <div className="relative mb-3 rounded-xl overflow-hidden">
                {previewMedia.type === 'image' ? (
                  <img src={previewMedia.url} alt="Preview" className="w-full max-h-48 object-cover" />
                ) : (
                  <video src={previewMedia.url} controls className="w-full max-h-48" />
                )}
                <button type="button" onClick={() => setPreviewMedia(null)}
                  className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1">
                  <X size={14} />
                </button>
              </div>
            )}

            {showLink && (
              <input type="url" placeholder="https://example.com" className="input text-sm mb-3"
                value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />
                <button type="button" title="Add image" onClick={() => fileRef.current?.click()}
                  className="btn-ghost p-2 text-gray-500">
                  {uploading ? <span className="w-4 h-4 border-2 border-isa-500 border-t-transparent rounded-full animate-spin inline-block" /> : <ImageIcon size={18} />}
                </button>
                <button type="button" title="Add video" onClick={() => fileRef.current?.click()}
                  className="btn-ghost p-2 text-gray-500">
                  <Video size={18} />
                </button>
                <button type="button" title="Add link" onClick={() => setShowLink(!showLink)}
                  className={`btn-ghost p-2 ${showLink ? 'text-isa-600' : 'text-gray-500'}`}>
                  <LinkIcon size={18} />
                </button>
              </div>

              <button type="submit" disabled={submitting || uploading || (!content.trim() && !previewMedia && !linkUrl)}
                className="btn-primary flex items-center gap-1.5 py-2 text-sm">
                {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={15} />}
                Share
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
