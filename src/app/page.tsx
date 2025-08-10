
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gavel, Crown, MoveRight } from 'lucide-react';
import { NavButtons } from '@/components/common/NavButtons';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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

      <div className="text-center mb-12 mt-8">
        <div className="animate-fade-in-down">
           <h1 className="text-4xl md:text-6xl font-extrabold font-headline animated-gradient">
              JLKS Paradip
            </h1>
           <p className="text-base mt-2 text-foreground/70">🙏 ଜୟ ଶ୍ରୀ ଜଗନ୍ନାଥ 🙏</p>
        </div>
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
          icon={<Gavel className="w-12 h-12 sm:w-16 sm:h-16" />}
          title="Judge's Portal"
          className="from-yellow-400 to-orange-500 text-white"
        />
        <PortalCard
          href="/organizers"
          icon={<Crown className="w-12 h-12 sm:w-16 sm:h-16" />}
          title="Organizer's Dashboard"
          className="from-purple-500 to-indigo-600 text-white"
        />
      </div>
    </div>
  );
}

function PortalCard({ href, icon, title, className }: { href: string; icon: React.ReactNode; title: string; className?: string }) {
  return (
    <Card className={cn(`group transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/20 border-0 overflow-hidden bg-gradient-to-br`, className)}>
      <CardHeader className="items-center text-center p-6 sm:p-8">
        <div className="p-4 bg-white/20 rounded-full mb-4 ring-8 ring-white/10 group-hover:animate-pulse transition-all duration-300">
          {icon}
        </div>
        <CardTitle className="text-2xl sm:text-3xl md:text-4xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-center flex flex-col items-center gap-6 p-6 sm:p-8 pt-0">
        <Button asChild className="rounded-full font-bold bg-background/90 text-foreground hover:bg-background" size="lg">
          <Link href={href}>
            Enter <MoveRight className="ml-2 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
