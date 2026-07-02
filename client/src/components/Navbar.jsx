import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim().length >= 2) {
      navigate(`/?search=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <img src="/logo.png" alt="ISA Link" />
        <div>
          <span>ISA Link</span>
          <small>Empowered To Succeed</small>
        </div>
      </Link>

      <form className="navbar-search" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search posts and members..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </form>

      <div className="navbar-actions">
        <Link to="/" className="nav-link">Feed</Link>
        <Link to="/messages" className="nav-link">Messages</Link>
        <Link to="/groups" className="nav-link">Groups</Link>
        <Link to="/profile" className="nav-link">Profile</Link>
        <Link to="/reports" className="nav-link">Report & Advice</Link>

        {(user?.role === 'admin' || user?.role === 'moderator') && (
          <Link to="/admin" className="nav-link">Admin</Link>
        )}

        <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>

        <button className="nav-link" onClick={logout} style={{ background: 'none', border: 'none' }}>
          Logout
        </button>
      </div>
    </nav>
  );
}
