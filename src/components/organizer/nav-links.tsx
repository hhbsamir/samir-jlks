
"use client"

import React from 'react';
import { usePathname } from 'next/navigation';
import { Trophy, School, Users, Shapes, Settings } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


const navItems = [
  { href: '/organizers', label: 'Leaderboard', icon: Trophy, color: 'text-yellow-500', bgColor: 'bg-yellow-400/10' },
  { href: '/organizers/schools', label: 'Schools', icon: School, color: 'text-blue-500', bgColor: 'bg-blue-400/10' },
  { href: '/organizers/judges', label: 'Judges', icon: Users, color: 'text-green-500', bgColor: 'bg-green-400/10' },
  { href: '/organizers/categories', label: 'Categories', icon: Shapes, color: 'text-purple-500', bgColor: 'bg-purple-400/10' },
  { href: '/organizers/settings', label: 'Settings', icon: Settings, color: 'text-red-500', bgColor: 'bg-red-400/10' },
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
                            'relative rounded-full h-16 w-16 sm:h-20 sm:w-20 flex flex-col items-center justify-center gap-1 transition-all duration-300 ease-in-out',
                            'border border-transparent bg-clip-padding backdrop-filter backdrop-blur-sm bg-opacity-50',
                            item.color,
                            item.bgColor,
                            'hover:scale-110 hover:shadow-lg hover:shadow-primary/20',
                            pathname === item.href ? 'ring-2 ring-primary/80 scale-110 shadow-lg shadow-primary/30' : 'scale-100'
                          )}
                      >
                          <Link href={item.href}>
                              <item.icon className="h-6 w-6 sm:h-8 sm:w-8" />
                              <span className="text-xs hidden sm:block font-medium">{item.label}</span>
                          </Link>
                      </Button>
                  </TooltipTrigger>
                  <TooltipContent className="sm:hidden bg-background/80 backdrop-blur-sm border-primary/20">
                    <p>{item.label}</p>
                  </TooltipContent>
              </Tooltip>
          ))}
      </nav>
    </TooltipProvider>
  );
}
