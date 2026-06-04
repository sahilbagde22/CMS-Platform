'use client';

import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch by waiting for mount
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 dark:bg-slate-900 animate-pulse">
        <div className="h-5 w-5 bg-gray-200 dark:bg-slate-800 rounded-full"></div>
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        if (!document.startViewTransition) {
          setTheme(nextTheme);
          return;
        }
        document.startViewTransition(() => {
          setTheme(nextTheme);
        });
      }}
      className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 transition-all duration-200 ease-in-out hover:scale-105 active:scale-95"
      aria-label="Toggle theme"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </button>
  );
}
