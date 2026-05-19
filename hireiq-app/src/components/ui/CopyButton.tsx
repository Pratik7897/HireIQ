'use client';

import { useState } from 'react';
import { useToast } from '@/components/ui/Toast';

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const { success } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      success(`${label} copied to clipboard`);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        background: 'transparent',
        border: 'none',
        color: copied ? 'var(--accent)' : 'var(--text-muted)',
        cursor: 'pointer',
        fontSize: 12,
        display: 'inline-flex',
        alignItems: 'center',
        padding: '0 4px',
        borderRadius: 4,
        transition: 'color 0.15s, background 0.15s',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      title={label}
      aria-label={label}
    >
      {copied ? '✓' : '⎘'}
    </button>
  );
}
