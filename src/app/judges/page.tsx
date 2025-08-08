"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, BarChart, Check, Music, Palette, Theater } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/hooks/use-toast";
import {
  initialCategories,
  initialJudges,
  initialSchools,
  initialScores,
} from "@/lib/data";
import type { School, CompetitionCategory, Judge, Score } from "@/lib/data";

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
  const [schools] = useState<School[]>(initialSchools);
  const [categories] = useState<CompetitionCategory[]>(initialCategories);
  const [judges] = useState<Judge[]>(initialJudges);
  const [selectedJudge, setSelectedJudge] = useState<Judge | null>(null);

  const initialSchoolScores = useMemo(() => {
    if (!selectedJudge) return {};
    return initialScores.reduce((acc: SchoolScores, score) => {
      if (score.judgeId === selectedJudge.id) {
        if (!acc[score.schoolId]) {
          acc[score.schoolId] = {};
        }
        acc[score.schoolId][score.categoryId] = score.score;
      }
      return acc;
    }, {});
  }, [selectedJudge]);

  const [scores, setScores] = useState<SchoolScores>(initialSchoolScores);

  React.useEffect(() => {
    setScores(initialSchoolScores);
  }, [initialSchoolScores]);


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
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <Button asChild variant="ghost" className="mb-8">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Link>
        </Button>
        <div className="text-center mb-10">
          <h1 className="font-headline text-6xl text-primary">Judge's Portal</h1>
          <p className="text-xl text-foreground/80 mt-2">Assign your scores with precision and expertise.</p>
        </div>

        <div className="max-w-md mx-auto mb-12">
            <Select onValueChange={(judgeId) => setSelectedJudge(judges.find(j => j.id === judgeId) || null)}>
                <SelectTrigger className="h-14 text-lg">
                    <SelectValue placeholder="Select your name to begin..." />
                </SelectTrigger>
                <SelectContent>
                    {judges.map(judge => (
                        <SelectItem key={judge.id} value={judge.id} className="text-lg">{judge.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>

        {selectedJudge && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {schools.map(school => (
              <Card key={school.id} className="transform transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20">
                <CardHeader>
                  <CardTitle className="font-headline text-3xl">{school.name}</CardTitle>
                  <CardDescription className="text-base">{school.category}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {categories.map(category => (
                    <div key={category.id} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           {categoryIcons[category.name] || categoryIcons.default}
                           <label className="text-lg font-medium">{category.name}</label>
                        </div>
                        <span className="text-xl font-bold text-primary w-10 text-center">
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
