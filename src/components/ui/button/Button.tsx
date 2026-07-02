import React, { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode; // Button text or content
  size?: "xs" | "sm" | "md" | "lg"; // Button size
  variant?: "primary" | "outline" | "danger"; // Button variant
  startIcon?: ReactNode; // Icon before the text
  endIcon?: ReactNode; // Icon after the text
  onClick?: () => void; // Click handler
  disabled?: boolean; // Disabled state
  className?: string; // Additional classes
  type?: "button" | "submit" | "reset"; // Button type
}

const Button: React.FC<ButtonProps> = ({
  children,
  size = "md",
  variant = "primary",
  startIcon,
  endIcon,
  onClick,
  className = "",
  disabled = false,
  type = "button", // Par défaut "button" pour éviter les submits accidentels
}) => {
  // Size Classes
  const sizeClasses = {
    xs: "px-3 py-1.5 text-xs",
    sm: "px-4 py-3 text-sm",
    md: "px-5 py-3.5 text-sm",
    lg: "px-6 py-4 text-base",
  };

  // Variant Classes — alignées sur le design system (lime + texte encre)
  const variantClasses = {
    primary:
      "bg-[var(--brand)] text-[var(--brand-ink)] font-semibold hover:bg-[var(--brand-strong)]",
    outline:
      "bg-[var(--surface)] text-[var(--text)] border border-[var(--border-strong)] hover:bg-[var(--brand-soft)] hover:border-[var(--brand)] hover:text-[var(--brand-deep)]",
    danger:
      "bg-[var(--rose)] text-white hover:bg-[#b91c1c]",
  };

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center font-medium gap-2 rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/40 ${className} ${
        sizeClasses[size]
      } ${variantClasses[variant]} ${
        disabled ? "cursor-not-allowed opacity-50" : ""
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      {startIcon && <span className="flex items-center">{startIcon}</span>}
      {children}
      {endIcon && <span className="flex items-center">{endIcon}</span>}
    </button>
  );
};

export default Button;
