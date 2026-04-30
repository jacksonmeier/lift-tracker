interface Props {
  className?: string;
}

export default function BrandMark({ className }: Props) {
  return <span aria-hidden="true" className={`brand-mark ${className ?? ''}`} />;
}
