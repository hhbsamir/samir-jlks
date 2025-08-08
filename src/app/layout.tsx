
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});

export const metadata: Metadata = {
  title: "JLKS Paradip",
  description: 'The ultimate platform for fair and transparent competition scoring.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable}`}>
      <body className="font-body antialiased flex flex-col min-h-screen">
        <div className="flex-grow">{children}</div>
        <footer className="text-center p-4 text-foreground/60">
            <p>ଜୟ ଶ୍ରୀ ଜଗନ୍ନାଥ 🙏 ସମୀର କୁମାର ମାହାପତ୍ର</p>
        </footer>
        <Toaster />
      </body>
    </html>
  );
}
