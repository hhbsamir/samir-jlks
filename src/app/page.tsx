
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Gavel, Crown, Edit, Menu } from 'lucide-react';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import Image from 'next/image';
import type { HomePageContent } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { getHomePageContent } from './actions';

const PortalCard = ({ href, icon, title, className }: { href: string, icon: React.ReactNode, title: string, className: string }) => (
    <Link href={href} className="w-full">
        <div className={`relative flex flex-col items-center justify-center p-8 sm:p-12 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 transform hover:scale-105 group bg-gradient-to-br ${className}`}>
            <div className="z-10 flex flex-col items-center text-center">
                {icon}
                <h2 className="mt-4 text-2xl sm:text-3xl font-bold font-headline">{title}</h2>
            </div>
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors"></div>
        </div>
    </Link>
);

export default function Home() {
  const [currentDate, setCurrentDate] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string | null>(null);
  const [homePageContent, setHomePageContent] = useState<HomePageContent | null>(null);
  const [loadingContent, setLoadingContent] = useState(true);

  useEffect(() => {
    const now = new Date();
    setCurrentDate(format(now, 'dd-MMMM-yyyy, EEEE'));
    setCurrentTime(format(new Date(), 'hh:mm:ss a'));

    const timer = setInterval(() => {
        setCurrentTime(format(new Date(), 'hh:mm:ss a'));
    }, 1000)

    const fetchContent = async () => {
      setLoadingContent(true);
      const content = await getHomePageContent();
      setHomePageContent(content);
      setLoadingContent(false);
    }
    
    fetchContent();

    return () => {
      clearInterval(timer);
    };
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
      
       <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        <PortalCard
          href="/judges"
          icon={<Gavel className="w-12 h-12 sm:w-16 sm:h-16" />}
          title="Judge's Portal"
          className="from-teal-400 to-green-500 text-white"
        />
        <PortalCard
          href="/organizers"
          icon={<Crown className="w-12 h-12 sm:w-16 sm:h-16" />}
          title="Organizer's Dashboard"
          className="from-pink-500 to-red-500 text-white"
        />
      </div>

    </div>
  );
}
