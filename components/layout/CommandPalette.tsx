'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Users, FolderKanban, Building2,
  ArrowRight, Loader2, X, Command,
} from 'lucide-react';
import type { SearchResult } from '@/app/api/search/route';

// ─── Context ──────────────────────────────────────────────────────────────────
interface CommandPaletteCtx {
  open: () => void;
  close: () => void;
}

const Ctx = createContext<CommandPaletteCtx>({
  open: () => {},
  close: () => {},
});

export function useCommandPalette() {
  return useContext(Ctx);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const TYPE_ICON: Record<SearchResult['type'], React.ElementType> = {
  employee: Users,
  project: FolderKanban,
  department: Building2,
};

const TYPE_LABEL: Record<SearchResult['type'], string> = {
  employee: 'Employee',
  project: 'Project',
  department: 'Department',
};

const BADGE_CLS: Record<string, string> = {
  emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  amber: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  rose: 'bg-rose-500/15 text-rose-400 border-rose-500/25',
  slate: 'bg-slate-700/60 text-slate-400 border-slate-600/40',
  violet: 'bg-violet-500/15 text-violet-400 border-violet-500/25',
};

const TYPE_BG: Record<SearchResult['type'], string> = {
  employee: 'bg-violet-500/15 text-violet-400',
  project: 'bg-cyan-500/15 text-cyan-400',
  department: 'bg-amber-500/15 text-amber-400',
};

// ─── Quick-action shortcuts (no query needed) ─────────────────────────────────
const QUICK_ACTIONS: { label: string; subtitle: string; href: string; icon: React.ElementType }[] = [
  { label: 'Overview', subtitle: 'Company metrics & charts', href: '/overview', icon: Building2 },
  { label: 'Employees', subtitle: 'Browse all staff', href: '/employees', icon: Users },
  { label: 'Projects / POs', subtitle: 'Browse active projects', href: '/projects', icon: FolderKanban },
  { label: 'Departments', subtitle: 'Department breakdown', href: '/departments', icon: Building2 },
  { label: 'Upload Data', subtitle: 'Import Excel file', href: '/upload', icon: FolderKanban },
];

// ─── The modal itself ─────────────────────────────────────────────────────────
function Palette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (json.success) setResults(json.data.results);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Reset active index when results change
  useEffect(() => {
    setActiveIdx(0);
  }, [results, query]);

  const navigateTo = useCallback(
    (href: string) => {
      router.push(href);
      onClose();
    },
    [router, onClose],
  );

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const showingResults = query.trim() && results.length > 0;
    const items = showingResults ? results : [];
    const count = showingResults ? items.length : QUICK_ACTIONS.length;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, count - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (showingResults && items[activeIdx]) {
        navigateTo(items[activeIdx].href);
      } else if (!query.trim() && QUICK_ACTIONS[activeIdx]) {
        navigateTo(QUICK_ACTIONS[activeIdx].href);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-active="true"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIdx]);

  const showResults = query.trim().length > 0;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4"
      onClick={onClose}
    >
      {/* Blur overlay */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-xl bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800/60">
          {loading ? (
            <Loader2 className="w-4 h-4 text-slate-400 shrink-0 animate-spin" />
          ) : (
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
          )}
          <input
            ref={inputRef}
            type="text"
            placeholder="Search employees, projects, departments…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-500 font-mono">
            esc
          </kbd>
        </div>

        {/* Results / Quick actions */}
        <div ref={listRef} className="max-h-[360px] overflow-y-auto">
          {showResults ? (
            results.length > 0 ? (
              <div className="py-2">
                {results.map((result, idx) => {
                  const Icon = TYPE_ICON[result.type];
                  const isActive = idx === activeIdx;
                  return (
                    <button
                      key={result.id}
                      data-active={isActive}
                      onClick={() => navigateTo(result.href)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 text-left transition-colors group
                        ${isActive ? 'bg-violet-500/10' : 'hover:bg-slate-800/60'}
                      `}
                    >
                      {/* Type icon */}
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${TYPE_BG[result.type]}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isActive ? 'text-white' : 'text-slate-200'}`}>
                          {result.title}
                        </p>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {result.subtitle}
                        </p>
                      </div>
                      {/* Right side */}
                      <div className="flex items-center gap-2 shrink-0">
                        {result.badge && (
                          <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${BADGE_CLS[result.badgeColor ?? 'slate']}`}>
                            {result.badge}
                          </span>
                        )}
                        <ArrowRight className={`w-3.5 h-3.5 transition-opacity ${isActive ? 'text-violet-400 opacity-100' : 'text-slate-600 opacity-0 group-hover:opacity-100'}`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : !loading ? (
              <div className="py-12 text-center text-slate-500 text-sm">
                <Search className="w-8 h-8 mx-auto mb-3 text-slate-700" />
                No results for <span className="text-slate-400">"{query}"</span>
              </div>
            ) : null
          ) : (
            /* Quick actions */
            <div className="py-2">
              <p className="px-4 pt-1 pb-2 text-xs font-medium text-slate-600 uppercase tracking-wider">
                Quick Navigation
              </p>
              {QUICK_ACTIONS.map((action, idx) => {
                const Icon = action.icon;
                const isActive = idx === activeIdx;
                return (
                  <button
                    key={action.href}
                    data-active={isActive}
                    onClick={() => navigateTo(action.href)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors group
                      ${isActive ? 'bg-violet-500/10' : 'hover:bg-slate-800/60'}
                    `}
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${isActive ? 'text-white' : 'text-slate-300'}`}>
                        {action.label}
                      </p>
                      <p className="text-xs text-slate-600">{action.subtitle}</p>
                    </div>
                    <ArrowRight className={`w-3.5 h-3.5 transition-opacity ${isActive ? 'text-violet-400 opacity-100' : 'text-slate-700 opacity-0 group-hover:opacity-100'}`} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2.5 border-t border-slate-800/60 flex items-center gap-4 text-xs text-slate-600">
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-slate-800 border border-slate-700 rounded font-mono">↑</kbd>
            <kbd className="px-1 py-0.5 bg-slate-800 border border-slate-700 rounded font-mono">↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-slate-800 border border-slate-700 rounded font-mono">↵</kbd>
            open
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-slate-800 border border-slate-700 rounded font-mono">esc</kbd>
            close
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Provider (wraps the whole dashboard layout) ──────────────────────────────
export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  // Global Cmd+K / Ctrl+K listener
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((v) => !v);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <Ctx.Provider value={{ open, close }}>
      {children}
      {isOpen && <Palette onClose={close} />}
    </Ctx.Provider>
  );
}

// ─── Trigger button (for sidebar) ────────────────────────────────────────────
export function SearchTriggerButton() {
  const { open } = useCommandPalette();
  return (
    <button
      onClick={open}
      id="global-search-trigger"
      className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/40 text-slate-400 hover:text-slate-200 hover:border-slate-600/60 transition-all text-sm group"
    >
      <Search className="w-3.5 h-3.5 shrink-0" />
      <span className="flex-1 text-left text-xs">Search…</span>
      <span className="flex items-center gap-0.5 text-xs text-slate-600 group-hover:text-slate-500 transition-colors">
        <Command className="w-3 h-3" />
        <span>K</span>
      </span>
    </button>
  );
}
