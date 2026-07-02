import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Avatar } from './CreatePost';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function PostCard({ post, onUpdate }) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [liked, setLiked] = useState(post.liked);
  const [likesCount, setLikesCount] = useState(post.likes_count);

  const handleLike = async () => {
    try {
      const result = await api.posts.like(post.id);
      setLiked(result.liked);
      setLikesCount(c => result.liked ? c + 1 : c - 1);
    } catch {}
  };

  const loadComments = async () => {
    if (!showComments) {
      const { comments: data } = await api.posts.comments(post.id);
      setComments(data);
    }
    setShowComments(!showComments);
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const { comment } = await api.posts.addComment(post.id, commentText);
      setComments(prev => [...prev, comment]);
      setCommentText('');
    } catch {}
  };

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return;
    try {
      await api.posts.delete(post.id);
      onUpdate?.('delete', post.id);
    } catch {}
  };

  return (
    <div className="card post-card">
      {post.status === 'flagged' && (
        <div className="flag-warning">⚠ This post is under review</div>
      )}

      <div className="post-header">
        <Link to={`/profile/${post.author.id}`}>
          <Avatar user={post.author} />
        </Link>
        <div className="post-author-info">
          <Link to={`/profile/${post.author.id}`}>
            <h4>{post.author.full_name}</h4>
          </Link>
          <span>{timeAgo(post.created_at)}</span>
        </div>
        {(post.author.id === user.id || user.role === 'admin' || user.role === 'moderator') && (
          <button className="btn btn-sm btn-secondary" onClick={handleDelete} style={{ marginLeft: 'auto' }}>
            Delete
          </button>
        )}
      </div>

      {post.content && <div className="post-content">{post.content}</div>}

      {post.media_url && post.media_type === 'image' && (
        <div className="post-media">
          <img src={post.media_url} alt="Post media" />
        </div>
      )}

      {post.media_url && post.media_type === 'video' && (
        <div className="post-media">
          <video src={post.media_url} controls />
        </div>
      )}

      {post.link_url && (
        <a href={post.link_url} target="_blank" rel="noopener noreferrer" className="post-link">
          <strong>{post.link_title || 'Shared Link'}</strong>
          <small>{post.link_url}</small>
        </a>
      )}

      <div className="post-actions">
        <button className={`post-action-btn ${liked ? 'liked' : ''}`} onClick={handleLike}>
          {liked ? '❤️' : '🤍'} {likesCount}
        </button>
        <button className="post-action-btn" onClick={loadComments}>
          💬 {post.comments_count}
        </button>
      </div>

      {showComments && (
        <div className="comments-section">
          {comments.map(c => (
            <div key={c.id} className="comment">
              <Avatar user={{ full_name: c.full_name, avatar_url: c.avatar_url }} />
              <div className="comment-body">
                <strong>{c.full_name}</strong>
                <p>{c.content}</p>
              </div>
            </div>
          ))}
          <form className="comment-form" onSubmit={handleComment}>
            <input
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button type="submit" className="btn btn-sm btn-primary">Send</button>
          </form>
        </div>
      )}
    </div>
  );
}
