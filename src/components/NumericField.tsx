import { useEffect, useRef, useState } from 'react';

interface Props {
  value: number;
  onChange: (next: number) => void;
  inputMode: 'decimal' | 'numeric';
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
}

function format(n: number): string {
  return n === 0 ? '' : String(n);
}

function parse(text: string): number {
  if (text.trim() === '') return 0;
  const n = Number(text);
  return Number.isFinite(n) ? n : 0;
}

export default function NumericField({
  value,
  onChange,
  inputMode,
  ariaLabel,
  className,
  disabled,
}: Props) {
  const [text, setText] = useState(() => format(value));
  const lastCommittedRef = useRef(value);

  useEffect(() => {
    if (value !== lastCommittedRef.current) {
      setText(format(value));
      lastCommittedRef.current = value;
    }
  }, [value]);

  return (
    <input
      type="text"
      inputMode={inputMode}
      pattern={inputMode === 'numeric' ? '[0-9]*' : '[0-9]*[.,]?[0-9]*'}
      value={text}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={(e) => {
        const next = e.target.value;
        setText(next);
        const parsed = parse(next);
        lastCommittedRef.current = parsed;
        onChange(parsed);
      }}
      onFocus={(e) => e.currentTarget.select()}
      className={className}
    />
  );
}
