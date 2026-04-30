interface Props {
  active?: number;
  total?: number;
  className?: string;
}

export default function TickMarks({ active = 0, total = 14, className }: Props) {
  return (
    <div aria-hidden="true" className={`ticks ${className ?? ''}`}>
      {Array.from({ length: total }).map((_, i) => {
        const cls = i < active ? 'tall' : i % 4 === 0 ? 'med' : 'short';
        return <i key={i} className={cls} />;
      })}
    </div>
  );
}
