
import type {Metadata} from 'next';
import { Belleza, Alegreya } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: "JLKS Paradip",
  description: 'The ultimate platform for fair and transparent competition scoring.',
};

const fontHeadline = Belleza({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-headline',
});

const fontBody = Alegreya({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-body',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("flex flex-col min-h-screen", fontHeadline.variable, fontBody.variable)}>
        <div className="flex-grow">{children}</div>
        <Toaster />
      </body>
    </html>
  );
}
