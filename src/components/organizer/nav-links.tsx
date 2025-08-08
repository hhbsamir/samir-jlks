"use client"

import React from 'react';
import { usePathname } from 'next/navigation';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Trophy, School, Users, Shapes, Settings } from 'lucide-react';
import Link from 'next/link';

const navItems = [
  { href: '/organizers', label: 'Leaderboard', icon: Trophy },
  { href: '/organizers/schools', label: 'Schools', icon: School },
  { href: '/organizers/judges', label: 'Judges', icon: Users },
  { href: '/organizers/categories', label: 'Categories', icon: Shapes },
  { href: '/organizers/settings', label: 'Settings', icon: Settings },
];

export default function NavLinks() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col justify-between h-full p-2">
        <SidebarMenu>
            {navItems.map(item => (
                <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    tooltip={{ children: item.label, side: "right", className: "text-accent-foreground bg-accent" }}
                >
                    <Link href={item.href}>
                    <item.icon className="text-accent" />
                    <span>{item.label}</span>
                    </Link>
                </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
        </SidebarMenu>
    </div>
  );
}
