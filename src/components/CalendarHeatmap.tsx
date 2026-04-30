interface CalendarHeatmapProps {
  counts: Map<string, number>;
  weeks?: number;
  onCellTap?: (dateKey: string) => void;
}

const DAY_LABELS = ['Mon', '', 'Wed', '', 'Fri', '', ''] as const;

function bucketClass(count: number, isFuture: boolean): string {
  if (isFuture) {
    return 'bg-transparent border border-dashed border-[var(--hairline-soft)]';
  }
  if (count <= 0) return 'bg-[rgba(120,120,135,0.10)] dark:bg-[rgba(255,255,255,0.05)]';
  if (count <= 5) return 'bg-[rgb(var(--accent-rgb)/0.25)]';
  if (count <= 15) return 'bg-[rgb(var(--accent-rgb)/0.55)]';
  return 'bg-[rgb(var(--accent-rgb)/0.92)]';
}

function localKey(d: Date): string {
  return d.toLocaleDateString('en-CA');
}

interface Cell {
  key: string;
  date: Date;
  count: number;
  isFuture: boolean;
}

export default function CalendarHeatmap({
  counts,
  weeks = 12,
  onCellTap,
}: CalendarHeatmapProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dow = today.getDay() || 7;
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() - (dow - 1));
  const start = new Date(thisMonday);
  start.setDate(thisMonday.getDate() - (weeks - 1) * 7);

  const cells: Cell[] = [];
  for (let c = 0; c < weeks; c++) {
    for (let r = 0; r < 7; r++) {
      const d = new Date(start);
      d.setDate(start.getDate() + c * 7 + r);
      const key = localKey(d);
      cells.push({
        key,
        date: d,
        count: counts.get(key) ?? 0,
        isFuture: d.getTime() > today.getTime(),
      });
    }
  }

  return (
    <div
      className="grid gap-[3px]"
      style={{ gridTemplateColumns: `auto repeat(${weeks}, minmax(0, 1fr))` }}
    >
      {DAY_LABELS.map((label, i) => (
        <div
          key={`label-${i}`}
          className="text-faint flex items-center pr-1.5 text-[9px] font-medium tabular-nums"
          style={{ gridRow: i + 1, gridColumn: 1 }}
        >
          {label}
        </div>
      ))}
      {cells.map((cell, i) => {
        const col = Math.floor(i / 7) + 2;
        const row = (i % 7) + 1;
        const tappable = !cell.isFuture && cell.count > 0;
        const dateLabel = cell.date.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
        });
        const title = cell.isFuture
          ? dateLabel
          : `${dateLabel} · ${cell.count} ${cell.count === 1 ? 'set' : 'sets'}`;
        return (
          <button
            key={cell.key}
            type="button"
            disabled={!tappable}
            onClick={tappable ? () => onCellTap?.(cell.key) : undefined}
            aria-label={title}
            title={title}
            className={`aspect-square rounded-[4px] transition-opacity ${bucketClass(
              cell.count,
              cell.isFuture,
            )} ${tappable ? 'cursor-pointer active:opacity-70' : 'cursor-default'}`}
            style={{ gridColumn: col, gridRow: row }}
          />
        );
      })}
    </div>
  );
}
