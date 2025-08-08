
"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { ArrowLeft, BarChart, Check, Music, Palette, Theater, Loader2, User, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import type { School, CompetitionCategory, Judge, Score, SchoolCategory } from "@/lib/data";
import { NavButtons } from "@/components/common/NavButtons";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, writeBatch, doc } from "firebase/firestore";


const categoryIcons: { [key: string]: React.ReactNode } = {
  Dance: <Music className="w-6 h-6 text-accent" />,
  Costume: <Palette className="w-6 h-6 text-accent" />,
  Theme: <Theater className="w-6 h-6 text-accent" />,
  default: <BarChart className="w-6 h-6 text-accent" />,
};

type SchoolScores = {
  [schoolId: string]: {
    [categoryId: string]: number;
  };
};

const schoolCategoryOrder: SchoolCategory[] = ["Sub-Junior", "Junior", "Senior"];

export default function JudgesPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [categories, setCategories] = useState<CompetitionCategory[]>([]);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [scores, setScores] = useState<SchoolScores>({});
  const [selectedJudge, setSelectedJudge] = useState<Judge | null>(null);
  const [authenticatedJudge, setAuthenticatedJudge] = useState<Judge | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const schoolsCollection = collection(db, 'schools');
        const schoolsSnapshot = await getDocs(schoolsCollection);
        const schoolsList = schoolsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as School));
        setSchools(schoolsList);

        const categoriesCollection = collection(db, 'categories');
        const categoriesSnapshot = await getDocs(categoriesCollection);
        const categoriesList = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CompetitionCategory));
        setCategories(categoriesList);

        const judgesCollection = collection(db, 'judges');
        const judgesSnapshot = await getDocs(judgesCollection);
        const judgesList = judgesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Judge));
        setJudges(judgesList);
      } catch (error) {
        console.error("Error fetching initial data: ", error);
        toast({ title: "Error", description: "Failed to load competition data.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  useEffect(() => {
    const fetchScores = async () => {
      if (!authenticatedJudge) return;

      const scoresCollection = collection(db, 'scores');
      const q = query(
        scoresCollection, 
        where("judgeId", "==", authenticatedJudge.id)
      );
      const scoresSnapshot = await getDocs(q);
      const judgeScores = scoresSnapshot.docs.reduce((acc: SchoolScores, doc) => {
        const score = doc.data() as Score;
        if (!acc[score.schoolId]) {
          acc[score.schoolId] = {};
        }
        acc[score.schoolId][score.categoryId] = score.score;
        return acc;
      }, {});
      
      const initialScoresForJudge: SchoolScores = {};
      schools.forEach(school => {
        initialScoresForJudge[school.id] = {};
        categories.forEach(category => {
          initialScoresForJudge[school.id][category.id] = judgeScores[school.id]?.[category.id] ?? 0;
        });
      });

      setScores(initialScoresForJudge);
    };

    if (authenticatedJudge) {
        fetchScores();
    }
  }, [authenticatedJudge, schools, categories]);

  const categorizedSchools = useMemo(() => {
    return schoolCategoryOrder.reduce((acc, category) => {
        acc[category] = schools.filter(school => school.category === category);
        return acc;
    }, {} as Record<SchoolCategory, School[]>);
  }, [schools]);

  const handleJudgeSelection = (judge: Judge) => {
    if (!judge.password) {
      setAuthenticatedJudge(judge);
    } else {
      setSelectedJudge(judge);
      setIsAuthModalOpen(true);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);

    // Artificial delay to give feedback
    setTimeout(() => {
      if (selectedJudge && password === selectedJudge.password) {
        setAuthenticatedJudge(selectedJudge);
        setIsAuthModalOpen(false);
        setSelectedJudge(null);
        setPassword('');
        toast({
          title: "Access Granted",
          description: `Welcome, ${selectedJudge.name}. You can now start scoring.`
        });
      } else {
        toast({
          title: "Access Denied",
          description: "The password you entered is incorrect.",
          variant: "destructive"
        });
        setPassword('');
      }
      setIsAuthenticating(false);
    }, 500);
  };

  const handleScoreChange = (schoolId: string, categoryId: string, value: string) => {
    setScores(prev => ({
      ...prev,
      [schoolId]: {
        ...(prev?.[schoolId] || {}),
        [categoryId]: parseInt(value, 10),
      },
    }));
  };
  
  const handleSubmit = async (schoolId: string) => {
    if (!authenticatedJudge) return;
    setSubmitting(schoolId);
    
    try {
        const batch = writeBatch(db);
        const schoolScores = scores[schoolId];

        for (const categoryId in schoolScores) {
            const scoreValue = schoolScores[categoryId];
            const scoreData: Score = {
                judgeId: authenticatedJudge.id,
                schoolId: schoolId,
                categoryId: categoryId,
                score: scoreValue,
            };
            
            const scoreDocId = `${authenticatedJudge.id}_${schoolId}_${categoryId}`;
            const scoreRef = doc(db, "scores", scoreDocId);
            batch.set(scoreRef, scoreData, { merge: true });
        }

        await batch.commit();

        toast({
          title: "Scores Submitted!",
          description: `Your scores for ${schools.find(s => s.id === schoolId)?.name} have been recorded.`,
          action: <div className="p-2 bg-green-500 text-white rounded-full"><Check /></div>
        });

    } catch(error) {
        console.error("Error submitting scores:", error);
        toast({
            title: "Submission Failed",
            description: "There was a problem submitting your scores. Please try again.",
            variant: "destructive"
        });
    } finally {
      setSubmitting(null);
    }
  };

  const renderAuthModal = () => (
    <Dialog open={isAuthModalOpen} onOpenChange={(isOpen) => {
        if (!isOpen) {
            setIsAuthModalOpen(false);
            setSelectedJudge(null);
            setPassword('');
        }
    }}>
        <DialogContent 
            className="sm:max-w-md"
            onOpenAutoFocus={(e) => {
                e.preventDefault();
                inputRef.current?.focus();
            }}
        >
            <DialogHeader>
                <DialogTitle className="font-headline text-3xl text-primary flex items-center gap-2">
                    <ShieldAlert className="w-8 h-8"/>
                    Authentication for {selectedJudge?.name}
                </DialogTitle>
                <DialogDescription>
                    Please enter your 4-digit password to proceed.
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePasswordSubmit}>
                <div className="grid flex-1 gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="password" className="text-right text-base">
                            Password
                        </Label>
                        <Input 
                            id="password"
                            type="password" 
                            className="col-span-3 text-base"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            ref={inputRef}
                            maxLength={4}
                        />
                    </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isAuthenticating} className="w-full">
                    {isAuthenticating ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Verifying...</>) : 'Enter Scoring Sheet'}
                  </Button>
                </DialogFooter>
            </form>
        </DialogContent>
    </Dialog>
  );

  const renderJudgeSelection = () => (
    <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="items-center text-center p-8">
                           <div className="p-4 bg-accent/10 rounded-full mb-4">
                               <Loader2 className="w-16 h-16 text-accent animate-spin" />
                           </div>
                           <CardTitle className="font-headline text-3xl">Loading...</CardTitle>
                        </CardHeader>
                    </Card>
                ))
            ) : (
                judges.map(judge => (
                    <Card key={judge.id} className="group transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/20 border-2 border-transparent hover:border-primary/50 overflow-hidden cursor-pointer" onClick={() => handleJudgeSelection(judge)}>
                        <CardHeader className="items-center text-center p-8">
                            <div className="p-4 bg-accent/10 rounded-full mb-4 group-hover:animate-pulse">
                                <User className="w-16 h-16 text-accent" />
                            </div>
                            <CardTitle className="font-headline text-3xl">{judge.name}</CardTitle>
                        </CardHeader>
                    </Card>
                ))
            )}
        </div>
    </div>
  );

  const renderScoringSheet = () => (
    <>
        {authenticatedJudge && (
            <div className="flex justify-center mb-10">
                <Button onClick={() => {
                  setAuthenticatedJudge(null);
                  setScores({});
                }} variant="outline">
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    Back to Judge Selection
                </Button>
            </div>
        )}
        <div className="space-y-12">
            {schoolCategoryOrder.map(schoolCategory => (
                categorizedSchools[schoolCategory]?.length > 0 && (
                    <section key={schoolCategory}>
                        <h2 className="font-headline text-3xl md:text-4xl text-foreground/90 mb-6">{schoolCategory} Schools</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                            {categorizedSchools[schoolCategory].map(school => (
                            <Card key={school.id} className="transform transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20">
                                <CardHeader>
                                <CardTitle className="font-headline text-2xl md:text-3xl">{school.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                {categories.map(category => (
                                    <div key={category.id} className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                        {categoryIcons[category.name] || categoryIcons.default}
                                        <label className="text-base md:text-lg font-medium">{category.name}</label>
                                        </div>
                                        <div className="w-24">
                                        <Select
                                            value={(scores[school.id]?.[category.id] ?? 0).toString()}
                                            onValueChange={(value) => handleScoreChange(school.id, category.id, value)}
                                            disabled={submitting === school.id}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Score" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Array.from({ length: 11 }, (_, i) => (
                                                    <SelectItem key={i} value={i.toString()}>{i}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        </div>
                                    </div>
                                    </div>
                                ))}
                                <Button className="w-full mt-4 font-bold" onClick={() => handleSubmit(school.id)} disabled={submitting === school.id}>
                                    {submitting === school.id ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <Check className="mr-2 h-5 w-5"/>}
                                    {submitting === school.id ? "Submitting..." : `Submit Scores for ${school.name}`}
                                </Button>
                                </CardContent>
                            </Card>
                            ))}
                        </div>
                    </section>
                )
            ))}
        </div>
    </>
  );

  return (
    <div className="min-h-screen p-4 sm:p-8 pt-20">
      <div className="absolute top-4 left-4">
        <NavButtons />
      </div>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="font-headline text-5xl md:text-6xl text-primary">
            {authenticatedJudge ? `Scoring for ${authenticatedJudge.name}` : "Judge's Portal"}
          </h1>
          <p className="text-lg md:text-xl text-foreground/80 mt-2">
            {authenticatedJudge ? "Assign your scores with precision and expertise." : "Select your name to begin scoring."}
          </p>
        </div>
        
        {authenticatedJudge ? renderScoringSheet() : renderJudgeSelection()}
        {renderAuthModal()}
      </div>
    </div>
  );
}

    