/**
 * State Emblem of India.
 *
 * The official artwork, served as a static asset rather than inlined: it is a
 * detailed line drawing and repeating it in every page's markup would cost
 * more than one cached request does.
 *
 * The source is black line art, so on the dark sidebar it is inverted to read
 * as light. `tone` picks which. It is decorative wherever the wordmark beside
 * it already names the platform, and only carries a label when it stands alone.
 */

import { cx } from "@/components/ui";

export function Emblem({
  className,
  tone = "dark",
  title,
}: {
  className?: string;
  /** `dark` for light surfaces, `light` for the green sidebar. */
  tone?: "dark" | "light";
  title?: string;
}) {
  return (
    // A static SVG in /public: next/image would add a loader for no benefit,
    // cannot optimise vector output, and would not apply the inversion below.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/emblem-of-india.svg"
      alt={title ?? ""}
      aria-hidden={title ? undefined : true}
      // No height here: the caller sets it. A base `h-full` competes with the
      // caller's `h-9` as two utilities of the same kind, and which one wins is
      // decided by stylesheet order rather than by the prop.
      className={cx("w-auto select-none object-contain", tone === "light" && "invert", className)}
      draggable={false}
    />
  );
}
