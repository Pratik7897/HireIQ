'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/Primitives';

interface SearchResult {
  type: 'candidate' | 'job';
  id: string;
  title: string;
  subtitle: string;
  href: string;
}

interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('hireiq_recent_searches') || '[]');
      setRecentSearches(stored.slice(0, 5));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const [cRes, jRes] = await Promise.all([
        fetch(`/api/candidates?search=${encodeURIComponent(q)}&limit=5`).then(r => r.json()),
        fetch(`/api/jobs?search=${encodeURIComponent(q)}&limit=5`).then(r => r.json()),
      ]);

      const candidateResults: SearchResult[] = (cRes.candidates || []).map((c: any) => ({
        type: 'candidate' as const,
        id: c.id,
        title: c.name || 'Unknown candidate',
        subtitle: [c.email, c.location].filter(Boolean).join(' · ') || 'No details',
        href: `/candidates/${c.id}`,
      }));

      const jobResults: SearchResult[] = (jRes.jobs || []).map((j: any) => ({
        type: 'job' as const,
        id: j.id,
        title: j.title || 'Untitled job',
        subtitle: [j.department, j.seniority_level].filter(Boolean).join(' · ') || 'No details',
        href: `/jobs/${j.id}`,
      }));

      setResults([...candidateResults, ...jobResults]);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, search]);

  const navigate = (href: string) => {
    if (query.trim()) {
      const recent = [query, ...recentSearches.filter(r => r !== query)].slice(0, 5);
      localStorage.setItem('hireiq_recent_searches', JSON.stringify(recent));
    }
    router.push(href);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = results[selectedIdx];
      if (item) navigate(item.href);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => { setSelectedIdx(0); }, [results]);

  if (!open) return null;

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.35)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: 80,
        animation: 'fadeIn 0.1s ease',
      }}
    >
      <div
        style={{
          background: '#FFFFFF', borderRadius: 12, border: '1px solid #E5E7EB',
          width: '100%', maxWidth: 580,
          boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
          overflow: 'hidden',
          animation: 'slideUp 0.15s ease',
        }}
      >
        {/* Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid #F3F4F6' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search candidates, jobs, skills…"
            style={{
              flex: 1, fontSize: 14, border: 'none', outline: 'none',
              background: 'transparent', color: '#374151', height: 'auto', padding: 0,
            }}
          />
          {loading && (
            <span style={{
              width: 14, height: 14, border: '2px solid #9CA3AF', borderTopColor: 'transparent',
              borderRadius: '50%', display: 'inline-block', animation: 'spin 0.6s linear infinite',
            }} />
          )}
          <span style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0 }}>esc</span>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {query.trim() === '' ? (
            recentSearches.length > 0 ? (
              <div>
                <div style={{ padding: '8px 16px 4px', fontSize: 11, fontWeight: 500, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Recent searches
                </div>
                {recentSearches.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => setQuery(r)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                      padding: '10px 16px', border: 'none', background: 'transparent',
                      cursor: 'pointer', fontSize: 13, color: '#374151', fontFamily: 'inherit',
                      textAlign: 'left',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#F9FAFB')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <span style={{ color: '#9CA3AF', fontSize: 12 }}>↺</span>
                    {r}
                  </button>
                ))}
              </div>
            ) : (
              <div style={{ padding: '24px 16px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                Search candidates, jobs, and skills
              </div>
            )
          ) : results.length === 0 && !loading ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <>
              {/* Group by type */}
              {['candidate', 'job'].map(type => {
                const group = results.filter(r => r.type === type);
                if (!group.length) return null;
                return (
                  <div key={type}>
                    <div style={{ padding: '8px 16px 4px', fontSize: 11, fontWeight: 500, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {type === 'candidate' ? 'Candidates' : 'Jobs'}
                    </div>
                    {group.map((item, i) => {
                      const globalIdx = results.indexOf(item);
                      const isSelected = selectedIdx === globalIdx;
                      return (
                        <button
                          key={item.id}
                          onClick={() => navigate(item.href)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                            padding: '10px 16px', border: 'none',
                            background: isSelected ? '#F5F5F5' : 'transparent',
                            cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                          }}
                          onMouseEnter={() => setSelectedIdx(globalIdx)}
                        >
                          {type === 'candidate' ? (
                            <Avatar name={item.title} size={28} />
                          ) : (
                            <div style={{
                              width: 28, height: 28, borderRadius: 6, background: '#EBF2E3',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 13, flexShrink: 0,
                            }}>
                              💼
                            </div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>
                              {item.title}
                            </div>
                            <div style={{ fontSize: 12, color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {item.subtitle}
                            </div>
                          </div>
                          <span style={{ fontSize: 12, color: '#9CA3AF' }}>→</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Footer shortcuts */}
        <div style={{ padding: '8px 16px', borderTop: '1px solid #F3F4F6', display: 'flex', gap: 16 }}>
          {[['↑↓', 'Navigate'], ['↵', 'Open'], ['Esc', 'Close']].map(([key, label]) => (
            <span key={key} style={{ fontSize: 11, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 4 }}>
              <kbd style={{
                background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 3,
                padding: '1px 5px', fontSize: 10, fontFamily: 'monospace',
              }}>{key}</kbd>
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
