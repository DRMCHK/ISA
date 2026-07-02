import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { validatePassword, passwordStrength } from '../utils/password';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const pwCheck = validatePassword(password);
  const strength = passwordStrength(pwCheck.checks);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pwCheck.valid) {
      setError(pwCheck.error);
      return;
    }
    setLoading(true);
    setError('');
    try {
      await register(email, password, fullName);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/logo.png" alt="ISA Link" />
          <h1>Join ISA Link</h1>
          <p>International Student Association</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Your full name" />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@university.edu" />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Strong password" />
            {password && (
              <div className="password-strength">
                <span style={{ color: strength.color }}>{strength.label}</span>
                <ul className="pw-requirements">
                  <li className={pwCheck.checks.length ? 'met' : ''}>10+ characters</li>
                  <li className={pwCheck.checks.uppercase ? 'met' : ''}>Uppercase (A-Z)</li>
                  <li className={pwCheck.checks.lowercase ? 'met' : ''}>Lowercase (a-z)</li>
                  <li className={pwCheck.checks.number ? 'met' : ''}>Number (0-9)</li>
                  <li className={pwCheck.checks.symbol ? 'met' : ''}>Symbol (!@#$...)</li>
                </ul>
              </div>
            )}
          </div>
          {error && <p className="error-msg">{error}</p>}
          <button type="submit" className="btn btn-primary" disabled={loading || !pwCheck.valid}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already a member? <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
