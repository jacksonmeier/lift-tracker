import type { CSSProperties } from 'react';

interface Props {
  count?: number;
}

const SOFT_GREEN = '#1aa84f';

export default function Spark({ count = 10 }: Props) {
  const dots = Array.from({ length: count }).map((_, i) => {
    const angle = (i / count) * Math.PI * 2;
    const r = 14 + ((i * 7) % 11);
    const dx = Math.cos(angle) * r;
    const dy = Math.sin(angle) * r;
    const color = i % 3 === 0 ? 'var(--color-accent-300)' : i % 3 === 1 ? 'var(--color-accent-500)' : SOFT_GREEN;
    const style: CSSProperties = {
      transform: `translate(${dx}px, ${dy}px)`,
      animationDelay: `${i * 12}ms`,
      background: color,
    };
    return <span key={i} style={style} />;
  });
  return (
    <span aria-hidden="true" className="spark">
      {dots}
    </span>
  );
}
