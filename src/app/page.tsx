
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gavel, Crown, MoveRight, Edit, ClipboardList, Menu } from 'lucide-react';
import { NavButtons } from '@/components/common/NavButtons';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"


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
      <header className="absolute top-4 left-4">
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
            <DropdownMenuContent className="w-56">
                <DropdownMenuItem asChild>
                    <Link href="/registration">
                        <Edit className="mr-2 h-4 w-4" />
                        <span>School Registration</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                    <Link href="/judges">
                        <Gavel className="mr-2 h-4 w-4" />
                        <span>Judge's Portal</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/organizers">
                        <Crown className="mr-2 h-4 w-4" />
                        <span>Organizer's Dashboard</span>
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
      </header>

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

    </div>
  );
}

function PortalCard({ href, icon, title, description, className }: { href: string; icon: React.ReactNode; title: string; description: string; className?: string }) {
  return (
    <Card className={cn(`group transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/20 border-0 overflow-hidden bg-gradient-to-br`, className)}>
      <CardHeader className="items-center text-center p-6 sm:p-8">
        <div className="p-4 bg-white/20 rounded-full mb-4 ring-8 ring-white/10 group-hover:animate-pulse transition-all duration-300">
          {icon}
        </div>
        <CardTitle className="text-2xl sm:text-3xl">{title}</CardTitle>
        <CardDescription className="text-white/80 text-sm sm:text-base pt-1">{description}</CardDescription>
      </CardHeader>
      <CardContent className="text-center flex flex-col items-center gap-6 p-6 sm:p-8 pt-0">
        <Button asChild className="rounded-full font-bold bg-background/90 text-foreground hover:bg-background" size="lg">
          <Link href={href}>
            Proceed <MoveRight className="ml-2 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
