"use client";

/** Header indicator backed by `GET /health`. */

import { useCallback, useEffect, useRef, useState } from "react";

import { apiBaseUrl, checkHealth } from "@/services/api";
import { cx } from "@/components/ui";

type Status = "checking" | "connected" | "unavailable";

const POLL_INTERVAL_MS = 30_000;

export function ApiStatus() {
  const [status, setStatus] = useState<Status>("checking");
  const [version, setVersion] = useState<string | null>(null);
  /** Guards against a probe resolving after unmount, or two probes overlapping. */
  const liveRef = useRef(true);

  const probe = useCallback(async () => {
    try {
      const health = await checkHealth();
      if (!liveRef.current) return;
      setVersion(health.version);
      setStatus("connected");
    } catch {
      if (!liveRef.current) return;
      setStatus("unavailable");
    }
  }, []);

  useEffect(() => {
    liveRef.current = true;
    let timer: ReturnType<typeof setTimeout>;

    // Self-scheduling rather than setInterval: the next probe is only queued
    // once the previous one settles, so a slow backend cannot pile up requests.
    const tick = async () => {
      await probe();
      if (liveRef.current) timer = setTimeout(tick, POLL_INTERVAL_MS);
    };

    timer = setTimeout(tick, 0);

    return () => {
      liveRef.current = false;
      clearTimeout(timer);
    };
  }, [probe]);

  const presentation = {
    checking: { dot: "bg-ink-subtle", text: "text-ink-muted", label: "Checking API…" },
    connected: { dot: "bg-risk-low", text: "text-ink-muted", label: "Connected" },
    unavailable: { dot: "bg-risk-critical", text: "text-risk-critical", label: "API unavailable" },
  }[status];

  return (
    <div
      className="flex items-center gap-2"
      title={status === "connected" ? `${apiBaseUrl} · v${version ?? "?"}` : apiBaseUrl}
    >
      <span
        className={cx(
          "h-2 w-2 shrink-0 rounded-full",
          presentation.dot,
          status === "checking" && "animate-pulse",
        )}
        aria-hidden="true"
      />
      <span className={cx("text-[12.5px] font-medium", presentation.text)} role="status">
        {presentation.label}
      </span>
      {status === "unavailable" ? (
        <button
          type="button"
          onClick={() => {
            setStatus("checking");
            void probe();
          }}
          className="text-[12px] font-medium text-brand-700 underline underline-offset-2 hover:text-brand-600"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}
