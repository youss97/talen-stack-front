import React, { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  success?: boolean;
  error?: boolean;
  hint?: string; // Optional hint text
  label?: string; // Optional label text
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  type = "text",
  className = "",
  disabled = false,
  success = false,
  error = false,
  hint,
  label,
  ...rest
}, ref) => {
  // Determine input styles based on state (disabled, success, error)
  let inputClasses = `h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm placeholder:text-[var(--text-3)] focus:outline-none transition ${className}`;

  // Add styles for the different states (tokens → suivent clair/vert foncé, pas de fond noir)
  if (disabled) {
    inputClasses += ` bg-[var(--surface-2)] text-[var(--text-3)] border-[var(--border-strong)] cursor-not-allowed`;
  } else if (error) {
    inputClasses += ` bg-[var(--surface)] text-[var(--text)] border-[var(--rose)] focus:ring-2 focus:ring-[var(--rose)]/30`;
  } else if (success) {
    inputClasses += ` bg-[var(--surface)] text-[var(--text)] border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/30 focus:border-[var(--brand)]`;
  } else {
    inputClasses += ` bg-[var(--surface)] text-[var(--text)] border-[var(--border-strong)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/35`;
  }

  return (
    <div className="relative">
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        disabled={disabled}
        className={inputClasses}
        {...rest}
      />

      {/* Optional Hint Text */}
      {hint && (
        <p
          className={`mt-1.5 text-xs ${
            error
              ? "text-error-500"
              : success
              ? "text-success-500"
              : "text-gray-500"
          }`}
        >
          {hint}
        </p>
      )}
    </div>
  );
});

Input.displayName = "Input";

export default Input;
