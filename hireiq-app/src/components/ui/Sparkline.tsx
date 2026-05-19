'use client';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: string;
}

export function Sparkline({ 
  data, 
  width = 120, 
  height = 40, 
  color = 'var(--accent)', 
  fill = 'var(--accent-light)' 
}: SparklineProps) {
  if (!data || data.length === 0) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  
  // Padding to prevent strokes from being cut off
  const paddingY = 4;
  const usableHeight = height - paddingY * 2;
  
  const range = max - min || 1; // Prevent division by zero
  const stepX = width / (data.length - 1 || 1);

  const points = data.map((d, i) => {
    const x = i * stepX;
    // Invert Y axis because SVG coordinates start at top left
    const y = paddingY + usableHeight - ((d - min) / range) * usableHeight;
    return `${x},${y}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const fillPathD = `M 0,${height} L ${points.join(' L ')} L ${width},${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <path d={fillPathD} fill={fill} opacity={0.3} />
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
