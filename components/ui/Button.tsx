import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  asChild?: boolean;
}

const variants = {
  primary: "bg-brand hover:bg-brand-hover text-white shadow-sm",
  secondary: "bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-300",
  ghost: "hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900",
  danger: "bg-red-600 hover:bg-red-700 text-white",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

const base =
  "inline-flex items-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 disabled:opacity-50 disabled:cursor-not-allowed";

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { variant = "primary", size = "md", loading, disabled, children, className = "", asChild, ...props },
    ref
  ) => {
    const cls = `${base} ${variants[variant]} ${sizes[size]} ${className}`;

    if (asChild && children) {
      const child = children as React.ReactElement<{ className?: string }>;
      return (
        <child.type
          {...child.props}
          className={`${cls} ${child.props.className ?? ""}`}
        />
      );
    }

    return (
      <button ref={ref} disabled={disabled || loading} className={cls} {...props}>
        {loading && (
          <span className="size-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
