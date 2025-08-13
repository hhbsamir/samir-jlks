
"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { ArrowLeft, BarChart, Check, Music, Palette, Theater, Loader2, User, ShieldAlert, School as SchoolIcon, MessageSquare, Mic, Drama, Brush } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import type { School, CompetitionCategory, Judge, Score, SchoolCategory, Feedback } from "@/lib/data";
import { NavButtons } from "@/components/common/NavButtons";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, writeBatch, doc, Timestamp } from "firebase/firestore";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


const categoryIcons: { [key: string]: React.ReactNode } = {
  Dance: <Drama className="w-5 h-5 text-accent" />,
  Costume: <Palette className="w-5 h-5 text-accent" />,
  Theme: <Theater className="w-5 h-5 text-accent" />,
  Music: <Music className="w-5 h-5 text-accent" />,
  "Make-up": <Brush className="w-5 h-5 text-accent" />,
  default: <BarChart className="w-5 h-5 text-accent" />,
};

type SchoolScores = {
  [schoolId: string]: {
    [categoryId: string]: number;
  };
};

type SchoolFeedbacks = {
    [schoolId: string]: string;
};

const schoolCategoryOrder: SchoolCategory[] = ["Sub-Junior", "Junior", "Senior"];

export default function JudgesPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [categories, setCategories] = useState<CompetitionCategory[]>([]);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [scores, setScores] = useState<SchoolScores>({});
  const [feedbacks, setFeedbacks] = useState<SchoolFeedbacks>({});
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
        const judgesList = judgesSnapshot.docs.map(doc => {
            const data = doc.data();
            const createdAt = data.createdAt;
            const serializableCreatedAt = createdAt instanceof Timestamp ? createdAt.toMillis() : (createdAt || null);
            return { 
                id: doc.id, 
                ...data,
                createdAt: serializableCreatedAt,
            } as unknown as Judge;
        });

        judgesList.sort((a, b) => {
            const aTime = a.createdAt ?? 0;
            const bTime = b.createdAt ?? 0;
            if (aTime !== bTime) {
                return aTime - bTime;
            }
            return (a.name || '').localeCompare(b.name || '');
        });
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
    const fetchPreviousData = async () => {
      if (!authenticatedJudge) return;

      // Fetch Scores for Junior/Senior
      const scoresCollection = collection(db, 'scores');
      const scoresQuery = query(scoresCollection, where("judgeId", "==", authenticatedJudge.id));
      const scoresSnapshot = await getDocs(scoresQuery);
      const judgeScores = scoresSnapshot.docs.reduce((acc: SchoolScores, doc) => {
        const score = doc.data() as Score;
        if (!acc[score.schoolId]) {
          acc[score.schoolId] = {};
        }
        acc[score.schoolId][score.categoryId] = score.score;
        return acc;
      }, {});
      
      const initialScoresForJudge: SchoolScores = {};
      schools.filter(s => s.category !== 'Sub-Junior').forEach(school => {
        initialScoresForJudge[school.id] = {};
        categories.forEach(category => {
          initialScoresForJudge[school.id][category.id] = judgeScores[school.id]?.[category.id] ?? 0;
        });
      });
      setScores(initialScoresForJudge);

      // Fetch Feedbacks for Sub-Junior
      const feedbacksCollection = collection(db, 'feedbacks');
      const feedbacksQuery = query(feedbacksCollection, where("judgeId", "==", authenticatedJudge.id));
      const feedbacksSnapshot = await getDocs(feedbacksQuery);
      const judgeFeedbacks = feedbacksSnapshot.docs.reduce((acc: SchoolFeedbacks, doc) => {
          const feedback = doc.data() as Feedback;
          acc[feedback.schoolId] = feedback.feedback;
          return acc;
      }, {});

      const initialFeedbacksForJudge: SchoolFeedbacks = {};
      schools.filter(s => s.category === 'Sub-Junior').forEach(school => {
          initialFeedbacksForJudge[school.id] = judgeFeedbacks[school.id] ?? '';
      });
      setFeedbacks(initialFeedbacksForJudge);
    };

    if (authenticatedJudge) {
        fetchPreviousData();
    }
  }, [authenticatedJudge, schools, categories]);

  const categorizedSchools = useMemo(() => {
    return schoolCategoryOrder.reduce((acc, category) => {
        const sortedSchools = schools
          .filter(school => school.category === category)
          .sort((a, b) => (a.serialNumber ?? Infinity) - (b.serialNumber ?? Infinity) || a.name.localeCompare(b.name));
        acc[category] = sortedSchools;
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

  const handleFeedbackChange = (schoolId: string, value: string) => {
    setFeedbacks(prev => ({
        ...prev,
        [schoolId]: value,
    }));
  };
  
  const handleSubmit = async (schoolId: string, schoolCategory: SchoolCategory) => {
    if (!authenticatedJudge) return;
    setSubmitting(schoolId);
    
    try {
        const batch = writeBatch(db);

        if (schoolCategory === 'Sub-Junior') {
            const feedbackValue = feedbacks[schoolId];
            const feedbackData: Omit<Feedback, 'id'> = {
                judgeId: authenticatedJudge.id,
                schoolId: schoolId,
                feedback: feedbackValue,
            };
            const feedbackDocId = `${authenticatedJudge.id}_${schoolId}`;
            const feedbackRef = doc(db, "feedbacks", feedbackDocId);
            batch.set(feedbackRef, feedbackData, { merge: true });
        } else {
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
        }

        await batch.commit();

        toast({
          title: "Submission Successful!",
          description: `Your entries for ${schools.find(s => s.id === schoolId)?.name} have been recorded.`,
          action: <div className="p-1 bg-green-500 text-white rounded-full"><Check className="w-4 h-4" /></div>
        });

    } catch(error) {
        console.error("Error submitting:", error);
        toast({
            title: "Submission Failed",
            description: "There was a problem submitting. Please try again.",
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
                <DialogTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                    <ShieldAlert className="w-6 h-6"/>
                    Authentication for {selectedJudge?.name}
                </DialogTitle>
                <DialogDescription>
                    Please enter your 4-digit password to proceed.
                </DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePasswordSubmit}>
                <div className="grid flex-1 gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="password" className="text-right">
                            Password
                        </Label>
                        <Input 
                            id="password"
                            type="password" 
                            className="col-span-3"
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

  const renderJudgeSelection = () => {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
                <h1 className="font-headline text-4xl sm:text-5xl md:text-7xl font-bold text-primary">
                Judge's Portal
                </h1>
                <p className="text-lg sm:text-xl text-muted-foreground mt-2">
                Select your name to begin scoring.
                </p>
            </div>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
                {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                        <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-muted animate-pulse flex items-center justify-center">
                            <Loader2 className="w-12 h-12 text-muted-foreground animate-spin"/>
                        </div>
                        <div className="h-6 w-24 bg-muted rounded-md animate-pulse" />
                    </div>
                ))
                ) : (
                judges.map((judge) => (
                    <div key={judge.id} className="flex flex-col items-center gap-4 text-center group">
                        <button
                            onClick={() => handleJudgeSelection(judge)}
                            className={cn(
                                'relative w-32 h-32 sm:w-40 sm:h-40 rounded-full flex items-center justify-center text-white font-bold text-5xl shadow-lg transition-all duration-300 transform group-hover:scale-110 group-hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-background bg-card'
                            )}
                        >
                            <Avatar className="h-full w-full">
                                <AvatarImage src={judge.photoURL} alt={judge.name} className="object-cover" />
                                <AvatarFallback className="text-muted-foreground">
                                    <User className="w-16 h-16 sm:w-20 sm:h-20" />
                                </AvatarFallback>
                            </Avatar>
                        </button>
                        <h2 className="text-xl sm:text-2xl font-headline text-card-foreground transition-colors group-hover:text-primary">{judge.name}</h2>
                    </div>
                ))
                )}
            </div>
        </div>
    );
  };

  const renderScoringSheet = () => (
    <>
      {authenticatedJudge && (
           <div className="text-center mb-10">
              <div className="flex justify-center mb-6">
                  <Button onClick={() => {
                      setAuthenticatedJudge(null);
                      setScores({});
                      setFeedbacks({});
                  }} variant="outline" className="shadow-lg">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Switch Judge
                  </Button>
              </div>
              <h1 className="font-headline text-4xl sm:text-5xl md:text-7xl font-bold text-primary">
                  Scoring for {authenticatedJudge.name}
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground mt-2">
                  Please provide your scores for each school.
              </p>
          </div>
      )}
      <Accordion type="multiple" className="w-full space-y-6">
          {schoolCategoryOrder.map(schoolCategory => (
              categorizedSchools[schoolCategory]?.length > 0 && (
                   <AccordionItem value={schoolCategory} key={schoolCategory}>
                      <AccordionTrigger className="text-3xl sm:text-4xl font-headline text-primary/80 hover:text-primary transition-colors data-[state=open]:text-primary">
                        {schoolCategory} Schools
                      </AccordionTrigger>
                      <AccordionContent>
                         <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 pt-4">
                              {categorizedSchools[schoolCategory].map((school, index) => (
                              <Card key={school.id} className="bg-card/50 backdrop-blur-sm shadow-lg">
                                  <CardHeader>
                                    <CardTitle className="flex items-center gap-3 font-headline text-2xl sm:text-3xl">
                                      <SchoolIcon className="w-7 h-7 sm:w-8 sm:h-8 text-primary"/>
                                      {school.name}
                                    </CardTitle>
                                    <CardDescription className="text-sm sm:text-base pt-1">
                                       Serial Number: {school.serialNumber ?? index + 1}
                                    </CardDescription>
                                  </CardHeader>
                                  <CardContent className="space-y-6">
                                      {schoolCategory === 'Sub-Junior' ? (
                                           <div className="space-y-2">
                                              <div className="flex items-center gap-2 text-primary">
                                                  <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
                                                  <label className="font-headline text-xl sm:text-2xl">Feedback & Notes</label>
                                              </div>
                                              <Textarea
                                                  placeholder={`Enter feedback for ${school.name}...`}
                                                  value={feedbacks[school.id] ?? ''}
                                                  onChange={(e) => handleFeedbackChange(school.id, e.target.value)}
                                                  disabled={submitting === school.id}
                                                  rows={4}
                                                  className="bg-background/80 text-sm sm:text-base"
                                              />
                                           </div>
                                      ) : (
                                          <div className="flex flex-row gap-4 overflow-x-auto pb-4">
                                            {categories.map(category => (
                                                <div key={category.id} className="space-y-2 flex-shrink-0 w-32">
                                                    <div className="flex items-center gap-2">
                                                      {categoryIcons[category.name] || categoryIcons.default}
                                                      <label className="text-sm sm:text-base font-medium">{category.name}</label>
                                                    </div>
                                                    <Select
                                                    value={(scores[school.id]?.[category.id] ?? 0).toString()}
                                                    onValueChange={(value) => handleScoreChange(school.id, category.id, value)}
                                                    disabled={submitting === school.id}
                                                    >
                                                    <SelectTrigger className="text-sm sm:text-base">
                                                        <SelectValue placeholder="Score" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Array.from({ length: 11 }, (_, i) => (
                                                            <SelectItem key={i} value={i.toString()}>{i}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                    </Select>
                                                </div>
                                            ))}
                                          </div>
                                      )}
                                    <Button size="lg" className="w-full font-bold text-base sm:text-lg" onClick={() => handleSubmit(school.id, school.category)} disabled={submitting === school.id}>
                                        {submitting === school.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Check className="mr-2 h-4 w-4"/>}
                                        {submitting === school.id ? "Submitting..." : (school.category === 'Sub-Junior' ? "Submit Feedback" : "Submit Score")}
                                    </Button>
                                  </CardContent>
                              </Card>
                              ))}
                          </div>
                      </AccordionContent>
                   </AccordionItem>
              )
          ))}
      </Accordion>
    </>
  );

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="fixed top-4 left-4 z-50">
        <NavButtons showBack={false} />
      </div>
      <div className="max-w-7xl mx-auto">
        {authenticatedJudge ? renderScoringSheet() : renderJudgeSelection()}
        {renderAuthModal()}
      </div>
    </div>
  );
}
