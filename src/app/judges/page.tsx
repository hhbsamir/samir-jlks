
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
import { collection, getDocs, query, where, writeBatch, doc } from "firebase/firestore";
import { Textarea } from "@/components/ui/textarea";


const categoryIcons: { [key: string]: React.ReactNode } = {
  Dance: <Drama className="w-6 h-6 text-purple-500" />,
  Costume: <Palette className="w-6 h-6 text-pink-500" />,
  Theme: <Theater className="w-6 h-6 text-orange-500" />,
  Music: <Music className="w-6 h-6 text-blue-500" />,
  "Make-up": <Brush className="w-6 h-6 text-red-500" />,
  default: <BarChart className="w-6 h-6 text-gray-500" />,
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
          action: <div className="p-2 bg-green-500 text-white rounded-full"><Check /></div>
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
                    <Card key={i} className="py-8">
                        <CardContent className="flex flex-col items-center text-center gap-4">
                           <div className="p-4 bg-muted rounded-full">
                               <Loader2 className="w-16 h-16 text-muted-foreground animate-spin" />
                           </div>
                           <div className="h-8 w-3/4 bg-muted rounded-md" />
                        </CardContent>
                    </Card>
                ))
            ) : (
                judges.map(judge => (
                    <Card key={judge.id} className="group transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/20 border-2 border-transparent hover:border-primary/50 overflow-hidden cursor-pointer" onClick={() => handleJudgeSelection(judge)}>
                        <CardContent className="pt-8 items-center text-center flex flex-col gap-4">
                            <div className="p-5 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full group-hover:from-primary/30 group-hover:to-accent/30 transition-colors">
                                <User className="w-16 h-16 text-primary" />
                            </div>
                            <h2 className="font-headline text-3xl">{judge.name}</h2>
                        </CardContent>
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
                  setFeedbacks({});
                }} variant="outline">
                    <ArrowLeft className="mr-2 h-5 w-5" />
                    Back to Judge Selection
                </Button>
            </div>
        )}
        <Accordion type="multiple" className="w-full space-y-8">
            {schoolCategoryOrder.map(schoolCategory => (
                categorizedSchools[schoolCategory]?.length > 0 && (
                     <AccordionItem value={schoolCategory} key={schoolCategory} className="border-b-0">
                        <AccordionTrigger className="text-3xl md:text-4xl text-foreground/90 font-headline hover:no-underline -mb-2">
                          {schoolCategory} Schools
                        </AccordionTrigger>
                        <AccordionContent>
                           <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 pt-8">
                                {categorizedSchools[schoolCategory].map((school, index) => (
                                <Card key={school.id} className="transform transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 flex flex-col bg-card/50">
                                    <CardHeader className="flex-row items-center gap-4">
                                      <div className="flex-shrink-0 w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                                        <SchoolIcon className="w-8 h-8 text-primary" />
                                      </div>
                                      <div className="flex-1">
                                        <CardTitle className="font-headline text-2xl md:text-3xl leading-tight">
                                          {school.name}
                                        </CardTitle>
                                        <CardDescription>
                                           Sl. No: {school.serialNumber ?? index + 1}
                                        </CardDescription>
                                      </div>
                                    </CardHeader>
                                    <CardContent className="space-y-6 flex-grow flex flex-col">
                                      <div className="space-y-4 flex-grow">
                                        {schoolCategory === 'Sub-Junior' ? (
                                             <div className="space-y-3 pt-4">
                                                <div className="flex items-center gap-3">
                                                    <MessageSquare className="w-6 h-6 text-accent" />
                                                    <label className="text-base md:text-lg font-medium">Notes</label>
                                                </div>
                                                <Textarea
                                                    placeholder={`Enter feedback for ${school.name}...`}
                                                    value={feedbacks[school.id] ?? ''}
                                                    onChange={(e) => handleFeedbackChange(school.id, e.target.value)}
                                                    disabled={submitting === school.id}
                                                    rows={5}
                                                />
                                             </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-4">
                                              {categories.map(category => (
                                                  <div key={category.id} className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                      {categoryIcons[category.name] || categoryIcons.default}
                                                      <label className="text-sm font-medium">{category.name}</label>
                                                    </div>
                                                      <div className="w-full">
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
                                              ))}
                                            </div>
                                        )}
                                      </div>
                                      <Button className="w-full mt-auto font-bold" onClick={() => handleSubmit(school.id, school.category)} disabled={submitting === school.id}>
                                          {submitting === school.id ? <Loader2 className="mr-2 h-5 w-5 animate-spin"/> : <Check className="mr-2 h-5 w-5"/>}
                                          {submitting === school.id ? "Submitting..." : `Submit for ${school.name}`}
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
    <div className="min-h-screen bg-background p-4 sm:p-8 pt-20">
      <div className="fixed top-4 left-4 z-50">
        <NavButtons />
      </div>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="font-headline text-5xl md:text-6xl text-primary">
            {authenticatedJudge ? `Scoring for ${authenticatedJudge.name}` : "Judge's Portal"}
          </h1>
          <p className="text-lg md:text-xl text-foreground/80 mt-2">
            {authenticatedJudge ? "Assign your scores and feedback with precision and expertise." : "Select your name to begin scoring."}
          </p>
        </div>
        
        {authenticatedJudge ? renderScoringSheet() : renderJudgeSelection()}
        {renderAuthModal()}
      </div>
    </div>
  );
}
