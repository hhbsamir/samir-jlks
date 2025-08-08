"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

export function NavButtons({ showBack = true, showHome = true }: { showBack?: boolean, showHome?: boolean }) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      {showHome && (
          <Button asChild variant="outline" size="icon" className="p-2" aria-label="Home">
            <Link href="/">
              <Home className="h-5 w-5" />
            </Link>
          </Button>
      )}
      {showBack && (
        <Button
          variant="outline"
          size="icon"
          className="p-2"
          onClick={() => router.back()}
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
