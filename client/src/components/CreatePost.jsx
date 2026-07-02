import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

function Avatar({ user, size = '' }) {
  if (user?.avatar_url) {
    return <img src={user.avatar_url} alt={user.full_name} className={`avatar ${size}`} />;
  }
  const initial = user?.full_name?.charAt(0)?.toUpperCase() || '?';
  return <div className={`avatar avatar-placeholder ${size}`}>{initial}</div>;
}

export default function CreatePost({ onPostCreated }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [mediaType, setMediaType] = useState('text');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type.startsWith('image/') && !user.can_post_pictures) {
      setError('You do not have permission to post pictures');
      return;
    }
    if (file.type.startsWith('video/') && !user.can_post_videos) {
      setError('You do not have permission to post videos');
      return;
    }

    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
    setMediaType(file.type.startsWith('video/') ? 'video' : 'image');
    setError('');
  };

  const handleSubmit = async () => {
    if (!content.trim() && !mediaFile && !linkUrl) {
      setError('Write something or add media/link');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const form = new FormData();
      form.append('content', content);
      form.append('mediaType', mediaType);
      if (mediaFile) form.append('media', mediaFile);
      if (linkUrl) {
        form.append('linkUrl', linkUrl);
        form.append('linkTitle', linkTitle);
      }

      const result = await api.posts.create(form);
      setContent('');
      setMediaFile(null);
      setMediaPreview(null);
      setLinkUrl('');
      setLinkTitle('');
      setMediaType('text');
      onPostCreated(result.post, result.flagged);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card create-post">
      <div className="create-post-header">
        <Avatar user={user} />
        <textarea
          placeholder="Share something with the ISA community..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </div>

      {mediaType === 'link' && (
        <div style={{ marginTop: '0.75rem' }}>
          <input
            type="url"
            placeholder="https://example.com"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', marginBottom: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
          />
          <input
            type="text"
            placeholder="Link title (optional)"
            value={linkTitle}
            onChange={(e) => setLinkTitle(e.target.value)}
            style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
          />
        </div>
      )}

      {mediaPreview && (
        <div className="media-preview">
          {mediaType === 'video' ? (
            <video src={mediaPreview} controls />
          ) : (
            <img src={mediaPreview} alt="Preview" />
          )}
          <button className="remove-media" onClick={() => { setMediaFile(null); setMediaPreview(null); setMediaType('text'); }}>×</button>
        </div>
      )}

      {error && <p className="error-msg">{error}</p>}

      <div className="create-post-actions">
        <div className="media-buttons">
          {user.can_post_pictures && (
            <button className="media-btn" onClick={() => { setMediaType('image'); fileRef.current?.click(); }}>
              📷 Photo
            </button>
          )}
          {user.can_post_videos && (
            <button className="media-btn" onClick={() => { setMediaType('video'); fileRef.current?.click(); }}>
              🎬 Video
            </button>
          )}
          {user.can_post_links && (
            <button className={`media-btn ${mediaType === 'link' ? 'active' : ''}`} onClick={() => setMediaType(mediaType === 'link' ? 'text' : 'link')}>
              🔗 Link
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*,video/*" hidden onChange={handleFileSelect} />
        </div>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? 'Posting...' : 'Post'}
        </button>
      </div>
    </div>
  );
}

export { Avatar };
