
"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import NavLinks from '@/components/organizer/nav-links';
import { NavButtons } from '@/components/common/NavButtons';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import LoginPage from './login/page';

export default function OrganizersLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="flex flex-col min-h-screen">
       <header className="sticky top-0 z-30 flex flex-col items-center gap-4 border-b bg-background/95 backdrop-blur-sm px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between w-full">
            <NavButtons showBack={false} />
            <div className="flex-1 flex justify-center">
                 <h1 className="font-headline text-3xl">Organizer's Dashboard</h1>
            </div>
             <div className="w-10"></div>
          </div>
          <div className="w-full">
            <NavLinks />
          </div>
      </header>
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
      </main>
    </div>
  );
}

