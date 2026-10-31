// Золотий м'яч — центральний елемент сцени. Чистий SVG: ніякого растру.
export default function GoldBall({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`} aria-hidden>
      <div className="absolute inset-[-28%] rounded-full bg-[radial-gradient(circle,rgba(243,204,92,0.38),transparent_62%)]" />
      <svg viewBox="0 0 200 200" className="relative animate-ball drop-shadow-[0_14px_28px_rgba(0,0,0,0.6)]">
        <defs>
          <radialGradient id="gb-body" cx="34%" cy="28%" r="80%">
            <stop offset="0" stopColor="#fff6cf" />
            <stop offset="0.22" stopColor="#f3cc5c" />
            <stop offset="0.6" stopColor="#c99a2a" />
            <stop offset="1" stopColor="#5e4310" />
          </radialGradient>
          <radialGradient id="gb-shine" cx="30%" cy="22%" r="28%">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="92" fill="url(#gb-body)" />
        <g stroke="#6b4d12" strokeOpacity="0.75" strokeWidth="2.2" fill="none" strokeLinejoin="round" strokeLinecap="round">
          <path d="M100 62l30 22-11.5 35.5h-37L70 84z" fill="#8a6513" fillOpacity="0.55" />
          <path d="M100 62V12M130 84l47-15M118.5 119.5l29 40M81.5 119.5l-29 40M70 84L23 69" />
          <path d="M52 40l18 44M148 40l-18 44M177 69l-6 52M23 69l6 52M52.5 159.5l47.5 29 47.5-29" strokeOpacity="0.4" />
        </g>
        <circle cx="100" cy="100" r="92" fill="url(#gb-shine)" />
        <circle cx="100" cy="100" r="91" fill="none" stroke="#fff1b0" strokeOpacity="0.5" strokeWidth="1.5" />
      </svg>
      {[
        "left-[-6%] top-[18%] h-4 w-4",
        "right-[-4%] top-[8%] h-3 w-3",
        "right-[-10%] bottom-[26%] h-5 w-5",
        "left-[4%] bottom-[8%] h-3 w-3",
      ].map((pos, i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          className={`absolute ${pos} animate-sparkle`}
          style={{ animationDelay: `${i * 0.8}s` }}
        >
          <path d="M10 0l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" fill="#fff0b0" />
        </svg>
      ))}
    </div>
  );
}
