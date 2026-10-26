"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

/**
 * A notice in the bottom right corner, like a cookie banner. Once the visitor
 * clicks the button it stays hidden on later visits. The text is part of the
 * storage key, so a changed notice shows up again.
 */
export function NoticeToast({
  title,
  text,
  button,
}: {
  title: string;
  text: string;
  button: string;
}) {
  const storageKey = `notice-dismissed:${title}:${text}`;
  const [visible, setVisible] = useState(false);

  // Decide after mount: localStorage is not available during server rendering.
  useEffect(() => {
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(storageKey) === "1";
    } catch {}
    if (dismissed) return;
    const timer = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(timer);
  }, [storageKey]);

  function dismiss() {
    setVisible(false);
    try {
      localStorage.setItem(storageKey, "1");
    } catch {}
  }

  return (
    <div
      role="status"
      aria-hidden={!visible}
      className={cn(
        "fixed inset-x-4 bottom-4 z-40 border-l-4 border-clay bg-ink p-5 text-paper shadow-[0_12px_40px_rgba(22,19,15,0.35)] transition-all duration-500 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:max-w-sm rounded-md",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-6 opacity-0",
      )}
    >
      <p className="font-title text-lg text-paper">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-paper/85">{text}</p>
      <Button
        size="sm"
        variant="onDark"
        onClick={dismiss}
        tabIndex={visible ? undefined : -1}
        className="mt-4"
      >
        {button}
      </Button>
    </div>
  );
}
