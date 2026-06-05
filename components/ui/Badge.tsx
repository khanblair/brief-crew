type BadgeVariant = "default" | "success" | "warning" | "error" | "info";

const styles: Record<BadgeVariant, string> = {
  default:  "bg-neutral-100 text-neutral-600",
  success:  "bg-brand-50 text-brand-700 border border-brand-200",
  warning:  "bg-amber-50 text-amber-700 border border-amber-200",
  error:    "bg-red-50 text-red-700 border border-red-200",
  info:     "bg-blue-50 text-blue-700 border border-blue-200",
};

export function Badge({ label, variant = "default" }: { label: string; variant?: BadgeVariant }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[variant]}`}>
      {label}
    </span>
  );
}
