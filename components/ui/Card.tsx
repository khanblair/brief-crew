interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = "", onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-neutral-200 bg-white p-6 ${
        onClick ? "cursor-pointer hover:border-neutral-300 hover:shadow-sm transition-all" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
