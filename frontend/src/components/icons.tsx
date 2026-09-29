/** Simple line icons on a 20x20 grid, inheriting currentColor. */

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

export function GridIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="3" width="6" height="6" rx="1.4" />
      <rect x="11" y="3" width="6" height="6" rx="1.4" />
      <rect x="3" y="11" width="6" height="6" rx="1.4" />
      <rect x="11" y="11" width="6" height="6" rx="1.4" />
    </svg>
  );
}

export function WorksIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 7.5h14v8a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 15.5v-8Z" />
      <path d="M7.5 7.5v-2A1.5 1.5 0 0 1 9 4h2a1.5 1.5 0 0 1 1.5 1.5v2" />
      <path d="M3 11h14" />
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

export function TriangleAlertIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M10 3.2 17.5 16H2.5L10 3.2Z" />
      <path d="M10 8v3.2M10 13.8h.01" />
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

export function MapPinIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M10 17.5s5.5-4.6 5.5-9a5.5 5.5 0 1 0-11 0c0 4.4 5.5 9 5.5 9Z" />
      <circle cx="10" cy="8.4" r="2" />
    </svg>
  );
}

export function BellIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M5.5 8.5a4.5 4.5 0 0 1 9 0c0 3.2 1 4.4 1.5 5h-12c.5-.6 1.5-1.8 1.5-5Z" />
      <path d="M8.3 16.3a1.9 1.9 0 0 0 3.4 0" />
    </svg>
  );
}

export function UsersIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="8" cy="7.2" r="2.7" />
      <path d="M3 16.2c0-2.5 2.2-4.2 5-4.2s5 1.7 5 4.2" />
      <path d="M13.6 5.1a2.6 2.6 0 0 1 0 5M15 12.4c1.5.6 2.5 1.9 2.5 3.8" />
    </svg>
  );
}

export function SettingsIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="10" cy="10" r="2.4" />
      <path d="M10 2.5v2M10 15.5v2M17.5 10h-2M4.5 10h-2M15.3 4.7l-1.4 1.4M6.1 13.9l-1.4 1.4M15.3 15.3l-1.4-1.4M6.1 6.1 4.7 4.7" />
    </svg>
  );
}

export function SparkIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M10 2.8l1.5 4.2 4.2 1.5-4.2 1.5L10 14.2 8.5 10 4.3 8.5l4.2-1.5L10 2.8Z" />
      <path d="M15.4 13.2l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z" />
    </svg>
  );
}

export function ArrowRightIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 10h11.5M11 5.5 15.5 10 11 14.5" />
    </svg>
  );
}

export function ArrowUpIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M10 15.5V4.5M5.5 9 10 4.5 14.5 9" />
    </svg>
  );
}

export function ArrowDownIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M10 4.5v11M5.5 11l4.5 4.5L14.5 11" />
    </svg>
  );
}

export function FilterIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3.5 5h13l-5 5.8v4.4l-3 1.3v-5.7L3.5 5Z" />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="m4.5 10.5 3.5 3.5 7.5-8" />
    </svg>
  );
}

export function CameraIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h1.8l1-1.6h5.4l1 1.6h1.8A1.5 1.5 0 0 1 17 7.5v7A1.5 1.5 0 0 1 15.5 16h-11A1.5 1.5 0 0 1 3 14.5v-7Z" />
      <circle cx="10" cy="10.8" r="2.6" />
    </svg>
  );
}

export function MegaphoneIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 8.5v3a1.5 1.5 0 0 0 1.5 1.5H6l7 3.5v-13L6 7H4.5A1.5 1.5 0 0 0 3 8.5Z" />
      <path d="M15.5 8a3 3 0 0 1 0 4M6 13v3.5" />
    </svg>
  );
}

export function EyeIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M2.5 10S5.3 5.5 10 5.5 17.5 10 17.5 10 14.7 14.5 10 14.5 2.5 10 2.5 10Z" />
      <circle cx="10" cy="10" r="2.2" />
    </svg>
  );
}

export function InfoIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 9v4.5M10 6.6h.01" />
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

export function DatabaseIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <ellipse cx="10" cy="5" rx="6" ry="2.5" />
      <path d="M4 5v10c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5V5" />
      <path d="M4 10c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5" />
    </svg>
  );
}

export function UsersGroupIcon({ className }: IconProps) {
  return UsersIcon({ className });
}
