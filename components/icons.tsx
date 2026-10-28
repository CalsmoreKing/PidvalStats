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
    <svg viewBox="0 0 24 24" className={className}>
      {/* Халява черевика */}
      <path
        d="M5 15.2V7.5c0-1 .6-1.9 1.5-2.3l2.8-1.3c.6-.3 1.2.1 1.2.8v3.6c0 .7.4 1.3 1 1.7l5.6 3.2c1 .6 1.6 1.6 1.6 2.8v.2H5z"
        fill="#D4AF37"
        stroke="#8A6F22"
        strokeWidth="0.7"
        strokeLinejoin="round"
      />
      {/* Шнурівка — щоб читалось саме як взуття, а не гола нога */}
      <path d="M8 6.4l2 .9M7.6 8.3l2 .9" stroke="#8A6F22" strokeWidth="0.6" strokeLinecap="round" />
      {/* Товста темна підошва */}
      <rect x="4.3" y="15" width="15.4" height="1.6" rx="0.5" fill="#17102A" />
      {/* Шипи знизу — головна ознака бутси */}
      <rect x="6.5" y="16.6" width="1" height="1.2" rx="0.25" fill="#17102A" />
      <rect x="11.5" y="16.6" width="1" height="1.2" rx="0.25" fill="#17102A" />
      <rect x="16.5" y="16.6" width="1" height="1.2" rx="0.25" fill="#17102A" />
    </svg>
  );
}
