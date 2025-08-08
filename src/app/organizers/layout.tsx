import React from 'react';
import Link from 'next/link';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import NavLinks from '@/components/organizer/nav-links';
import { Crown } from 'lucide-react';

export default function OrganizersLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Button variant="ghost" className="h-auto p-2 justify-start" asChild>
            <Link href="/">
              <Crown className="w-8 h-8 text-primary" />
              <div className="ml-3 group-data-[collapsible=icon]:hidden">
                <h2 className="font-headline text-xl">Adjudicator's Arena</h2>
                <p className="text-sm text-sidebar-foreground/70">Organizer's Dashboard</p>
              </div>
            </Link>
          </Button>
        </SidebarHeader>
        <SidebarContent>
          <NavLinks />
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-6">
            <div className="md:hidden">
                <SidebarTrigger />
            </div>
            <div className="flex-1">
                <h1 className="font-headline text-3xl hidden sm:block">Organizer's Dashboard</h1>
            </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
