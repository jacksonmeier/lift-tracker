import type { CSSProperties } from 'react';
import { useCountUp } from '../lib/useCountUp';

interface Props {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
  style?: CSSProperties;
}

function defaultFormat(n: number): string {
  return Math.round(n).toLocaleString();
}

export default function HeroNumber({ value, format, duration, className, style }: Props) {
  const display = useCountUp(value, duration);
  const fmt = format ?? defaultFormat;
  return (
    <span className={`hero-num ${className ?? ''}`} style={style}>
      {fmt(display)}
    </span>
  );
}
