import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type PageHeaderProps = {
  title: string;
  children?: ReactNode;
  centerTitle?: boolean;
};

export function PageHeader({ title, children, centerTitle = false }: PageHeaderProps) {
  return (
    <div className={cn(
      "relative flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8",
      centerTitle ? "justify-center" : "justify-between"
    )}>
      <h1 className="font-headline text-base font-bold text-primary bg-primary/10 border border-primary/20 rounded-lg py-4 px-6 shadow-lg">
        {title}
      </h1>
      {children && !centerTitle && <div className="flex-shrink-0 flex flex-wrap justify-end gap-2">{children}</div>}
    </div>
  );
}
