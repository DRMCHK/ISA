import { useState } from 'react';
import { api } from '../api/client';

export default function Reports() {
  const [type, setType] = useState('suggestion');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const result = await api.reports.submit({ type, subject, message, isAnonymous });
      setSuccess(result.message);
      setSubject('');
      setMessage('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: 700, padding: '2rem 1rem' }}>
      <div className="card">
        <h2 style={{ marginBottom: '0.5rem' }}>Report & Advice</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Submit anonymous reports, suggestions, or advice to help improve the ISA community.
          Your identity is protected when anonymous mode is enabled.
        </p>

        <form className="report-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="suggestion">Suggestion</option>
              <option value="advice">Advice</option>
              <option value="report">Report an Issue</option>
            </select>
          </div>

          <div className="form-group">
            <label>Subject</label>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} required placeholder="Brief summary" />
          </div>

          <div className="form-group">
            <label>Message</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} required rows={6} placeholder="Describe your suggestion, advice, or issue in detail..." />
          </div>

          <label className="anonymous-toggle">
            <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} />
            Submit anonymously (recommended)
          </label>

          {error && <p className="error-msg">{error}</p>}
          {success && <p className="success-msg">{success}</p>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </form>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <h3 style={{ marginBottom: '0.75rem' }}>What can you report?</h3>
        <ul style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', paddingLeft: '1.25rem', lineHeight: 1.8 }}>
          <li>Inappropriate content or behavior</li>
          <li>Technical issues with the platform</li>
          <li>Suggestions for association events or programs</li>
          <li>Advice for improving student experience</li>
          <li>Concerns about community safety</li>
        </ul>
      </div>
    </div>
  );
}
