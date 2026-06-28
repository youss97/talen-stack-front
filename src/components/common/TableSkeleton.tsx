"use client";
import React from "react";

interface TableSkeletonProps {
  columns?: number;
  rows?: number;
}

/** Skeleton de tableau (chargement) — rendu pro à la place d'un spinner. */
export default function TableSkeleton({ columns = 5, rows = 6 }: TableSkeletonProps) {
  return (
    <div className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
      {/* En-tête */}
      <div className="flex gap-4 border-b border-gray-100 bg-gray-50/80 px-5 py-3.5 dark:border-gray-800 dark:bg-white/[0.02]">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-3 flex-1 rounded bg-gray-200 dark:bg-gray-700" />
        ))}
      </div>
      {/* Lignes */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 border-b border-gray-50 px-5 py-4 dark:border-gray-800/60">
          {Array.from({ length: columns }).map((_, c) => (
            <div
              key={c}
              className="h-3.5 flex-1 rounded bg-gray-100 dark:bg-gray-800 animate-pulse"
              style={{ animationDelay: `${(r * columns + c) * 40}ms`, width: c === 0 ? "60%" : undefined }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
