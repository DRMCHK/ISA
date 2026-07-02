import { useState, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Admin() {
  const { user } = useAuth();
  const [tab, setTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [flaggedPosts, setFlaggedPosts] = useState([]);
  const [reports, setReports] = useState([]);
  const [adminGroups, setAdminGroups] = useState([]);
  const [newGroup, setNewGroup] = useState({ name: '', description: '', groupType: 'directive' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTabData(tab);
  }, [tab]);

  const loadTabData = async (activeTab) => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'dashboard': {
          const { stats: s } = await api.admin.dashboard();
          setStats(s);
          break;
        }
        case 'users': {
          const { users: u } = await api.admin.users();
          setUsers(u);
          break;
        }
        case 'moderation': {
          const { posts } = await api.admin.flaggedPosts();
          setFlaggedPosts(posts);
          break;
        }
        case 'reports': {
          const { reports: r } = await api.admin.reports();
          setReports(r);
          break;
        }
        case 'groups': {
          const { groups: g } = await api.admin.groups();
          setAdminGroups(g);
          break;
        }
      }
    } catch {}
    setLoading(false);
  };

  const updatePermissions = async (userId, changes) => {
    await api.admin.updatePermissions(userId, changes);
    loadTabData('users');
  };

  const moderatePost = async (postId, action) => {
    await api.admin.moderatePost(postId, action);
    loadTabData('moderation');
  };

  const updateReport = async (reportId, status) => {
    await api.admin.updateReport(reportId, { status });
    loadTabData('reports');
  };

  const createGroup = async (e) => {
    e.preventDefault();
    try {
      await api.groups.create(newGroup);
      setNewGroup({ name: '', description: '', groupType: 'directive' });
      loadTabData('groups');
    } catch (err) {
      alert(err.message);
    }
  };

  const copyInvite = (code) => {
    navigator.clipboard.writeText(`${window.location.origin}/join-group/${code}`);
    alert('Invite link copied!');
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'users', label: 'Users & Permissions' },
    ...(user.role === 'admin' ? [{ id: 'groups', label: 'Association Groups' }] : []),
    { id: 'moderation', label: 'Content Moderation' },
    { id: 'reports', label: 'Reports & Advice' },
  ];

  return (
    <div className="container" style={{ padding: '2rem 1rem' }}>
      <h2 style={{ marginBottom: '0.5rem' }}>Admin Panel</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Manage users, content, and community reports</p>

      <div className="admin-tabs">
        {tabs.map(t => (
          <button key={t.id} className={`admin-tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : (
        <>
          {tab === 'dashboard' && stats && (
            <div className="admin-grid">
              <div className="card stat-card">
                <div className="stat-value">{stats.totalUsers}</div>
                <div className="stat-label">Active Users</div>
              </div>
              <div className="card stat-card">
                <div className="stat-value">{stats.totalPosts}</div>
                <div className="stat-label">Published Posts</div>
              </div>
              <div className="card stat-card">
                <div className="stat-value">{stats.flaggedPosts}</div>
                <div className="stat-label">Flagged Content</div>
              </div>
              <div className="card stat-card">
                <div className="stat-value">{stats.openReports}</div>
                <div className="stat-label">Open Reports</div>
              </div>
            </div>
          )}

          {tab === 'users' && (
            <div className="card" style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Permissions</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>{u.full_name}</td>
                      <td>{u.email}</td>
                      <td>
                        <select
                          value={u.role}
                          onChange={(e) => updatePermissions(u.id, { role: e.target.value })}
                          style={{ padding: '0.25rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text-primary)' }}
                        >
                          <option value="member">Member</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td>
                        <label className="permission-toggle">
                          <input type="checkbox" checked={!!u.can_post_pictures} onChange={(e) => updatePermissions(u.id, { canPostPictures: e.target.checked })} />
                          Photos
                        </label>
                        <label className="permission-toggle">
                          <input type="checkbox" checked={!!u.can_post_videos} onChange={(e) => updatePermissions(u.id, { canPostVideos: e.target.checked })} />
                          Videos
                        </label>
                        <label className="permission-toggle">
                          <input type="checkbox" checked={!!u.can_post_links} onChange={(e) => updatePermissions(u.id, { canPostLinks: e.target.checked })} />
                          Links
                        </label>
                      </td>
                      <td>
                        <span className={`badge ${u.is_active ? 'badge-resolved' : 'badge-flagged'}`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => updatePermissions(u.id, { isActive: !u.is_active })}
                        >
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'groups' && (
            <div>
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Create Directive / Execution Group</h3>
                <form onSubmit={createGroup} className="create-group-form" style={{ border: 'none', margin: 0, padding: 0 }}>
                  <input placeholder="Group name (e.g. ISA Directive Board)" value={newGroup.name} onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })} required />
                  <textarea placeholder="Description" value={newGroup.description} onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })} rows={2} />
                  <select value={newGroup.groupType} onChange={(e) => setNewGroup({ ...newGroup, groupType: e.target.value })}>
                    <option value="directive">Directive Board</option>
                    <option value="execution">Execution Team</option>
                    <option value="general">General</option>
                  </select>
                  <button type="submit" className="btn btn-primary btn-sm">Create Group</button>
                </form>
              </div>

              {adminGroups.length === 0 ? (
                <div className="empty-state card"><p>No groups created yet</p></div>
              ) : (
                adminGroups.map(g => (
                  <div key={g.id} className="card" style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>{g.name}</strong>
                        <span className="badge badge-moderator" style={{ marginLeft: '0.5rem' }}>{g.group_type}</span>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{g.description}</p>
                        <small style={{ color: 'var(--text-muted)' }}>{g.member_count} members · Created by {g.creator_name}</small>
                      </div>
                      <button className="btn btn-sm btn-secondary" onClick={() => copyInvite(g.invite_code)}>Copy Invite Link</button>
                    </div>
                    <div className="invite-link-box">{window.location.origin}/join-group/{g.invite_code}</div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'moderation' && (
            <div>
              {flaggedPosts.length === 0 ? (
                <div className="empty-state card"><p>No flagged content</p></div>
              ) : (
                flaggedPosts.map(post => (
                  <div key={post.id} className="card" style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong>{post.author_name}</strong>
                      <span className="badge badge-flagged">Score: {(post.moderation_score * 100).toFixed(0)}%</span>
                    </div>
                    <p style={{ marginBottom: '0.5rem' }}>{post.content}</p>
                    {post.moderation_flags?.length > 0 && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--warning)', marginBottom: '0.75rem' }}>
                        Flags: {post.moderation_flags.map((f, i) => (
                          <span key={i}>{f.type}{f.keyword ? `: ${f.keyword}` : ''}{f.reason ? `: ${f.reason}` : ''}; </span>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-sm btn-primary" onClick={() => moderatePost(post.id, 'approve')}>Approve</button>
                      <button className="btn btn-sm btn-danger" onClick={() => moderatePost(post.id, 'remove')}>Remove</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'reports' && (
            <div>
              {reports.length === 0 ? (
                <div className="empty-state card"><p>No reports submitted</p></div>
              ) : (
                reports.map(r => (
                  <div key={r.id} className="card" style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div>
                        <span className={`badge badge-${r.status === 'open' ? 'open' : 'resolved'}`}>{r.type}</span>
                        <strong style={{ marginLeft: '0.5rem' }}>{r.subject}</strong>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p style={{ marginBottom: '0.5rem', fontSize: '0.9rem' }}>{r.message}</p>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                      {r.is_anonymous ? 'Anonymous submission' : `From: ${r.reporter_name || 'Unknown'}`}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {r.status === 'open' && (
                        <>
                          <button className="btn btn-sm btn-primary" onClick={() => updateReport(r.id, 'reviewing')}>Review</button>
                          <button className="btn btn-sm btn-secondary" onClick={() => updateReport(r.id, 'resolved')}>Resolve</button>
                          <button className="btn btn-sm btn-secondary" onClick={() => updateReport(r.id, 'dismissed')}>Dismiss</button>
                        </>
                      )}
                      {r.status !== 'open' && (
                        <span className={`badge badge-${r.status === 'resolved' ? 'resolved' : 'open'}`}>{r.status}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
