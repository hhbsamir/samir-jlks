import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  children?: ReactNode;
};

export function PageHeader({ title, children }: PageHeaderProps) {
  return (
    <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-center gap-4 mb-8">
      <h1 className="font-headline text-4xl md:text-5xl text-primary text-center w-full">{title}</h1>
      {children && <div className="sm:absolute sm:right-0 flex-shrink-0">{children}</div>}
    </div>
  );
}
