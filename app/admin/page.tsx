'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/Avatar';
import { formatRelativeTime } from '@/lib/utils';
import { Users, Flag, AlertTriangle, Plus, Trash2, ShieldCheck, ShieldOff, Loader2, Users2, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

type Tab = 'members' | 'posts' | 'reports' | 'groups';

interface AdminUser {
  id: string; name: string; email: string; username: string;
  role: 'MEMBER' | 'ADMIN'; isOnline: boolean; createdAt: string;
  _count: { posts: number; sentMessages: number };
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('members');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [flaggedPosts, setFlaggedPosts] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', username: '', password: '', role: 'MEMBER' });
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'ADMIN') { router.push('/feed'); return; }
    loadAll();
  }, [session, status]);

  async function loadAll() {
    setLoading(true);
    const [u, p, r, g] = await Promise.all([
      fetch('/api/admin/users').then(r => r.json()),
      fetch('/api/admin/posts').then(r => r.json()),
      fetch('/api/admin/reports').then(r => r.json()),
      fetch('/api/groups').then(r => r.json()),
    ]);
    setUsers(u.users ?? []);
    setFlaggedPosts(p.posts ?? []);
    setReports(r.reports ?? []);
    setGroups(g.groups ?? []);
    setLoading(false);
  }

  async function deleteUser(id: string) {
    if (!confirm('Ban/delete this user?')) return;
    const res = await fetch(`/api/admin/users?userId=${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('User removed'); setUsers(prev => prev.filter(u => u.id !== id)); }
    else toast.error('Failed');
  }

  async function toggleRole(user: AdminUser) {
    const newRole = user.role === 'ADMIN' ? 'MEMBER' : 'ADMIN';
    const res = await fetch('/api/admin/users', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, role: newRole }),
    });
    if (res.ok) {
      toast.success(`Role changed to ${newRole}`);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
    }
  }

  async function handleApprovePost(id: string) {
    const res = await fetch(`/api/posts/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flagged: false }),
    });
    if (res.ok) { toast.success('Post approved'); setFlaggedPosts(prev => prev.filter(p => p.id !== id)); }
  }

  async function handleDeletePost(id: string) {
    const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
    if (res.ok) { toast.success('Post deleted'); setFlaggedPosts(prev => prev.filter(p => p.id !== id)); }
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/admin/users', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    });
    const data = await res.json();
    if (res.ok) { toast.success('Account created'); setShowCreateUser(false); loadAll(); }
    else toast.error(data.error ?? 'Failed');
  }

  async function createGroup(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/groups', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newGroup),
    });
    const data = await res.json();
    if (res.ok) { toast.success('Group created'); setShowCreateGroup(false); setNewGroup({ name: '', description: '' }); loadAll(); }
    else toast.error(data.error ?? 'Failed');
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'members', label: 'Members', icon: <Users size={16} />, badge: users.length },
    { key: 'posts', label: 'Flagged Posts', icon: <Flag size={16} />, badge: flaggedPosts.length },
    { key: 'reports', label: 'Reports', icon: <AlertTriangle size={16} />, badge: reports.length },
    { key: 'groups', label: 'Groups', icon: <Users2 size={16} /> },
  ];

  if (loading) return (
    <div className="flex justify-center items-center py-20">
      <Loader2 className="animate-spin text-isa-600" size={32} />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">ISA Link · {session?.user.name}</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl">
        {tabs.map(({ key, label, icon, badge }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-sm font-medium transition-all ${
              tab === key ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}>
            {icon}
            <span className="hidden sm:block">{label}</span>
            {badge !== undefined && badge > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === key ? 'bg-isa-100 dark:bg-isa-900 text-isa-700 dark:text-isa-300' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'}`}>
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Members tab */}
      {tab === 'members' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => setShowCreateUser(true)} className="btn-primary flex items-center gap-2 text-sm">
              <Plus size={16} /> Create Account
            </button>
          </div>

          {showCreateUser && (
            <div className="card p-5">
              <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Create New Account</h3>
              <form onSubmit={createUser} className="grid grid-cols-2 gap-3">
                <input className="input text-sm" placeholder="Full name" required value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                <input className="input text-sm" placeholder="Username" required value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
                <input className="input text-sm col-span-2" type="email" placeholder="Email" required value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                <input className="input text-sm" type="password" placeholder="Password (min 12 chars, upper+lower+digit+symbol)" required value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                <select className="input text-sm" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                </select>
                <div className="col-span-2 flex gap-2">
                  <button type="submit" className="btn-primary text-sm">Create</button>
                  <button type="button" onClick={() => setShowCreateUser(false)} className="btn-secondary text-sm">Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div className="card divide-y divide-gray-100 dark:divide-gray-800">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-3 p-3">
                <Avatar name={u.name} size="sm" isOnline={u.isOnline} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 dark:text-white">{u.name} <span className="text-xs text-gray-400">@{u.username}</span></p>
                  <p className="text-xs text-gray-400">{u.email} · {u._count.posts} posts · Joined {formatRelativeTime(u.createdAt)}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === 'ADMIN' ? 'bg-isa-100 dark:bg-isa-900 text-isa-700 dark:text-isa-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>{u.role}</span>
                <button onClick={() => toggleRole(u)} title={u.role === 'ADMIN' ? 'Demote to member' : 'Promote to admin'}
                  className="btn-ghost p-1.5 text-gray-400">
                  {u.role === 'ADMIN' ? <ShieldOff size={15} /> : <ShieldCheck size={15} />}
                </button>
                <button onClick={() => deleteUser(u.id)} title="Delete user" className="btn-ghost p-1.5 text-red-400 hover:text-red-500">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Flagged posts tab */}
      {tab === 'posts' && (
        <div className="space-y-3">
          {flaggedPosts.length === 0 ? (
            <div className="card p-10 text-center text-gray-400 dark:text-gray-500">No flagged posts 🎉</div>
          ) : (
            flaggedPosts.map((p) => (
              <div key={p.id} className="card p-4 border-l-4 border-amber-400">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar name={p.author.name} avatarUrl={p.author.avatarUrl} size="xs" />
                  <span className="font-medium text-sm">{p.author.name}</span>
                  <span className="text-xs text-gray-400">{formatRelativeTime(p.createdAt)}</span>
                </div>
                {p.content && <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{p.content}</p>}
                {p.linkUrl && <p className="text-xs text-gray-400 mb-3">🔗 {p.linkUrl}</p>}
                <div className="flex gap-2">
                  <button onClick={() => handleApprovePost(p.id)} className="btn-secondary text-xs flex items-center gap-1 text-green-600"><Check size={13} /> Approve</button>
                  <button onClick={() => handleDeletePost(p.id)} className="btn-secondary text-xs flex items-center gap-1 text-red-600"><X size={13} /> Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Reports tab */}
      {tab === 'reports' && (
        <div className="space-y-3">
          {reports.length === 0 ? (
            <div className="card p-10 text-center text-gray-400 dark:text-gray-500">No reports yet.</div>
          ) : (
            reports.map((r) => (
              <div key={r.id} className={`card p-4 border-l-4 ${r.type === 'REPORT' ? 'border-red-400' : 'border-blue-400'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.type === 'REPORT' ? 'bg-red-100 dark:bg-red-900/20 text-red-600' : 'bg-blue-100 dark:bg-blue-900/20 text-blue-600'}`}>
                    {r.type}
                  </span>
                  <span className="text-xs text-gray-400">{formatRelativeTime(r.createdAt)}</span>
                  {r.anonymous && <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">Anonymous</span>}
                  {!r.anonymous && r.author && <span className="text-xs text-gray-500">from @{r.author.username}</span>}
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">{r.content}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* Groups tab */}
      {tab === 'groups' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <button onClick={() => setShowCreateGroup(true)} className="btn-primary flex items-center gap-2 text-sm">
              <Plus size={16} /> Create Group
            </button>
          </div>

          {showCreateGroup && (
            <div className="card p-5">
              <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Create New Group</h3>
              <form onSubmit={createGroup} className="space-y-3">
                <input className="input text-sm" placeholder="Group name" required value={newGroup.name} onChange={e => setNewGroup({...newGroup, name: e.target.value})} />
                <input className="input text-sm" placeholder="Description (optional)" value={newGroup.description} onChange={e => setNewGroup({...newGroup, description: e.target.value})} />
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary text-sm">Create</button>
                  <button type="button" onClick={() => setShowCreateGroup(false)} className="btn-secondary text-sm">Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div className="card divide-y divide-gray-100 dark:divide-gray-800">
            {groups.map((g: any) => (
              <div key={g.id} className="flex items-center gap-3 p-3">
                <div className="w-9 h-9 rounded-xl bg-isa-100 dark:bg-isa-900 flex items-center justify-center text-isa-600 font-bold text-sm">
                  {g.name[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-gray-900 dark:text-white">{g.name}</p>
                  <p className="text-xs text-gray-400">{g._count?.members ?? 0} members</p>
                </div>
                <a href={`/groups/${g.id}`} className="btn-secondary text-xs py-1.5">View</a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
