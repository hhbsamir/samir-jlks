import { cn } from "@/lib/utils";
import React from "react";

export function AppLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <svg
        width="1em"
        height="1em"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-12 h-12 sm:w-16 sm:h-16 text-primary"
      >
        <path
          d="M14.5 9.5L9.5 4.5L4.5 9.5L9.5 14.5L14.5 9.5Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13 11L19.5 17.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16 14.5L17.5 13L21 16.5L19.5 18L16 14.5Z"
          fill="currentColor"
        />
      </svg>
      <div className="flex flex-col">
        <h1 className="text-4xl md:text-6xl font-extrabold font-headline animated-gradient">
            JLKS Paradip
        </h1>
      </div>
    </div>
  );
}
