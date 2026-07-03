'use client';

import { useEffect, useState } from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('isa_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = stored === 'dark' || (!stored && prefersDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  // Prevent flash of wrong theme
  if (!mounted) {
    return (
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function(){
              var s=localStorage.getItem('isa_theme');
              var p=window.matchMedia('(prefers-color-scheme:dark)').matches;
              if(s==='dark'||(s===null&&p)){document.documentElement.classList.add('dark');}
            })()
          `,
        }}
      />
    );
  }

  return <>{children}</>;
}
