import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api/client';

export default function JoinGroup() {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [alreadyMember, setAlreadyMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    api.groups.previewInvite(inviteCode)
      .then(({ group: g, alreadyMember: am }) => {
        setGroup(g);
        setAlreadyMember(am);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [inviteCode]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      await api.groups.join(inviteCode);
      navigate(`/groups`);
    } catch (err) {
      setError(err.message);
    } finally {
      setJoining(false);
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  if (error && !group) {
    return (
      <div className="container empty-state card" style={{ maxWidth: 500, margin: '3rem auto' }}>
        <h3>Invalid Invite</h3>
        <p>{error}</p>
        <Link to="/groups" className="btn btn-primary">Go to Groups</Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 500, margin: '3rem auto' }}>
      <div className="card" style={{ textAlign: 'center' }}>
        <div className="group-icon-lg" style={{ margin: '0 auto 1rem' }}>
          {group.group_type === 'directive' ? '🏛️' : group.group_type === 'execution' ? '⚙️' : '👥'}
        </div>
        <h2>{group.name}</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{group.description}</p>
        <span className="badge badge-moderator">{group.group_type}</span>

        {alreadyMember ? (
          <>
            <p className="success-msg" style={{ marginTop: '1rem' }}>You are already a member of this group.</p>
            <Link to="/groups" className="btn btn-primary" style={{ marginTop: '1rem' }}>Open Groups</Link>
          </>
        ) : (
          <button className="btn btn-primary" onClick={handleJoin} disabled={joining} style={{ marginTop: '1.5rem' }}>
            {joining ? 'Joining...' : 'Join Group'}
          </button>
        )}
      </div>
    </div>
  );
}
