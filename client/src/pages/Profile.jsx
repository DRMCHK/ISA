import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { api } from '../api/client';
import { Avatar } from '../components/CreatePost';
import PostCard from '../components/PostCard';

function OnlineIndicator({ online, show }) {
  if (!show) return null;
  return (
    <span className={`presence-badge ${online ? 'online' : 'offline'}`}>
      <span className="presence-dot" />
      {online ? 'Online' : 'Offline'}
    </span>
  );
}

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { isFriendOnline } = useSocket();
  const isOwnProfile = !id || parseInt(id) === user.id;
  const profileId = isOwnProfile ? user.id : parseInt(id);

  const [profile, setProfile] = useState(isOwnProfile ? user : null);
  const [posts, setPosts] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendStatus, setFriendStatus] = useState(null);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(!isOwnProfile);
  const [actionLoading, setActionLoading] = useState(false);

  const loadFriends = () => {
    api.friends.list().then(({ friends: f }) => setFriends(f)).catch(() => {});
  };

  const loadRequests = () => {
    api.friends.requests().then(({ incoming }) => setIncomingRequests(incoming)).catch(() => {});
  };

  useEffect(() => {
    if (isOwnProfile) {
      loadFriends();
      loadRequests();
    } else {
      api.users.get(profileId)
        .then(({ user: u }) => { setProfile(u); setLoading(false); })
        .catch(() => setLoading(false));

      api.friends.status(profileId).then(setFriendStatus).catch(() => {});
    }
    api.posts.userPosts(profileId).then(({ posts: p }) => setPosts(p));
  }, [profileId, isOwnProfile]);

  const startEdit = () => {
    setFullName(profile.full_name);
    setBio(profile.bio || '');
    setEditing(true);
  };

  const saveProfile = async () => {
    try {
      const { user: updated } = await api.users.updateProfile({ fullName, bio });
      setProfile(updated);
      updateUser(updated);
      setEditing(false);
      setMessage('Profile updated');
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const { user: updated } = await api.users.uploadAvatar(file);
      setProfile(updated);
      updateUser(updated);
      setMessage('Profile picture updated');
    } catch (err) {
      setMessage(err.message);
    }
  };

  const sendFriendRequest = async () => {
    setActionLoading(true);
    try {
      await api.friends.sendRequest(profileId);
      setFriendStatus({ status: 'pending_sent', online: null });
      setMessage('Friend request sent');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const acceptRequest = async (requestId) => {
    await api.friends.accept(requestId);
    loadFriends();
    loadRequests();
    if (!isOwnProfile) api.friends.status(profileId).then(setFriendStatus);
    setMessage('Friend request accepted');
  };

  const rejectRequest = async (requestId) => {
    await api.friends.reject(requestId);
    loadRequests();
    setMessage('Request declined');
  };

  const removeFriend = async () => {
    if (!confirm('Remove this friend?')) return;
    await api.friends.remove(profileId);
    setFriendStatus({ status: 'none', online: null });
    setMessage('Friend removed');
  };

  const openMessages = () => navigate(`/messages?friend=${profileId}`);

  const isFriend = friendStatus?.status === 'friends';
  const showOnline = !isOwnProfile && isFriend;
  const profileOnline = isFriend ? isFriendOnline(profileId) : friendStatus?.online;

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (!profile) return <div className="container empty-state"><h3>User not found</h3></div>;

  return (
    <div className="container" style={{ maxWidth: 700, padding: '2rem 1rem' }}>
      <div className="card">
        <div className="profile-header">
          <div className="profile-avatar-wrap">
            {isOwnProfile ? (
              <label className="avatar-upload">
                <Avatar user={profile} size="avatar-lg" />
                <div className="upload-overlay">Change</div>
                <input type="file" accept="image/*" onChange={handleAvatarUpload} />
              </label>
            ) : (
              <Avatar user={profile} size="avatar-lg" />
            )}
            {showOnline && (
              <OnlineIndicator online={profileOnline} show />
            )}
          </div>

          <div className="profile-info">
            {editing ? (
              <>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="profile-edit-input title" />
                <textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us about yourself..." rows={3} className="profile-edit-input" />
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-primary btn-sm" onClick={saveProfile}>Save</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>Cancel</button>
                </div>
              </>
            ) : (
              <>
                <h2>{profile.full_name}</h2>
                {profile.role !== 'member' && (
                  <span className={`badge badge-${profile.role}`}>{profile.role}</span>
                )}
                <p>{profile.bio || 'No bio yet'}</p>
                <div className="profile-stats">
                  <span>{profile.postCount ?? posts.length} posts</span>
                  {isOwnProfile && <span>{friends.length} friends</span>}
                  <span>Member since {new Date(profile.created_at).toLocaleDateString()}</span>
                </div>

                <div className="profile-actions">
                  {isOwnProfile && (
                    <button className="btn btn-secondary btn-sm" onClick={startEdit}>Edit Profile</button>
                  )}
                  {!isOwnProfile && friendStatus?.status === 'none' && (
                    <button className="btn btn-primary btn-sm" onClick={sendFriendRequest} disabled={actionLoading}>
                      Add Friend
                    </button>
                  )}
                  {!isOwnProfile && friendStatus?.status === 'pending_sent' && (
                    <button className="btn btn-secondary btn-sm" disabled>Request Sent</button>
                  )}
                  {!isOwnProfile && friendStatus?.status === 'pending_received' && (
                    <button className="btn btn-primary btn-sm" onClick={() => acceptRequest(friendStatus.requestId)}>
                      Accept Friend Request
                    </button>
                  )}
                  {!isOwnProfile && isFriend && (
                    <>
                      <button className="btn btn-primary btn-sm" onClick={openMessages}>Message</button>
                      <button className="btn btn-secondary btn-sm" onClick={removeFriend}>Unfriend</button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        {message && <p className="success-msg">{message}</p>}
      </div>

      {isOwnProfile && incomingRequests.length > 0 && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <h3>Friend Requests</h3>
          {incomingRequests.map((r) => (
            <div key={r.id} className="friend-request-item">
              <Link to={`/profile/${r.requester_id}`}>
                <Avatar user={{ full_name: r.full_name, avatar_url: r.avatar_url }} />
                <span>{r.full_name}</span>
              </Link>
              <div>
                <button className="btn btn-sm btn-primary" onClick={() => acceptRequest(r.id)}>Accept</button>
                <button className="btn btn-sm btn-secondary" onClick={() => rejectRequest(r.id)}>Decline</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isOwnProfile && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <h3>Friends {friends.length > 0 && `(${friends.length})`}</h3>
          {friends.length === 0 ? (
            <p className="empty-hint">No friends yet. Visit member profiles to connect.</p>
          ) : (
            <div className="friends-grid">
              {friends.map((f) => (
                <Link key={f.id} to={`/profile/${f.id}`} className="friend-card">
                  <div className="friend-avatar-wrap">
                    <Avatar user={f} />
                    <span className={`friend-online-dot ${isFriendOnline(f.id) ? 'online' : ''}`} />
                  </div>
                  <span>{f.full_name}</span>
                  <small className={isFriendOnline(f.id) ? 'online-text' : 'offline-text'}>
                    {isFriendOnline(f.id) ? 'Online' : 'Offline'}
                  </small>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      <h3 style={{ margin: '1.5rem 0 1rem' }}>Posts</h3>
      {posts.length === 0 ? (
        <div className="empty-state card"><p>No posts yet</p></div>
      ) : (
        posts.map(post => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );
}
