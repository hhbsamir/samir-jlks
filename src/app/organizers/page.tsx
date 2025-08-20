
"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { getHomePageContent } from '@/app/actions';
import type { HomePageContent } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Image as ImageIcon } from 'lucide-react';

export default function OrganizersPage() {
  const [homePageContent, setHomePageContent] = useState<HomePageContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      const content = await getHomePageContent();
      setHomePageContent(content);
      setLoading(false);
    };

    fetchContent();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center text-center p-4 h-full">
        <h1 className="font-headline text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            <span className="animated-gradient">Welcome</span> to the Organizer's Dashboard
        </h1>
        <p className="text-muted-foreground mb-8">
            Select an option from the menu to manage the competition.
        </p>
        <Card className="w-full max-w-2xl overflow-hidden shadow-2xl">
            <CardContent className="p-0">
                {loading ? (
                    <Skeleton className="w-full h-80" />
                ) : homePageContent?.imageUrl ? (
                    <div className="relative w-full aspect-[16/9]">
                        <Image
                            src={homePageContent.imageUrl}
                            alt="Home page visual"
                            layout="fill"
                            objectFit="cover"
                        />
                    </div>
                ) : (
                    <div className="w-full aspect-[16/9] bg-muted flex flex-col items-center justify-center">
                        <ImageIcon className="w-24 h-24 text-muted-foreground/50" />
                        <p className="text-muted-foreground mt-4">No image configured for the home page.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
