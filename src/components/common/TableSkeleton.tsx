"use client";
import React from "react";

interface TableSkeletonProps {
  columns?: number;
  rows?: number;
}

/** Skeleton de tableau (chargement) — rendu pro à la place d'un spinner. */
export default function TableSkeleton({ columns = 5, rows = 6 }: TableSkeletonProps) {
  return (
    <div className="w-full overflow-hidden gw-card">
      {/* En-tête */}
      <div className="flex gap-4 border-b px-5 py-3.5" style={{ borderColor: "var(--border)", background: "var(--surface-2)" }}>
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-3 flex-1 rounded" style={{ background: "var(--border-strong)" }} />
        ))}
      </div>
      {/* Lignes */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 border-b px-5 py-4" style={{ borderColor: "var(--border)" }}>
          {Array.from({ length: columns }).map((_, c) => (
            <div
              key={c}
              className="h-3.5 flex-1 rounded animate-pulse"
              style={{ background: "var(--surface-2)", animationDelay: `${(r * columns + c) * 40}ms`, width: c === 0 ? "60%" : undefined }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
