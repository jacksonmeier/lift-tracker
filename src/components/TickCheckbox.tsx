interface Props {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  kind?: 'done' | 'warm';
  ariaLabel: string;
}

export default function TickCheckbox({
  checked,
  onChange,
  disabled,
  kind = 'done',
  ariaLabel,
}: Props) {
  return (
    <label className={`tick-cb ${kind === 'warm' ? 'warm' : ''}`} aria-label={ariaLabel}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="box" aria-hidden="true" />
    </label>
  );
}
