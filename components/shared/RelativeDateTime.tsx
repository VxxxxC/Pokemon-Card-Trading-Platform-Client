"use client";

import { useEffect, useState } from "react";

import { formatRelativeDateTime } from "@/lib/marketplace/listing-display";

type RelativeDateTimeProps = {
  value: string | null | undefined;
  className?: string;
  /** Recompute label interval (default 60s). */
  tickMs?: number;
};

export function RelativeDateTime({
  value,
  className,
  tickMs = 60_000,
}: RelativeDateTimeProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), tickMs);
    return () => window.clearInterval(id);
  }, [tickMs]);

  return (
    <span className={className}>{formatRelativeDateTime(value, now)}</span>
  );
}
