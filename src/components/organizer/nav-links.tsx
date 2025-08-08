
"use client"

import React from 'react';
import { usePathname } from 'next/navigation';
import { Trophy, School, Users, Shapes, Settings } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


const navItems = [
  { href: '/organizers', label: 'Leaderboard', icon: Trophy, color: 'bg-yellow-400/20 text-yellow-500 hover:bg-yellow-400/30' },
  { href: '/organizers/schools', label: 'Schools', icon: School, color: 'bg-blue-400/20 text-blue-500 hover:bg-blue-400/30' },
  { href: '/organizers/judges', label: 'Judges', icon: Users, color: 'bg-green-400/20 text-green-500 hover:bg-green-400/30' },
  { href: '/organizers/categories', label: 'Categories', icon: Shapes, color: 'bg-purple-400/20 text-purple-500 hover:bg-purple-400/30' },
  { href: '/organizers/settings', label: 'Settings', icon: Settings, color: 'bg-red-400/20 text-red-500 hover:bg-red-400/30' },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <TooltipProvider>
      <nav className="flex items-center justify-center gap-2 sm:gap-4 overflow-x-auto p-2">
          {navItems.map(item => (
              <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                      <Button
                          asChild
                          variant="ghost"
                          className={cn(
                            'rounded-full h-16 w-16 sm:h-20 sm:w-20 flex flex-col items-center justify-center gap-1 transition-all duration-300',
                            item.color,
                            pathname === item.href ? 'ring-2 ring-primary scale-110' : 'scale-100'
                          )}
                      >
                          <Link href={item.href}>
                              <item.icon className="h-6 w-6 sm:h-8 sm:w-8" />
                              <span className="text-xs hidden sm:block">{item.label}</span>
                          </Link>
                      </Button>
                  </TooltipTrigger>
                  <TooltipContent className="sm:hidden">
                    <p>{item.label}</p>
                  </TooltipContent>
              </Tooltip>
          ))}
      </nav>
    </TooltipProvider>
  );
}
