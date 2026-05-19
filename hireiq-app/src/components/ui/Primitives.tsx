'use client';

import { ReactNode, useState, useEffect } from 'react';
import { initials, nameToHue } from '@/lib/utils';

interface AvatarProps {
  name?: string | null;
  size?: number;
  className?: string;
}

export function Avatar({ name, size = 32 }: AvatarProps) {
  const hue = nameToHue(name);
  const bg = `hsl(${hue}, 55%, 88%)`;
  const color = `hsl(${hue}, 55%, 30%)`;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.36,
        fontWeight: 600,
        flexShrink: 0,
        userSelect: 'none',
        letterSpacing: '-0.02em',
      }}
      aria-label={name || 'Unknown user'}
      title={name || 'Unknown'}
    >
      {initials(name)}
    </div>
  );
}

interface AvatarGroupProps {
  names: (string | null | undefined)[];
  size?: number;
  max?: number;
}

export function AvatarGroup({ names, size = 32, max = 4 }: AvatarGroupProps) {
  const visible = names.slice(0, max);
  const excess = names.length - visible.length;

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {visible.map((name, i) => (
        <div key={i} style={{ marginLeft: i > 0 ? -size * 0.25 : 0, borderRadius: '50%', border: '2px solid white' }}>
          <Avatar name={name} size={size} />
        </div>
      ))}
      {excess > 0 && (
        <div style={{
          marginLeft: -size * 0.25, width: size, height: size, borderRadius: '50%',
          background: '#F3F4F6', color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.35, fontWeight: 500, border: '2px solid white', zIndex: 10
        }}>
          +{excess}
        </div>
      )}
    </div>
  );
}

interface ScoreBarProps {
  score: number;
  max?: number;
  height?: number;
  animate?: boolean;
}

export function ScoreBar({ score, max = 100, height = 6, animate = true }: ScoreBarProps) {
  const [width, setWidth] = useState(0);
  const pct = Math.min(100, Math.max(0, (score / max) * 100));
  const color = pct >= 80 ? '#3B6D11' : pct >= 50 ? '#F59E0B' : '#DC2626';

  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => setWidth(pct), 50);
      return () => clearTimeout(timer);
    } else {
      setWidth(pct);
    }
  }, [pct, animate]);

  return (
    <div
      style={{
        height,
        background: '#E5E7EB',
        borderRadius: height / 2,
        overflow: 'hidden',
        width: '100%',
      }}
      role="progressbar"
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div
        style={{
          height: '100%',
          width: `${width}%`,
          background: color,
          borderRadius: height / 2,
          transition: animate ? 'width 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none',
        }}
      />
    </div>
  );
}

interface BadgeProps {
  children: ReactNode;
  variant?: 'green' | 'gray' | 'red' | 'yellow' | 'blue';
  className?: string;
}

export function Badge({ children, variant = 'gray', className = '' }: BadgeProps) {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {children}
    </span>
  );
}

interface SkillChipsProps {
  skills: string[];
  max?: number;
  highlight?: string[];
}

export function SkillChips({ skills, max = 10, highlight = [] }: SkillChipsProps) {
  const shown = skills.slice(0, max);
  const rest = skills.length - shown.length;
  const hlSet = new Set(highlight.map(s => s.toLowerCase()));

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
      {shown.map(s => (
        <span
          key={s}
          className="skill-chip"
          style={
            hlSet.has(s.toLowerCase())
              ? { background: '#EBF2E3', color: '#3B6D11', fontWeight: 500 }
              : {}
          }
        >
          {s}
        </span>
      ))}
      {rest > 0 && (
        <span className="skill-chip" style={{ color: 'var(--text-muted)' }}>
          +{rest}
        </span>
      )}
    </div>
  );
}

interface EmptyStateProps {
  title?: string;
  description: string;
  action?: ReactNode;
  icon?: string;
}

export function EmptyState({ title, description, action, icon = '📭' }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div style={{ fontSize: 32, marginBottom: 12 }}>{icon}</div>
      {title && (
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>
          {title}
        </div>
      )}
      <p className="empty-state-desc">{description}</p>
      {action}
    </div>
  );
}

interface LoadingRowsProps {
  rows?: number;
  cols?: number;
}

export function LoadingRows({ rows = 5, cols = 4 }: LoadingRowsProps) {
  return (
    <>
      {[...Array(rows)].map((_, i) => (
        <tr key={i}>
          {[...Array(cols)].map((_, j) => (
            <td key={j}>
              <div
                className="skeleton"
                style={{ height: 14, borderRadius: 3, width: j === 0 ? 120 : j === cols - 1 ? 50 : 80 }}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

interface SpinnerProps {
  size?: number;
  color?: string;
}

export function Spinner({ size = 20, color = 'var(--text-muted)' }: SpinnerProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

export function Tooltip({ children, text }: { children: ReactNode; text: string }) {
  const [show, setShow] = useState(false);
  return (
    <div
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && text && (
        <div style={{
          position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
          marginBottom: 8, padding: '4px 8px', background: '#1F2937', color: '#fff',
          fontSize: 11, borderRadius: 4, whiteSpace: 'nowrap', zIndex: 50,
          pointerEvents: 'none', animation: 'slideUp 0.1s ease',
        }}>
          {text}
          <div style={{
            position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
            borderWidth: 4, borderStyle: 'solid', borderColor: '#1F2937 transparent transparent transparent'
          }} />
        </div>
      )}
    </div>
  );
}
