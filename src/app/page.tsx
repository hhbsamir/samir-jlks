
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
                    <Link href="/registration">
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Registration for Inter-School Cultural Meet</span>
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

       <div className="flex flex-col items-center gap-6 mt-8 animate-fade-in-up">
        {loadingContent ? (
          <>
            <Skeleton className="h-48 w-48 rounded-full" />
            <Skeleton className="h-8 w-80 rounded-md" />
          </>
        ) : homePageContent && (
          <>
            {homePageContent.imageUrl && (
              <div className="relative h-48 w-48 rounded-full shadow-2xl shadow-primary/20 overflow-hidden ring-4 ring-primary/20">
                <Image
                  src={homePageContent.imageUrl}
                  alt="Special photo"
                  layout="fill"
                  objectFit="cover"
                  className="transform transition-transform duration-500 hover:scale-110"
                />
              </div>
            )}
            {homePageContent.note && (
              <div className="bg-background/70 backdrop-blur-sm p-4 rounded-lg border max-w-lg text-center">
                 <p className="text-lg font-body text-foreground/90">{homePageContent.note}</p>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}
