'use client';

import { Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';

export function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('isa_theme', next ? 'dark' : 'light');
  }

  return (
    <button
      onClick={toggle}
      id="dark-mode-toggle"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
    >
      {isDark ? (
        <Sun size={20} className="text-amber-400" />
      ) : (
        <Moon size={20} className="text-gray-600" />
      )}
    </button>
  );
}
