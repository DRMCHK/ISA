import { useState, useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Avatar } from '../components/CreatePost';

export default function Groups() {
  const { user } = useAuth();
  const { id } = useParams();
  const [groups, setGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [addUserSearch, setAddUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '', groupType: 'directive' });
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef();
  const isAdmin = user.role === 'admin';

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (id) loadGroupDetail(parseInt(id));
  }, [id]);

  const loadGroups = async () => {
    try {
      const { groups: g } = await api.groups.list();
      setGroups(g);
    } finally {
      setLoading(false);
    }
  };

  const loadGroupDetail = async (groupId) => {
    const { group, members: m, myRole } = await api.groups.get(groupId);
    setActiveGroup({ ...group, myRole });
    setMembers(m);
    const { messages: msgs } = await api.groups.getMessages(groupId);
    setMessages(msgs);
  };

  const createGroup = async (e) => {
    e.preventDefault();
    try {
      const { group } = await api.groups.create(newGroup);
      setShowCreate(false);
      setNewGroup({ name: '', description: '', groupType: 'directive' });
      await loadGroups();
      loadGroupDetail(group.id);
    } catch (err) {
      alert(err.message);
    }
  };

  const searchUsers = async (q) => {
    setAddUserSearch(q);
    if (q.trim().length < 2) { setSearchResults([]); return; }
    try {
      const { users } = await api.users.search(q);
      setSearchResults(users.filter(u => !members.some(m => m.user_id === u.id)));
    } catch { setSearchResults([]); }
  };

  const addMember = async (userId) => {
    try {
      await api.groups.addMember(activeGroup.id, userId);
      setAddUserSearch('');
      setSearchResults([]);
      loadGroupDetail(activeGroup.id);
    } catch (err) {
      alert(err.message);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const { message } = await api.groups.sendMessage(activeGroup.id, text.trim());
      setMessages((prev) => [...prev, message]);
      setText('');
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      alert(err.message);
    }
  };

  const copyInviteLink = () => {
    const link = `${window.location.origin}/join-group/${activeGroup.invite_code}`;
    navigator.clipboard.writeText(link);
    alert('Invite link copied to clipboard!');
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div className="container messages-layout">
      <aside className="conversations-list card">
        <div className="groups-sidebar-header">
          <h3>Association Groups</h3>
          {isAdmin && (
            <button className="btn btn-sm btn-primary" onClick={() => setShowCreate(!showCreate)}>
              + Create
            </button>
          )}
        </div>

        {showCreate && isAdmin && (
          <form className="create-group-form" onSubmit={createGroup}>
            <input placeholder="Group name" value={newGroup.name} onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })} required />
            <textarea placeholder="Description" value={newGroup.description} onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })} rows={2} />
            <select value={newGroup.groupType} onChange={(e) => setNewGroup({ ...newGroup, groupType: e.target.value })}>
              <option value="directive">Directive Board</option>
              <option value="execution">Execution Team</option>
              <option value="general">General</option>
            </select>
            <button type="submit" className="btn btn-primary btn-sm">Create Group</button>
          </form>
        )}

        {groups.length === 0 ? (
          <p className="empty-hint">No groups yet. Admins can create directive and execution groups.</p>
        ) : (
          groups.map((g) => (
            <button
              key={g.id}
              className={`conv-item ${activeGroup?.id === g.id ? 'active' : ''}`}
              onClick={() => loadGroupDetail(g.id)}
            >
              <div className="group-icon">{g.group_type === 'directive' ? '🏛️' : g.group_type === 'execution' ? '⚙️' : '👥'}</div>
              <div>
                <span>{g.name}</span>
                <small>{g.member_count} members</small>
              </div>
            </button>
          ))
        )}
      </aside>

      <main className="chat-panel card">
        {activeGroup ? (
          <>
            <div className="chat-header">
              <div className="group-icon-lg">
                {activeGroup.group_type === 'directive' ? '🏛️' : activeGroup.group_type === 'execution' ? '⚙️' : '👥'}
              </div>
              <div style={{ flex: 1 }}>
                <strong>{activeGroup.name}</strong>
                <small>{activeGroup.description || activeGroup.group_type}</small>
              </div>
              {(activeGroup.myRole === 'leader' || isAdmin) && (
                <button className="btn btn-sm btn-secondary" onClick={copyInviteLink}>Copy Invite Link</button>
              )}
            </div>

            <div className="group-members-bar">
              {members.map((m) => (
                <div key={m.user_id} className="member-chip" title={m.full_name}>
                  <Avatar user={m} />
                  <span>{m.full_name.split(' ')[0]}</span>
                  {m.role === 'leader' && <small>Leader</small>}
                </div>
              ))}
            </div>

            {(activeGroup.myRole === 'leader' || isAdmin) && (
              <div className="add-member-bar">
                <input
                  type="text"
                  placeholder="Search member by name to add..."
                  value={addUserSearch}
                  onChange={(e) => searchUsers(e.target.value)}
                />
                {searchResults.length > 0 && (
                  <div className="search-results-dropdown">
                    {searchResults.map(u => (
                      <button key={u.id} type="button" onClick={() => addMember(u.id)}>
                        {u.full_name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="chat-messages">
              {messages.map((m) => (
                <div key={m.id} className={`chat-bubble ${m.user_id === user.id ? 'sent' : 'received'}`}>
                  {m.user_id !== user.id && <strong>{m.full_name}</strong>}
                  <p>{m.content}</p>
                  <time>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <form className="chat-input" onSubmit={sendMessage}>
              <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Message the group..." />
              <button type="submit" className="btn btn-primary">Send</button>
            </form>
          </>
        ) : (
          <div className="empty-state">
            <h3>Select a group</h3>
            <p>Join association groups via invite links shared by administrators.</p>
          </div>
        )}
      </main>
    </div>
  );
}
