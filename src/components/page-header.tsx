import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  children?: ReactNode;
};

export function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
      <h1 className="font-headline text-5xl text-primary">{title}</h1>
      {children && <div className="flex-shrink-0">{children}</div>}
    </div>
  );
}
