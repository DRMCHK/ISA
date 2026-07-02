const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('isa_token');
  const headers = { ...options.headers };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  auth: {
    login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (email, password, fullName) => request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, fullName }) }),
    me: () => request('/auth/me'),
  },
  users: {
    get: (id) => request(`/users/${id}`),
    updateProfile: (data) => request('/users/profile', { method: 'PUT', body: JSON.stringify(data) }),
    uploadAvatar: (file) => {
      const form = new FormData();
      form.append('avatar', file);
      return request('/users/avatar', { method: 'POST', body: form });
    },
    search: (q) => request(`/users/search?q=${encodeURIComponent(q)}`),
  },
  posts: {
    feed: (page = 1) => request(`/posts/feed?page=${page}`),
    search: (q) => request(`/posts/search?q=${encodeURIComponent(q)}`),
    userPosts: (userId) => request(`/posts/user/${userId}`),
    create: (formData) => request('/posts', { method: 'POST', body: formData }),
    like: (id) => request(`/posts/${id}/like`, { method: 'POST' }),
    comments: (id) => request(`/posts/${id}/comments`),
    addComment: (id, content) => request(`/posts/${id}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),
    delete: (id) => request(`/posts/${id}`, { method: 'DELETE' }),
  },
  reports: {
    submit: (data) => request('/reports', { method: 'POST', body: JSON.stringify(data) }),
    my: () => request('/reports/my'),
  },
  admin: {
    dashboard: () => request('/admin/dashboard'),
    users: () => request('/admin/users'),
    updatePermissions: (id, data) => request(`/admin/users/${id}/permissions`, { method: 'PUT', body: JSON.stringify(data) }),
    flaggedPosts: () => request('/admin/flagged-posts'),
    moderatePost: (id, action, reason) => request(`/admin/posts/${id}/moderate`, { method: 'PUT', body: JSON.stringify({ action, reason }) }),
    reports: (status) => request(`/admin/reports${status ? `?status=${status}` : ''}`),
    updateReport: (id, data) => request(`/admin/reports/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    moderationLog: () => request('/admin/moderation-log'),
    groups: () => request('/groups/admin/all'),
  },
  friends: {
    list: () => request('/friends'),
    requests: () => request('/friends/requests'),
    status: (userId) => request(`/friends/status/${userId}`),
    sendRequest: (userId) => request(`/friends/request/${userId}`, { method: 'POST' }),
    accept: (requestId) => request(`/friends/accept/${requestId}`, { method: 'POST' }),
    reject: (requestId) => request(`/friends/reject/${requestId}`, { method: 'POST' }),
    remove: (friendId) => request(`/friends/${friendId}`, { method: 'DELETE' }),
  },
  messages: {
    conversations: () => request('/messages/conversations'),
    startConversation: (friendId) => request(`/messages/conversations/${friendId}`, { method: 'POST' }),
    getMessages: (id) => request(`/messages/conversations/${id}/messages`),
    send: (id, data) => request(`/messages/conversations/${id}/messages`, { method: 'POST', body: JSON.stringify(data) }),
  },
  groups: {
    list: () => request('/groups'),
    create: (data) => request('/groups', { method: 'POST', body: JSON.stringify(data) }),
    get: (id) => request(`/groups/${id}`),
    previewInvite: (code) => request(`/groups/join/${code}`),
    join: (code) => request(`/groups/join/${code}`, { method: 'POST' }),
    addMember: (groupId, userId) => request(`/groups/${groupId}/members`, { method: 'POST', body: JSON.stringify({ userId }) }),
    removeMember: (groupId, userId) => request(`/groups/${groupId}/members/${userId}`, { method: 'DELETE' }),
    getMessages: (id) => request(`/groups/${id}/messages`),
    sendMessage: (id, content) => request(`/groups/${id}/messages`, { method: 'POST', body: JSON.stringify({ content }) }),
  },
};
