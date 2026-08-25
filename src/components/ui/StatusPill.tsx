import { motion } from 'motion/react';

type StatusColor = 'green' | 'teal' | 'amber' | 'red';

const COLOR_MAP: Record<StatusColor, string> = {
  green: 'bg-green-500',
  teal: 'bg-[var(--accent-400)]',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
};

interface StatusPillProps {
  color: StatusColor;
  label: string;
  pulsing?: boolean;
  className?: string;
}

export default function StatusPill({ color, label, pulsing = false, className = '' }: StatusPillProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full glass text-[10px] font-semibold tracking-wide uppercase ${className}`}>
      <span className="relative flex h-2 w-2">
        {pulsing && (
          <motion.span
            className={`absolute inset-0 rounded-full ${COLOR_MAP[color]} opacity-40`}
            animate={{ scale: [1, 1.8], opacity: [0.4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
        <span className={`relative block h-2 w-2 rounded-full ${COLOR_MAP[color]}`} />
      </span>
      <span className="text-[var(--text-muted)]">{label}</span>
    </span>
  );
}
