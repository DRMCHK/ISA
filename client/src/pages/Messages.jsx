import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { api } from '../api/client';
import { Avatar } from '../components/CreatePost';
import { encryptMessage, decryptMessages } from '../utils/dmCrypto';

export default function Messages() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [searchParams, setSearchParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef();

  useEffect(() => {
    api.messages.conversations()
      .then(({ conversations: c }) => setConversations(c))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const friendId = searchParams.get('friend');
    if (friendId) {
      openConversation(parseInt(friendId));
    }
  }, [searchParams]);

  useEffect(() => {
    if (!socket || !activeConv) return;

    const handler = ({ conversationId, message }) => {
      if (conversationId !== activeConv.id) return;
      decryptMessages(user.id, activeConv.friend_id, [message]).then(([decrypted]) => {
        setMessages((prev) => [...prev, decrypted]);
      });
    };

    socket.on('new_dm', handler);
    return () => socket.off('new_dm', handler);
  }, [socket, activeConv, user.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openConversation = async (friendId) => {
    try {
      const { conversationId, friend } = await api.messages.startConversation(friendId);
      setActiveConv({ id: conversationId, friend_id: friend.id, friend_name: friend.full_name, friend_avatar: friend.avatar_url });

      const { messages: raw } = await api.messages.getMessages(conversationId);
      const decrypted = await decryptMessages(user.id, friend.id, raw);
      setMessages(decrypted);

      setConversations((prev) => {
        const exists = prev.some((c) => c.id === conversationId);
        if (exists) return prev;
        return [{ id: conversationId, friend_id: friend.id, friend_name: friend.full_name, friend_avatar: friend.avatar_url }, ...prev];
      });
    } catch (err) {
      alert(err.message);
    }
  };

  const selectConversation = async (conv) => {
    setActiveConv(conv);
    setSearchParams({});
    const { messages: raw } = await api.messages.getMessages(conv.id);
    const decrypted = await decryptMessages(user.id, conv.friend_id, raw);
    setMessages(decrypted);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeConv || sending) return;

    setSending(true);
    try {
      const encrypted = await encryptMessage(user.id, activeConv.friend_id, text.trim());
      const { message } = await api.messages.send(activeConv.id, encrypted);
      const [decrypted] = await decryptMessages(user.id, activeConv.friend_id, [message]);
      setMessages((prev) => [...prev, decrypted]);
      setText('');
    } catch (err) {
      alert(err.message);
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div className="container messages-layout">
      <aside className="conversations-list card">
        <h3>Private Messages</h3>
        <p className="dm-notice">End-to-end encrypted. Only you and your friend can read these messages.</p>
        {conversations.length === 0 ? (
          <p className="empty-hint">Add friends from their profile to start messaging.</p>
        ) : (
          conversations.map((c) => (
            <button
              key={c.id}
              className={`conv-item ${activeConv?.id === c.id ? 'active' : ''}`}
              onClick={() => selectConversation(c)}
            >
              <Avatar user={{ full_name: c.friend_name, avatar_url: c.friend_avatar }} />
              <span>{c.friend_name}</span>
            </button>
          ))
        )}
      </aside>

      <main className="chat-panel card">
        {activeConv ? (
          <>
            <div className="chat-header">
              <Avatar user={{ full_name: activeConv.friend_name, avatar_url: activeConv.friend_avatar }} />
              <div>
                <strong>{activeConv.friend_name}</strong>
                <small>Encrypted conversation</small>
              </div>
              <Link to={`/profile/${activeConv.friend_id}`} className="btn btn-sm btn-secondary">View Profile</Link>
            </div>

            <div className="chat-messages">
              {messages.map((m) => (
                <div key={m.id} className={`chat-bubble ${m.sender_id === user.id ? 'sent' : 'received'}`}>
                  <p>{m.text}</p>
                  <time>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <form className="chat-input" onSubmit={sendMessage}>
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type an encrypted message..."
              />
              <button type="submit" className="btn btn-primary" disabled={sending}>Send</button>
            </form>
          </>
        ) : (
          <div className="empty-state">
            <h3>Select a conversation</h3>
            <p>Choose a friend from the list or visit a friend's profile to message them.</p>
          </div>
        )}
      </main>
    </div>
  );
}
