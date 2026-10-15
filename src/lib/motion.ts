import type { CSSProperties } from "react";

/** Inline style that offsets a `.rise` or `[data-reveal]` animation. */
export function delay(ms: number): CSSProperties {
  return { "--delay": `${ms}ms` } as CSSProperties;
}
