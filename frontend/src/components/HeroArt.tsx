/**
 * Hero illustration: a rural scene of the kind of work MPLADS funds.
 *
 * Drawn rather than photographed on purpose. A stock photograph of a real
 * place would imply this platform holds a record about that place, and a
 * remote image is one network failure away from an empty hero during a demo.
 */

export function HeroArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 800 420"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="hero-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0b4b3d" />
          <stop offset="55%" stopColor="#0a5344" />
          <stop offset="100%" stopColor="#0d6350" />
        </linearGradient>
        <linearGradient id="hero-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#12705b" />
          <stop offset="100%" stopColor="#0e5c4a" />
        </linearGradient>
        <linearGradient id="hero-road" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1d7c66" />
          <stop offset="100%" stopColor="#2d9078" />
        </linearGradient>
      </defs>

      <rect width="800" height="420" fill="url(#hero-sky)" />

      {/* Sun haze */}
      <circle cx="620" cy="96" r="52" fill="#ffffff" opacity="0.07" />
      <circle cx="620" cy="96" r="28" fill="#ffffff" opacity="0.08" />

      {/* Distant hills */}
      <path d="M0 236c70-34 118-12 176-30s96-44 158-30 92 48 156 36 108-38 160-22 96 30 150 22v208H0Z" fill="url(#hero-far)" opacity="0.75" />
      <path d="M0 268c84-26 140 4 210-14s112-36 178-22 106 42 170 30 118-28 176-14 60 12 66 10v162H0Z" fill="#0f6a56" opacity="0.7" />

      {/* Fields */}
      <path d="M0 300h800v120H0Z" fill="#14785f" opacity="0.55" />

      {/* Road in perspective */}
      <path d="M352 300 L300 420h280L442 300Z" fill="url(#hero-road)" opacity="0.9" />
      <path d="M394 306h10l-6 24h-10Zm-10 40h10l-7 26h-11Zm-12 44h11l-9 30h-12Z" fill="#ffffff" opacity="0.5" />

      {/* Overhead water tank */}
      <g opacity="0.9">
        <rect x="148" y="214" width="6" height="88" fill="#0b4b3d" />
        <rect x="184" y="214" width="6" height="88" fill="#0b4b3d" />
        <path d="M150 232h40M150 260h40" stroke="#0b4b3d" strokeWidth="4" />
        <path d="M138 186h62l-8 30h-46Z" fill="#cbe9dd" opacity="0.92" />
        <rect x="136" y="176" width="66" height="14" rx="4" fill="#eaf6f1" opacity="0.95" />
      </g>

      {/* School block */}
      <g opacity="0.92">
        <rect x="560" y="236" width="128" height="66" rx="3" fill="#e6f2ec" opacity="0.9" />
        <path d="M552 238l72-30 72 30Z" fill="#cbe9dd" />
        <rect x="578" y="258" width="18" height="18" fill="#0d6350" opacity="0.5" />
        <rect x="608" y="258" width="18" height="18" fill="#0d6350" opacity="0.5" />
        <rect x="638" y="258" width="18" height="18" fill="#0d6350" opacity="0.5" />
        <rect x="662" y="272" width="16" height="30" fill="#0d6350" opacity="0.6" />
      </g>

      {/* Street lighting along the road */}
      <g stroke="#cbe9dd" strokeWidth="3" opacity="0.65" fill="none">
        <path d="M300 300v-44h18" />
        <path d="M250 340v-56h22" />
        <path d="M500 300v-44h-18" />
        <path d="M552 340v-56h-22" />
      </g>
      <g fill="#f4e2b8" opacity="0.85">
        <circle cx="320" cy="256" r="4" />
        <circle cx="274" cy="284" r="4" />
        <circle cx="480" cy="256" r="4" />
        <circle cx="528" cy="284" r="4" />
      </g>

      {/* Trees */}
      <g fill="#0b5745" opacity="0.85">
        <circle cx="86" cy="290" r="26" />
        <circle cx="112" cy="300" r="18" />
        <circle cx="726" cy="296" r="24" />
        <circle cx="752" cy="306" r="16" />
      </g>
    </svg>
  );
}
