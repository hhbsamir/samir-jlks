
"use client";

import React, { useState, useEffect, createContext, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app, db } from '@/lib/firebase';
import { Loader2, Menu, Home, Trophy, School, Users, Shapes, Ticket, ClipboardList, Settings, Landmark, Star, Building, Briefcase } from 'lucide-react';
import LoginPage from './login/page';
import { collection, onSnapshot, Timestamp, query, orderBy } from 'firebase/firestore';
import type { School as AppSchool, CompetitionCategory, Score, Feedback, Judge, Registration } from '@/lib/data';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';


// 1. Create a context to hold all our data
interface CompetitionDataContextType {
  schools: AppSchool[];
  categories: CompetitionCategory[];
  scores: Score[];
  feedbacks: Feedback[];
  judges: Judge[];
  registrations: Registration[];
  loading: boolean;
}

const CompetitionDataContext = createContext<CompetitionDataContextType | null>(null);

// 2. Create a hook for easy access to the context
export const useCompetitionData = () => {
  const context = useContext(CompetitionDataContext);
  if (!context) {
    throw new Error("useCompetitionData must be used within an OrganizersLayout");
  }
  return context;
}

const navLinks = [
    { href: "/organizers", label: "Leaderboard", icon: <Trophy className="w-8 h-8" /> },
    { href: "/organizers/schools", label: "Schools", icon: <School className="w-8 h-8" /> },
    { href: "/organizers/judges", label: "Judges", icon: <Users className="w-8 h-8" /> },
    { href: "/organizers/categories", label: "Categories", icon: <Shapes className="w-8 h-8" /> },
    { href: "/organizers/lottery", label: "Lottery", icon: <Ticket className="w-8 h-8" /> },
    { href: "/organizers/settings", label: "Settings", icon: <Settings className="w-8 h-8" /> },
];

function MainNav({ className }: { className?: string }) {
    const pathname = usePathname();
    return (
        <nav className={cn("flex flex-wrap items-center justify-center gap-6 md:gap-8", className)}>
            {navLinks.map((link) => (
                <Link
                    key={link.href}
                    href={link.href}
                    className="flex flex-col items-center gap-2 group"
                >
                    <div className={cn(
                        "flex items-center justify-center w-24 h-24 rounded-full border-4 shadow-lg transition-all duration-300 transform group-hover:scale-110 group-hover:shadow-xl",
                        pathname === link.href 
                            ? "bg-primary/10 border-primary text-primary" 
                            : "bg-card border-border text-muted-foreground group-hover:border-primary/50 group-hover:text-primary"
                    )}>
                        {link.icon}
                    </div>
                    <span className={cn(
                        "text-sm font-medium transition-colors",
                         pathname === link.href ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                    )}>
                        {link.label}
                    </span>
                </Link>
            ))}
        </nav>
    );
}

function MobileNav() {
    const [open, setOpen] = React.useState(false);
    return (
         <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation Menu</SheetTitle>
                <SheetDescription>
                  A list of links to navigate the organizer's dashboard.
                </SheetDescription>
              </SheetHeader>
              <nav className="grid gap-6 text-lg font-medium">
                <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-primary">
                    <Home />
                    <span>Go to Home Page</span>
                </Link>
                <hr/>
                {navLinks.map(link => (
                    <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className="text-muted-foreground hover:text-foreground flex items-center gap-2"
                    >
                         {React.cloneElement(link.icon, { className: "w-5 h-5" })}
                        {link.label}
                    </Link>
                ))}
              </nav>
            </SheetContent>
        </Sheet>
    )
}

function CompetitionDataProvider({ children }: { children: React.ReactNode }) {
  const [schools, setSchools] = useState<AppSchool[]>([]);
  const [categories, setCategories] = useState<CompetitionCategory[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up listeners for all our collections
    const unsubscribes = [
      onSnapshot(collection(db, 'schools'), (snapshot) => {
        setSchools(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppSchool)));
        setLoading(false);
      }),
      onSnapshot(collection(db, 'categories'), (snapshot) => {
        setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CompetitionCategory)));
      }),
      onSnapshot(collection(db, 'scores'), (snapshot) => {
        setScores(snapshot.docs.map(doc => doc.data() as Score));
      }),
      onSnapshot(collection(db, 'feedbacks'), (snapshot) => {
        setFeedbacks(snapshot.docs.map(doc => doc.data() as Feedback));
      }),
      onSnapshot(collection(db, 'judges'), (snapshot) => {
        const judgesList = snapshot.docs.map(doc => {
            const data = doc.data();
            const createdAt = data.createdAt;
            const serializableCreatedAt = createdAt instanceof Timestamp ? createdAt.toMillis() : (createdAt || null);
            return { 
              id: doc.id, 
              ...data,
              createdAt: serializableCreatedAt,
            } as unknown as Judge;
        });
        setJudges(judgesList);
      }),
      onSnapshot(query(collection(db, 'registrations'), orderBy("createdAt", "desc")), (snapshot) => {
        setRegistrations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Registration)));
      }),
    ];

    // Cleanup listeners on component unmount
    return () => unsubscribes.forEach(unsub => unsub());
  }, []);

  const value = { schools, categories, scores, feedbacks, judges, registrations, loading };

  return (
    <CompetitionDataContext.Provider value={value}>
        {loading ? (
             <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
                    <p className="mt-4 text-muted-foreground">Loading Competition Data...</p>
                </div>
            </div>
        ) : children}
    </CompetitionDataContext.Provider>
  )
}

export default function OrganizersLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const pathname = usePathname();
  
  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (authLoading) {
    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const isDashboardHome = pathname === '/organizers';

  return (
    <CompetitionDataProvider>
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 flex h-20 items-center gap-4 border-b bg-background/95 backdrop-blur-sm px-4 md:px-6">
            <div className="flex w-full items-center gap-4">
                <div className="md:hidden">
                    <MobileNav />
                </div>
                 <h1 className="font-headline text-3xl font-bold text-primary whitespace-nowrap">Organizer's Dashboard</h1>
                 <Button asChild variant="outline" size="sm" className="ml-auto">
                    <Link href="/">
                        <Home className="mr-2 h-4 w-4" /> Go to Home
                    </Link>
                 </Button>
            </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="mb-8 hidden md:block">
                <MainNav />
            </div>
            {children}
        </main>
      </div>
    </CompetitionDataProvider>
  );
}
