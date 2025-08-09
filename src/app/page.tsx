
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gavel, Crown, MoveRight } from 'lucide-react';
import { NavButtons } from '@/components/common/NavButtons';
import { format } from 'date-fns';

export default function Home() {
  const [currentDate, setCurrentDate] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string | null>(null);

  useEffect(() => {
    const now = new Date();
    setCurrentDate(format(now, 'dd-MMMM-yyyy, EEEE'));
    setCurrentTime(format(new Date(), 'hh:mm:ss a'));

    const timer = setInterval(() => {
        setCurrentTime(format(new Date(), 'hh:mm:ss a'));
    }, 1000)

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col flex-grow items-center justify-center p-4 sm:p-8 bg-background min-h-screen">
      <div className="absolute top-4 left-4">
        <NavButtons showBack={false} showHome={false} />
      </div>
      <div className="text-center mb-12">
        <h1 className="text-5xl md:text-8xl font-bold text-primary animate-fade-in-down">
          JLKS Paradip
        </h1>
        <div className="text-lg md:text-2xl mt-4 text-foreground/80 max-w-3xl mx-auto animate-fade-in-up">
            {currentDate ? <p>{currentDate}</p> : <div className="h-7" /> }
            {currentTime ? (
              <div className="mt-4 p-4 bg-primary/10 border border-primary/30 rounded-lg shadow-lg shadow-primary/20">
                <p className="text-2xl md:text-4xl font-bold tracking-widest text-primary">{currentTime}</p>
              </div>
            ) : <div className="h-[76px] mt-4" />}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <PortalCard
          href="/judges"
          icon={<Gavel className="w-12 h-12 sm:w-16 sm:h-16 text-card-foreground" />}
          title="Judge's Portal"
          className="bg-card-2"
        />
        <PortalCard
          href="/organizers"
          icon={<Crown className="w-12 h-12 sm:w-16 sm:h-16 text-card-foreground" />}
          title="Organizer's Dashboard"
          className="bg-card-3"
        />
      </div>
    </div>
  );
}

function PortalCard({ href, icon, title, className }: { href: string; icon: React.ReactNode; title: string; className?: string }) {
  return (
    <Card className={`group transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/20 border-2 border-transparent hover:border-primary/50 overflow-hidden backdrop-blur-sm ${className}`}>
      <CardHeader className="items-center text-center p-6 sm:p-8">
        <div className="p-4 bg-black/10 rounded-full mb-4 group-hover:animate-pulse">
          {icon}
        </div>
        <CardTitle className="text-3xl sm:text-4xl text-card-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-center flex flex-col items-center gap-6 p-6 sm:p-8 pt-0">
        <Button asChild className="rounded-full font-bold bg-background/80 text-foreground hover:bg-background" size="lg">
          <Link href={href}>
            Enter <MoveRight className="ml-2 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
