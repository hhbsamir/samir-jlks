
"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import NavLinks from '@/components/organizer/nav-links';
import { Crown, ShieldAlert } from 'lucide-react';
import { NavButtons } from '@/components/common/NavButtons';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const PASSWORD = "3568";

export default function OrganizersLayout({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsClient(true);
    const sessionAuth = sessionStorage.getItem('organizer-authenticated');
    if (sessionAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (password === PASSWORD) {
      sessionStorage.setItem('organizer-authenticated', 'true');
      setIsAuthenticated(true);
      toast({
        title: "Access Granted",
        description: "Welcome to the Organizer's Dashboard.",
      });
    } else {
      toast({
        title: "Access Denied",
        description: "The password you entered is incorrect.",
        variant: "destructive",
      });
      setPassword('');
    }
    setIsSubmitting(false);
  };
  
  if (!isClient) {
    return null; // Or a loading spinner
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
         <Dialog open={true} onOpenChange={() => {}}>
            <DialogContent 
              className="sm:max-w-md"
              onOpenAutoFocus={(e) => {
                e.preventDefault();
                inputRef.current?.focus();
              }}
              hideCloseButton={true}
            >
                <DialogHeader>
                    <DialogTitle className="font-headline text-3xl text-primary flex items-center gap-2">
                        <ShieldAlert className="w-8 h-8"/>
                        Authentication Required
                    </DialogTitle>
                    <DialogDescription>
                        You must enter the password to access the Organizer's Dashboard.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handlePasswordSubmit}>
                    <div className="grid flex-1 gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="password" className="text-right text-base">
                                Password
                            </Label>
                            <Input 
                                id="password"
                                type="password" 
                                className="col-span-3 text-base"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                ref={inputRef}
                            />
                        </div>
                    </div>
                    <DialogFooter className="sm:justify-between items-center">
                      <Button type="button" variant="outline" asChild>
                        <Link href="/">Go to Home</Link>
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Verifying...' : 'Grant Access'}
                      </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <Button variant="ghost" className="h-auto p-2 justify-start" asChild>
            <Link href="/">
              <Crown className="w-8 h-8 text-primary" />
              <div className="ml-3 group-data-[collapsible=icon]:hidden">
                <h2 className="font-headline text-xl">JLKS Paradip</h2>
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
            <div className="flex items-center gap-2">
              <SidebarTrigger />
            </div>
            <div className="flex-1 text-center">
                <h1 className="font-headline text-3xl hidden sm:block">Organizer's Dashboard</h1>
            </div>
             <div className="w-10">
                <NavButtons />
            </div>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
