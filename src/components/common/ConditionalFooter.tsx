"use client";

import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function ConditionalFooter() {
    const pathname = usePathname();

    if (pathname === '/') {
        return null; // Don't render on the home page
    }

    return (
        <footer className={cn("w-full py-4 text-center")}>
            <p className="text-sm text-foreground/70">
                ଜୟ ଶ୍ରୀ ଜଗନ୍ନାଥ 🙏 ସମୀର କୁମାର ମାହାପତ୍ର
            </p>
        </footer>
    );
}