import React from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  placeholder?: string;
  rows?: number;
  className?: string;
  disabled?: boolean;
  error?: boolean;
  hint?: string;
}

const TextArea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      placeholder = "Enter your message",
      rows = 3,
      className = "",
      disabled = false,
      error = false,
      hint = "",
      ...rest
    },
    ref
  ) => {
    let textareaClasses = `w-full rounded-lg border px-4 py-2.5 text-sm placeholder:text-[var(--text-3)] focus:outline-none transition ${className}`;

    if (disabled) {
      textareaClasses += ` bg-[var(--surface-2)] text-[var(--text-3)] border-[var(--border-strong)] cursor-not-allowed`;
    } else if (error) {
      textareaClasses += ` bg-[var(--surface)] text-[var(--text)] border-[var(--rose)] focus:ring-2 focus:ring-[var(--rose)]/30`;
    } else {
      textareaClasses += ` bg-[var(--surface)] text-[var(--text)] border-[var(--border-strong)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand)]/35`;
    }

    return (
      <div className="relative">
        <textarea
          ref={ref}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          className={textareaClasses}
          {...rest}
        />
        {hint && (
          <p
            className={`mt-2 text-sm ${
              error ? "text-error-500" : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {hint}
          </p>
        )}
      </div>
    );
  }
);

TextArea.displayName = "TextArea";

export default TextArea;
