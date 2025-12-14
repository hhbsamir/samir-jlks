
"use client";

import React, { useState, useEffect, createContext, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { app, db } from '@/lib/firebase';
import { Loader2, Menu, Home, Trophy, School, Users, Shapes, Ticket, ClipboardList, Settings, Landmark, Star, Building, Briefcase } from 'lucide-react';
import LoginPage from './login/page';
import { collection, onSnapshot, Timestamp, query, orderBy } from 'firebase/firestore';
import type { School as AppSchool, CompetitionCategory, Score, Feedback, Judge, Registration } from '@/lib/data';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import Link from 'next/link';

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

  return (
    <CompetitionDataProvider>
      <div className="flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 flex flex-col items-center gap-4 border-b bg-background/95 backdrop-blur-sm px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between w-full">
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                      <Button 
                          variant="outline"
                          size="icon"
                          className="rounded-full h-12 w-12 border-2 border-primary shadow-lg hover:bg-primary/10"
                      >
                          <Menu className="h-6 w-6" />
                      </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="start">
                      <DropdownMenuItem asChild>
                          <Link href="/">
                              <Home className="mr-2 h-4 w-4" />
                              <span>Go to Home Page</span>
                          </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                                <Landmark className="mr-2 h-4 w-4" />
                                <span>Aug15/Jan26</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                    <DropdownMenuItem asChild><Link href="/organizers"><Trophy className="mr-2 h-4 w-4" />Leaderboard</Link></DropdownMenuItem>
                                    <DropdownMenuItem asChild><Link href="/organizers/schools"><School className="mr-2 h-4 w-4" />Schools</Link></DropdownMenuItem>
                                    <DropdownMenuItem asChild><Link href="/organizers/judges"><Users className="mr-2 h-4 w-4" />Judges</Link></DropdownMenuItem>
                                    <DropdownMenuItem asChild><Link href="/organizers/categories"><Shapes className="mr-2 h-4 w-4" />Categories</Link></DropdownMenuItem>
                                    <DropdownMenuItem asChild><Link href="/organizers/lottery"><Ticket className="mr-2 h-4 w-4" />Lottery</Link></DropdownMenuItem>
                                    <DropdownMenuItem asChild><Link href="/organizers/settings"><Settings className="mr-2 h-4 w-4" />Settings</Link></DropdownMenuItem>
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>
                  </DropdownMenuContent>
              </DropdownMenu>
              <div className="flex-1 flex justify-center">
                    <h1 className="font-headline text-2xl sm:text-3xl font-bold">🙏Organizer's Dashboard🙏</h1>
              </div>
              <div className="w-12"></div>
            </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
            {children}
        </main>
      </div>
    </CompetitionDataProvider>
  );
}
