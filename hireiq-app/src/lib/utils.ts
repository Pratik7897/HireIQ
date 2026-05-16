import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-400';
  if (score >= 60) return 'text-yellow-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-400';
}

export function getScoreBg(score: number): string {
  if (score >= 80) return 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400';
  if (score >= 60) return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400';
  if (score >= 40) return 'bg-orange-500/20 border-orange-500/30 text-orange-400';
  return 'bg-red-500/20 border-red-500/30 text-red-400';
}

export function getBiasColor(risk: string): string {
  if (risk === 'low') return 'text-emerald-400';
  if (risk === 'medium') return 'text-yellow-400';
  return 'text-red-400';
}

export function getBiasBg(risk: string): string {
  if (risk === 'low') return 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400';
  if (risk === 'medium') return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400';
  return 'bg-red-500/20 border-red-500/30 text-red-400';
}

export function truncate(str: string, max: number): string {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '…' : str;
}
