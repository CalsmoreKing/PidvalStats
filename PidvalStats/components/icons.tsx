export function BallIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <circle cx="12" cy="12" r="10" fill="#F2EDE3" stroke="#17102A" strokeWidth="1" />
      <path
        d="M12 7l3.5 2.5-1.3 4.1H9.8L8.5 9.5 12 7zM12 3.2v3.3M12 20.8v-3.3M4 9.5l2.9 1M17.1 10.5l2.9-1M6 18l1.7-3.1M16.3 14.9L18 18"
        stroke="#17102A"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Ручка для перетягування гравця між командами (RosterManager) — 2x3 крапки,
// стандартна іконографія drag-handle, замість емодзі чи системного курсора.
export function GripIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="currentColor">
      <circle cx="6" cy="4" r="1.6" />
      <circle cx="14" cy="4" r="1.6" />
      <circle cx="6" cy="10" r="1.6" />
      <circle cx="14" cy="10" r="1.6" />
      <circle cx="6" cy="16" r="1.6" />
      <circle cx="14" cy="16" r="1.6" />
    </svg>
  );
}

export function BootIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path
        d="M6 3h5v6.2c0 1 .5 1.9 1.4 2.4l6.1 3.5c1 .6 1.5 1.6 1.5 2.8v1.1H4c-.6 0-1-.4-1-1v-4.5C3 10.8 4.2 8 6 6.3V3z"
        fill="#D4AF37"
        stroke="#8A6F22"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <path d="M4.5 15.5h15.5" stroke="#8A6F22" strokeWidth="0.8" />
    </svg>
  );
}
