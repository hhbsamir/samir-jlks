"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gavel, Crown, MoveRight } from 'lucide-react';
import { NavButtons } from '@/components/common/NavButtons';
import { format } from 'date-fns';

export default function Home() {
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentDate(format(now, 'dd-MMMM-yyyy, EEEE'));
      setCurrentTime(format(now, 'hh:mm:ss a'));
    };

    updateDateTime();
    const timer = setInterval(updateDateTime, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-8 bg-background">
      <NavButtons showBack={false} />
      <div className="text-center mb-12">
        <h1 className="font-headline text-5xl md:text-8xl font-bold text-primary animate-fade-in-down">
          JLKS Paradip
        </h1>
        <div className="font-body text-lg md:text-2xl mt-4 text-foreground/80 max-w-3xl mx-auto animate-fade-in-up">
            {currentDate && <p>({currentDate})</p>}
            {currentTime && (
              <div className="mt-4 p-4 bg-primary/10 border border-primary/30 rounded-lg shadow-[0_0_15px] shadow-primary/30">
                <p className="text-2xl md:text-4xl font-bold text-primary">{currentTime}</p>
              </div>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-sm">
        <PortalCard
          href="/judges"
          icon={<Gavel className="w-12 h-12 sm:w-16 sm:h-16 text-accent" />}
          title="Judge's Portal"
          description="Enter the arena to score performances with precision and expertise."
        />
        <PortalCard
          href="/organizers"
          icon={<Crown className="w-12 h-12 sm:w-16 sm:h-16 text-accent" />}
          title="Organizer's Dashboard"
          description="Manage events, track scores in real-time, and declare the champions."
        />
      </div>
    </main>
  );
}

function PortalCard({ href, icon, title, description }: { href: string; icon: React.ReactNode; title: string; description: string; }) {
  return (
    <Card className="group transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/20 border-2 border-transparent hover:border-primary/50 overflow-hidden">
      <CardHeader className="items-center text-center p-6 sm:p-8">
        <div className="p-4 bg-accent/10 rounded-full mb-4 group-hover:animate-pulse">
          {icon}
        </div>
        <CardTitle className="font-headline text-3xl sm:text-4xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-center flex flex-col items-center gap-6 p-6 sm:p-8 pt-0">
        <p className="text-base sm:text-lg text-foreground/70">{description}</p>
        <Button asChild className="rounded-full font-bold group-hover:bg-accent group-hover:text-accent-foreground" size="lg">
          <Link href={href}>
            Enter <MoveRight className="ml-2 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
