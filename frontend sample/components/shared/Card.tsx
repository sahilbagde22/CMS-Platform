'use client';

export default function Card({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
