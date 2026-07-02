import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { useSocket } from '../context/SocketContext';
import CreatePost from '../components/CreatePost';
import PostCard from '../components/PostCard';

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search');
  const { socket } = useSocket();

  const loadFeed = useCallback(async (pageNum = 1, append = false) => {
    try {
      let data;
      if (searchQuery) {
        data = await api.posts.search(searchQuery);
        setPosts(data.posts);
        setHasMore(false);
      } else {
        data = await api.posts.feed(pageNum);
        setPosts(prev => append ? [...prev, ...data.posts] : data.posts);
        setHasMore(data.hasMore);
      }
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    setLoading(true);
    setPage(1);
    loadFeed(1);
  }, [loadFeed]);

  useEffect(() => {
    if (!socket) return;

    const handleNewPost = (post) => {
      setPosts(prev => {
        if (prev.some(p => p.id === post.id)) return prev;
        return [post, ...prev];
      });
    };

    socket.on('new_post', handleNewPost);
    return () => socket.off('new_post', handleNewPost);
  }, [socket]);

  const handlePostCreated = (post) => {
    setPosts(prev => [post, ...prev]);
  };

  const handlePostUpdate = (action, postId) => {
    if (action === 'delete') {
      setPosts(prev => prev.filter(p => p.id !== postId));
    }
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    loadFeed(next, true);
  };

  return (
    <div className="container page-layout">
      <aside className="sidebar-left">
        <div className="card sidebar-card">
          <h3>About ISA Link</h3>
          <p>
            A unified voice for international students. Connect, share resources,
            and grow together in a safe, professional environment.
          </p>
        </div>
        <div className="card sidebar-card">
          <h3>Community Guidelines</h3>
          <p>
            Keep posts educational and professional. Respect all members.
            Report inappropriate content anonymously via Report & Advice.
          </p>
        </div>
      </aside>

      <main>
        {searchQuery && (
          <div className="card" style={{ marginBottom: '1rem', padding: '0.75rem 1rem' }}>
            Search results for: <strong>{searchQuery}</strong>
          </div>
        )}

        {!searchQuery && <CreatePost onPostCreated={handlePostCreated} />}

        {loading ? (
          <div className="loading-spinner"><div className="spinner" /></div>
        ) : posts.length === 0 ? (
          <div className="empty-state card">
            <h3>No posts yet</h3>
            <p>Be the first to share something with the ISA community!</p>
          </div>
        ) : (
          posts.map(post => (
            <PostCard key={post.id} post={post} onUpdate={handlePostUpdate} />
          ))
        )}

        {hasMore && !searchQuery && (
          <div style={{ textAlign: 'center', margin: '1rem 0' }}>
            <button className="btn btn-secondary" onClick={loadMore}>Load More</button>
          </div>
        )}
      </main>

      <aside className="sidebar-right">
        <div className="card sidebar-card">
          <h3>Empowered To Succeed</h3>
          <p>
            ISA Link helps international students build networks, share knowledge,
            and access association resources in one place.
          </p>
        </div>
        <div className="card sidebar-card">
          <h3>Need Help?</h3>
          <p>
            Use the Report & Advice section to submit anonymous suggestions,
            report issues, or share advice with association leadership.
          </p>
        </div>
      </aside>
    </div>
  );
}
