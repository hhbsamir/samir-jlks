"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

export function NavButtons({ showBack = true }: { showBack?: boolean }) {
  const router = useRouter();

  return (
    <div className="absolute top-4 left-4 flex items-center gap-2 z-20">
      <Button asChild variant="outline" size="icon" aria-label="Home">
        <Link href="/">
          <Home className="h-5 w-5" />
        </Link>
      </Button>
      {showBack && (
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()}
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
