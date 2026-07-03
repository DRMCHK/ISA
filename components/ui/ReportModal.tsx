'use client';

import { useState } from 'react';
import { AlertTriangle, X, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export function ReportModal() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<'REPORT' | 'SUGGESTION'>('REPORT');
  const [content, setContent] = useState('');
  const [anonymous, setAnonymous] = useState(true);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);

    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, content, anonymous }),
    });

    setLoading(false);
    if (res.ok) {
      toast.success(type === 'REPORT' ? 'Report submitted anonymously.' : 'Suggestion submitted. Thank you!');
      setContent('');
      setOpen(false);
    } else {
      toast.error('Failed to submit. Please try again.');
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        id="report-btn"
        onClick={() => setOpen(true)}
        title="Report / Suggestion"
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-isa-600 hover:bg-isa-700 text-white shadow-lg hover:shadow-xl 
                   flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
      >
        <AlertTriangle size={20} />
      </button>

      {/* Modal overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="card w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Report / Suggestion</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Anonymous by default</p>
              </div>
              <button onClick={() => setOpen(false)} className="btn-ghost p-2">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type selector */}
              <div className="flex gap-3">
                {(['REPORT', 'SUGGESTION'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex-1 py-2.5 rounded-xl font-medium text-sm border transition-all ${
                      type === t
                        ? 'bg-isa-600 text-white border-isa-600'
                        : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-isa-400'
                    }`}
                  >
                    {t === 'REPORT' ? '🚨 Report' : '💡 Suggestion'}
                  </button>
                ))}
              </div>

              <textarea
                required
                rows={4}
                className="input resize-none"
                placeholder={type === 'REPORT' ? 'Describe the issue...' : 'Share your idea or feedback...'}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                maxLength={3000}
              />

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={(e) => setAnonymous(e.target.checked)}
                  className="w-4 h-4 accent-isa-600"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Submit anonymously <span className="text-gray-400 dark:text-gray-500">(your identity won&apos;t be stored)</span>
                </span>
              </label>

              <button
                type="submit"
                disabled={loading || !content.trim()}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><Send size={16} /> Submit</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
