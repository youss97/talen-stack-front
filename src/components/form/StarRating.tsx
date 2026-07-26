"use client";
import { Star } from "lucide-react";

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: "sm" | "md";
}

export default function StarRating({ value, onChange, readonly = false, size = "sm" }: StarRatingProps) {
  const starSize = size === "sm" ? "w-3.5 h-3.5" : "w-5 h-5";
  const starPx = size === "sm" ? 14 : 20;

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={`${starSize} transition-colors ${readonly ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
        >
          <Star
            size={starPx}
            fill={star <= value ? "currentColor" : "none"}
            strokeWidth={1.5}
            className={`icon-glow ${star <= value ? "text-amber-400" : "text-gray-300 dark:text-gray-600"}`}
          />
        </button>
      ))}
    </div>
  );
}
