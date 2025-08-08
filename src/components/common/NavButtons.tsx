"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

export function NavButtons({ showBack = true }: { showBack?: boolean }) {
  const router = useRouter();

  return (
    <div className="absolute top-4 left-4 flex items-center gap-2 z-20">
      <Button asChild variant="outline" size="lg" className="p-2" aria-label="Home">
        <Link href="/">
          <Home className="h-6 w-6" />
        </Link>
      </Button>
      {showBack && (
        <Button
          variant="outline"
          size="lg"
          className="p-2"
          onClick={() => router.back()}
          aria-label="Go back"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
      )}
    </div>
  );
}
