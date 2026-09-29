"use client";

/**
 * One place for "fetch something, show loading, show an error, allow retry".
 *
 * Every portal page needs that shape, and doing it inline in each one is how
 * inconsistent error handling creeps in. The effect defers the first call by a
 * tick rather than awaiting in the effect body, which keeps React from
 * cascading renders on mount.
 */

import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError } from "@/services/api";

export type AsyncState<T> =
  | { kind: "loading" }
  | { kind: "ready"; data: T }
  | { kind: "error"; error: ApiError };

export function useAsync<T>(
  load: () => Promise<T>,
  deps: readonly unknown[],
): { state: AsyncState<T>; reload: () => void } {
  const [state, setState] = useState<AsyncState<T>>({ kind: "loading" });
  const liveRef = useRef(true);
  /** Only the newest request may write state; earlier ones are stale. */
  const requestRef = useRef(0);

  // `load` is typically an inline closure, so it is intentionally not a
  // dependency: the caller's `deps` describe when a refetch is warranted. The
  // ref is synced in an effect rather than during render, and is declared
  // before the fetching effect so it is already current when that one runs.
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });

  const run = useCallback(async () => {
    const ticket = ++requestRef.current;
    setState({ kind: "loading" });
    try {
      const data = await loadRef.current();
      if (!liveRef.current || ticket !== requestRef.current) return;
      setState({ kind: "ready", data });
    } catch (caught) {
      if (!liveRef.current || ticket !== requestRef.current) return;
      setState({
        kind: "error",
        error:
          caught instanceof ApiError
            ? caught
            : new ApiError("unexpected", "Something went wrong loading this view."),
      });
    }
  }, []);

  useEffect(() => {
    liveRef.current = true;
    const timer = setTimeout(() => void run(), 0);
    return () => {
      liveRef.current = false;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { state, reload: () => void run() };
}
