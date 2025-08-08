"use client";

import React, { useState, useMemo, useEffect } from "react";
import { ArrowLeft, BarChart, Check, Music, Palette, Theater, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { School, CompetitionCategory, Judge, Score } from "@/lib/data";
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

export default function JudgesPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [categories, setCategories] = useState<CompetitionCategory[]>([]);
  const [judges, setJudges] = useState<Judge[]>([]);
  const [scores, setScores] = useState<SchoolScores>({});
  const [selectedJudge, setSelectedJudge] = useState<Judge | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);
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
      if (!selectedJudge) return;

      const scoresCollection = collection(db, 'scores');
      const q = query(scoresCollection, where("judgeId", "==", selectedJudge.id));
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

    if (selectedJudge) {
        fetchScores();
    }
  }, [selectedJudge, schools, categories]);


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
    if (!selectedJudge) return;
    setSubmitting(schoolId);
    
    try {
        const batch = writeBatch(db);
        const schoolScores = scores[schoolId];

        for (const categoryId in schoolScores) {
            const scoreValue = schoolScores[categoryId];
            const scoreData: Score = {
                judgeId: selectedJudge.id,
                schoolId: schoolId,
                categoryId: categoryId,
                score: scoreValue,
            };
            
            const scoreDocId = `${selectedJudge.id}_${schoolId}_${categoryId}`;
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

  return (
    <div className="min-h-screen p-4 sm:p-8 pt-20">
      <NavButtons />
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="font-headline text-5xl md:text-6xl text-primary">Judge's Portal</h1>
          <p className="text-lg md:text-xl text-foreground/80 mt-2">Assign your scores with precision and expertise.</p>
        </div>

        <div className="max-w-md mx-auto mb-12">
            <Select onValueChange={(judgeId) => setSelectedJudge(judges.find(j => j.id === judgeId) || null)} disabled={loading}>
                <SelectTrigger className="h-12 text-base md:h-14 md:text-lg">
                    <SelectValue placeholder={loading ? "Loading judges..." : "Select your name to begin..."} />
                </SelectTrigger>
                <SelectContent>
                    {judges.map(judge => (
                        <SelectItem key={judge.id} value={judge.id} className="text-base md:text-lg">{judge.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>

        {selectedJudge && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {schools.map(school => (
              <Card key={school.id} className="transform transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20">
                <CardHeader>
                  <CardTitle className="font-headline text-2xl md:text-3xl">{school.name}</CardTitle>
                  <CardDescription className="text-base">{school.category}</CardDescription>
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
        )}
      </div>
    </div>
  );
}
