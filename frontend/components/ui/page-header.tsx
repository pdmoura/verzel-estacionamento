import type { ReactNode } from 'react';

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        {eyebrow && <p className="mb-1 text-sm font-medium uppercase tracking-wide text-muted">{eyebrow}</p>}
        <h1 className="text-4xl font-bold tracking-tight text-text">{title}</h1>
        {description && <p className="mt-2 max-w-3xl text-lg text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
