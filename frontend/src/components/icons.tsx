/** Stroke icons used by the chrome and the summary strip. 20x20 grid, currentColor. */

type IconProps = { className?: string };

const base = {
  viewBox: "0 0 20 20",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function GaugeIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3.5 14.5a7.5 7.5 0 1 1 13 0" />
      <path d="M10 10.5 13 7.5" />
      <circle cx="10" cy="11" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ShieldIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M10 2.5 16 5v4.8c0 3.7-2.4 6.9-6 7.7-3.6-.8-6-4-6-7.7V5l6-2.5Z" />
      <path d="M7.6 9.9 9.3 11.6 12.6 8.3" />
    </svg>
  );
}

export function LayersIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M10 2.6 17 6.3 10 10 3 6.3l7-3.7Z" />
      <path d="m3 10 7 3.7L17 10" />
      <path d="m3 13.7 7 3.7 7-3.7" />
    </svg>
  );
}

export function AlertIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 6.4v4.2M10 13.4h.01" />
    </svg>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 5.8V10l2.8 1.7" />
    </svg>
  );
}

export function FileIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M11.5 2.5H6a1.5 1.5 0 0 0-1.5 1.5v12A1.5 1.5 0 0 0 6 17.5h8a1.5 1.5 0 0 0 1.5-1.5V6.5l-4-4Z" />
      <path d="M11.5 2.5v4h4" />
    </svg>
  );
}

export function ChartIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3.5 16.5h13" />
      <path d="M6 16.5v-4M10 16.5V6M14 16.5v-6.5" />
    </svg>
  );
}

export function BookIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3.5 4.5A1.5 1.5 0 0 1 5 3h4v14H5a1.5 1.5 0 0 0-1.5 1.5v-14Z" />
      <path d="M16.5 4.5A1.5 1.5 0 0 0 15 3h-4v14h4a1.5 1.5 0 0 1 1.5 1.5v-14Z" />
    </svg>
  );
}

export function ExternalIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M8 4.5H5A1.5 1.5 0 0 0 3.5 6v9A1.5 1.5 0 0 0 5 16.5h9a1.5 1.5 0 0 0 1.5-1.5v-3" />
      <path d="M11.5 3.5h5v5M16.5 3.5 9 11" />
    </svg>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="9" cy="9" r="5.5" />
      <path d="m13.2 13.2 3.3 3.3" />
    </svg>
  );
}

export function DatabaseIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <ellipse cx="10" cy="5" rx="6" ry="2.5" />
      <path d="M4 5v10c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V5" />
      <path d="M4 10c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5" />
    </svg>
  );
}
