/**
 * State Emblem of India — a simplified, stylised rendering of the Lion Capital
 * of Ashoka used as the console's mark.
 *
 * Drawn as geometry rather than shipped as a raster so it stays crisp at the
 * sizes the chrome uses. It is deliberately a schematic silhouette: three
 * lion heads above the abacus, the Dharma Chakra centred on it, and the
 * inverted-lotus base. `currentColor` throughout so one mark serves the dark
 * sidebar and the light header alike.
 */

import { cx } from "@/components/ui";

export function Emblem({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      className={cx("shrink-0", className)}
      role={title ? "img" : "presentation"}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {/* Outer lion — left */}
      <path
        d="M20 22c-3.2 0-5.6 2-6.2 4.8-.3 1.5.1 2.9 1 4l1.6 1.9h9.2l1.4-2.2c.8-1.3 1-2.6.7-4C27 23.9 23.6 22 20 22Z"
        fill="currentColor"
        opacity="0.9"
      />
      {/* Outer lion — right */}
      <path
        d="M44 22c3.2 0 5.6 2 6.2 4.8.3 1.5-.1 2.9-1 4l-1.6 1.9h-9.2l-1.4-2.2c-.8-1.3-1-2.6-.7-4C37 23.9 40.4 22 44 22Z"
        fill="currentColor"
        opacity="0.9"
      />
      {/* Centre lion, facing forward — mane, muzzle, ears */}
      <path
        d="M32 12c-5.6 0-9.8 3.8-10.6 9-.5 3.2.5 6.1 2.6 8.4l1.5 1.6h13l1.5-1.6c2.1-2.3 3.1-5.2 2.6-8.4C41.8 15.8 37.6 12 32 12Z"
        fill="currentColor"
      />
      <path
        d="M27.6 20.4c.9 0 1.6.8 1.6 1.8s-.7 1.8-1.6 1.8-1.6-.8-1.6-1.8.7-1.8 1.6-1.8Zm8.8 0c.9 0 1.6.8 1.6 1.8s-.7 1.8-1.6 1.8-1.6-.8-1.6-1.8.7-1.8 1.6-1.8Z"
        fill="var(--emblem-void, #ffffff)"
      />
      <path
        d="M32 25.2c1.9 0 3.2 1 3.2 2.3 0 1.5-1.5 2.7-3.2 2.7s-3.2-1.2-3.2-2.7c0-1.3 1.3-2.3 3.2-2.3Z"
        fill="var(--emblem-void, #ffffff)"
      />

      {/* Abacus */}
      <rect x="14" y="32.5" width="36" height="4.6" rx="2.3" fill="currentColor" />

      {/* Dharma Chakra */}
      <circle cx="32" cy="42.6" r="5.6" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="32" cy="42.6" r="1.3" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="1" strokeLinecap="round">
        <path d="M32 37.4v10.4M26.8 42.6h10.4M28.3 38.9l7.4 7.4M35.7 38.9l-7.4 7.4" />
      </g>

      {/* Flanking bulls / horses, reduced to the profiles that read at 24px */}
      <path
        d="M19.6 39.4c-2.6.4-4.4 2-4.9 4.3-.2 1 0 2 .5 2.9h6.6v-7.2h-2.2Zm24.8 0c2.6.4 4.4 2 4.9 4.3.2 1 0 2-.5 2.9h-6.6v-7.2h2.2Z"
        fill="currentColor"
        opacity="0.55"
      />

      {/* Inverted-lotus base */}
      <path
        d="M17 48.4h30c1.5 0 2.4 1.6 1.6 2.9-2.4 3.7-8.7 6.1-16.6 6.1s-14.2-2.4-16.6-6.1c-.8-1.3.1-2.9 1.6-2.9Z"
        fill="currentColor"
        opacity="0.8"
      />
      <rect x="13" y="45.8" width="38" height="3.2" rx="1.6" fill="currentColor" />
    </svg>
  );
}
