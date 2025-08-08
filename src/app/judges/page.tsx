"use client";

import React, { useState, useMemo, useEffect } from "react";
import { ArrowLeft, BarChart, Check, Music, Palette, Theater } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/hooks/use-toast";
import type { School, CompetitionCategory, Judge, Score } from "@/lib/data";
import { NavButtons } from "@/components/common/NavButtons";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";


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

  useEffect(() => {
    const fetchData = async () => {
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
    };

    fetchData();
  }, []);

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


  const handleScoreChange = (schoolId: string, categoryId: string, value: number[]) => {
    setScores(prev => ({
      ...prev,
      [schoolId]: {
        ...prev[schoolId],
        [categoryId]: value[0],
      },
    }));
  };
  
  const handleSubmit = (schoolId: string) => {
    console.log(`Submitting scores for school ${schoolId}:`, scores[schoolId]);
    toast({
      title: "Scores Submitted!",
      description: `Your scores for ${schools.find(s => s.id === schoolId)?.name} have been recorded.`,
      action: <div className="p-2 bg-green-500 text-white rounded-full"><Check /></div>
    });
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
            <Select onValueChange={(judgeId) => setSelectedJudge(judges.find(j => j.id === judgeId) || null)}>
                <SelectTrigger className="h-12 text-base md:h-14 md:text-lg">
                    <SelectValue placeholder="Select your name to begin..." />
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
                        <span className="text-lg md:text-xl font-bold text-primary w-10 text-center">
                          {scores[school.id]?.[category.id] ?? 0}
                        </span>
                      </div>
                      <Slider
                        value={[scores[school.id]?.[category.id] ?? 0]}
                        onValueChange={(value) => handleScoreChange(school.id, category.id, value)}
                        max={10}
                        step={1}
                        className="[&>span]:bg-accent"
                      />
                    </div>
                  ))}
                  <Button className="w-full mt-4 font-bold" onClick={() => handleSubmit(school.id)}>
                    <Check className="mr-2 h-5 w-5"/>
                    Submit Scores for {school.name}
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
