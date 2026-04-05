import { ReactNode } from "react";
import clsx from "clsx";

interface SectionCardProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function SectionCard({
  title,
  subtitle,
  action,
  children,
  className,
}: SectionCardProps) {
  return (
    <section className={clsx("glass-card animate-rise rounded-[30px] p-5 sm:p-6", className)}>
      <div className="relative mb-6 flex items-start justify-between gap-4 border-b border-white/6 pb-5">
        <div className="max-w-xl">
          <h2 className="text-xl font-semibold tracking-tight text-[color:var(--text)]">{title}</h2>
          {subtitle ? <p className="mt-2 text-[15px] leading-7 text-[color:var(--muted)]">{subtitle}</p> : null}
        </div>
        <div className="shrink-0">{action}</div>
      </div>
      <div className="relative">{children}</div>
    </section>
  );
}
