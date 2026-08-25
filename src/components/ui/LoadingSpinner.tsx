interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-10 w-10 border-[3px]',
} as const;

export default function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  return (
    <div
      className={`${SIZE_MAP[size]} rounded-full border-white/10 border-t-[var(--accent-400)] animate-spin shrink-0 ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
