/**
 * HireIQ — shared utilities
 */

/** Format ISO date string as "Jan 12, 2025" */
export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

/** Format ISO date string as "Jan 12" */
export function fmtDateShort(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Format relative time — "2 days ago" */
export function fmtRelative(iso: string | null | undefined): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return fmtDate(iso);
}

/** Clamp value between min and max */
export function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

/** Return color class based on score 0-100 */
export function scoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#3B6D11';
  if (score >= 40) return '#eab308';
  return '#ef4444';
}

/** Return badge class based on score */
export function scoreBadgeClass(score: number): string {
  if (score >= 80) return 'badge-green';
  if (score >= 60) return 'badge-blue';
  if (score >= 40) return 'badge-yellow';
  return 'badge-red';
}

/** Seniority level label */
export function seniorityLabel(level: string | null | undefined): string {
  const map: Record<string, string> = {
    entry: 'Entry level',
    mid: 'Mid level',
    senior: 'Senior',
    lead: 'Lead / Staff',
    executive: 'Executive',
  };
  return level ? (map[level] || level) : 'Unknown';
}

/** Format pipeline status */
export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    new: 'New',
    screening: 'Screening',
    interview: 'Interview',
    offer: 'Offer',
    hired: 'Hired',
    rejected: 'Rejected',
  };
  return map[status] || status;
}

export function statusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    new: 'badge-gray',
    screening: 'badge-blue',
    interview: 'badge-yellow',
    offer: 'badge-green',
    hired: 'badge-green',
    rejected: 'badge-red',
  };
  return map[status] || 'badge-gray';
}

/** Generate initials avatar text from name */
export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('');
}

/** Generate a deterministic hue from a string for avatar colors */
export function nameToHue(name: string | null | undefined): number {
  if (!name) return 200;
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % 360;
}

/** Download data as CSV file */
export function downloadCSV(rows: object[], filename: string) {
  if (!rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [
    keys.join(','),
    ...rows.map(r =>
      keys.map(k => {
        const v = (r as Record<string, unknown>)[k];
        const s = v == null ? '' : String(v);
        return s.includes(',') || s.includes('"') || s.includes('\n')
          ? `"${s.replace(/"/g, '""')}"`
          : s;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Truncate text to n chars */
export function truncate(s: string | null | undefined, n: number): string {
  if (!s) return '';
  return s.length > n ? s.slice(0, n) + '…' : s;
}

/** Parse a comma-separated skills string into array */
export function parseSkillsText(text: string): string[] {
  return text
    .split(/[,\n;]+/)
    .map(s => s.trim())
    .filter(Boolean);
}
