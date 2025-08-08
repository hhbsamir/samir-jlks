import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type PageHeaderProps = {
  title: string;
  children?: ReactNode;
};

export function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-center gap-4 mb-8">
      <h1 className="font-headline text-4xl md:text-5xl text-primary text-center w-full bg-primary/10 border border-primary/20 rounded-lg py-4 px-6 shadow-lg">
        {title}
      </h1>
      {children && <div className="sm:absolute sm:right-0 flex-shrink-0">{children}</div>}
    </div>
  );
}
