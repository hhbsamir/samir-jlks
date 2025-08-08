import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type PageHeaderProps = {
  title: string;
  children?: ReactNode;
};

export function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
      <h1 className="font-headline text-base font-bold text-primary bg-primary/10 border border-primary/20 rounded-lg py-4 px-6 shadow-lg">
        {title}
      </h1>
      {children && <div className="flex-shrink-0 flex flex-wrap justify-end gap-2">{children}</div>}
    </div>
  );
}
