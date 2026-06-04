'use client';

export default function Card({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all duration-500 ease-in-out hover:-translate-y-1 hover:shadow-lg hover:border-orange-500/30 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
