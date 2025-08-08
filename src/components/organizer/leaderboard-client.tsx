
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import type { School, CompetitionCategory, Score, SchoolCategory, Judge, Feedback } from '@/lib/data';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Trophy, Medal, Award } from 'lucide-react';


type SchoolScore = {
  school: School;
  scoresByJudge: {
    [judgeId: string]: {
      judgeName: string;
      categoryScores: { [categoryId: string]: number };
      total: number;
    }
  };
  averageScores: { [categoryId: string]: number };
  totalAverage: number;
};


type SchoolFeedback = {
    school: School;
    feedbacks: {
        [judgeId: string]: {
          judgeName: string;
          feedback: string;
        }
    };
};

type CategorizedLeaderboard = {
  [key in SchoolCategory]?: SchoolScore[];
};

export default function LeaderboardClient() {
  const [schools, setSchools] = useState<School[]>([]);
  const [categories, setCategories] = useState<CompetitionCategory[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [judges, setJudges] = useState<Judge[]>([]);

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

      const scoresCollection = collection(db, 'scores');
      const scoresSnapshot = await getDocs(scoresCollection);
      const scoresList = scoresSnapshot.docs.map(doc => doc.data() as Score);
      setScores(scoresList);

      const feedbacksCollection = collection(db, 'feedbacks');
      const feedbacksSnapshot = await getDocs(feedbacksCollection);
      const feedbacksList = feedbacksSnapshot.docs.map(doc => doc.data() as Feedback);
      setFeedbacks(feedbacksList);
      
      const judgesCollection = collection(db, 'judges');
      const judgesSnapshot = await getDocs(judgesCollection);
      const judgesList = judgesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Judge));
      setJudges(judgesList);
    };

    fetchData();
  }, []);

  const schoolCategories: SchoolCategory[] = ["Senior", "Junior", "Sub-Junior"];

  const categorizedLeaderboardData = useMemo(() => {
    if (schools.length === 0 || categories.length === 0 || judges.length === 0) return {};

    const juniorSeniorCategories = schoolCategories.filter(c => c !== 'Sub-Junior');

    return juniorSeniorCategories.reduce((acc: CategorizedLeaderboard, category) => {
      const schoolsInCategory = schools.filter(school => school.category === category);
      
      if (schoolsInCategory.length > 0) {
        const schoolScores = schoolsInCategory.map(school => {
          const schoolData: SchoolScore = {
            school,
            scoresByJudge: {},
            averageScores: {},
            totalAverage: 0,
          };

          judges.forEach(judge => {
            let judgeTotal = 0;
            const categoryScores: { [categoryId: string]: number } = {};

            categories.forEach(category => {
              const score = scores.find(
                s => s.schoolId === school.id && s.categoryId === category.id && s.judgeId === judge.id
              )?.score || 0;
              categoryScores[category.id] = score;
              judgeTotal += score;
            });
            
            schoolData.scoresByJudge[judge.id] = {
              judgeName: judge.name,
              categoryScores,
              total: judgeTotal,
            };
          });

          categories.forEach(category => {
            const categoryScores = scores.filter(
              s => s.schoolId === school.id && s.categoryId === category.id
            );
            const avgScore = categoryScores.reduce((sum, s) => sum + s.score, 0) / (judges.length || 1);
            schoolData.averageScores[category.id] = parseFloat(avgScore.toFixed(2));
            schoolData.totalAverage += avgScore;
          });
          schoolData.totalAverage = parseFloat(schoolData.totalAverage.toFixed(2));
          return schoolData;
        });

        acc[category] = schoolScores.sort((a, b) => b.totalAverage - a.totalAverage);
      }
      return acc;
    }, {});
  }, [schools, categories, scores, judges]);

  const subJuniorFeedbackData = useMemo(() => {
    const subJuniorSchools = schools.filter(s => s.category === 'Sub-Junior');
    if (subJuniorSchools.length === 0 || feedbacks.length === 0 || judges.length === 0) return [];

    return subJuniorSchools.map(school => {
        const schoolData: SchoolFeedback = {
            school,
            feedbacks: {},
        };

        judges.forEach(judge => {
            const feedbackEntry = feedbacks.find(f => 
                f.schoolId === school.id && 
                f.judgeId === judge.id
            );
            schoolData.feedbacks[judge.id] = {
              judgeName: judge.name,
              feedback: feedbackEntry?.feedback || 'No feedback yet.'
            }
        });

        return schoolData;
    });
  }, [schools, feedbacks, judges]);
  
  const getRankIcon = (rank: number) => {
    if(rank === 1) return <Trophy className="w-8 h-8 text-yellow-500" />;
    if(rank === 2) return <Medal className="w-8 h-8 text-slate-400" />;
    if(rank === 3) return <Award className="w-8 h-8 text-orange-400" />;
    return <span className="font-bold text-lg text-muted-foreground w-8 text-center">{rank}</span>
  }

  const renderJuniorSenior = (category: 'Junior' | 'Senior') => {
    const leaderboardData = categorizedLeaderboardData[category];
    if (!leaderboardData || leaderboardData.length === 0) return null;

    return (
        <section key={category}>
            <h2 className="font-headline text-3xl md:text-4xl text-foreground/90 mb-6">{category} Category</h2>
             <Accordion type="multiple" className="w-full space-y-4">
                {leaderboardData.map((entry, index) => {
                    const rank = index + 1;
                    return (
                        <AccordionItem value={entry.school.id} key={entry.school.id} className="border-b-0">
                           <Card className="overflow-hidden">
                            <AccordionTrigger className="hover:no-underline text-left p-0">
                                <div className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        {getRankIcon(rank)}
                                        <span className="font-headline text-2xl">{entry.school.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right hidden sm:block">
                                            <div className="flex gap-4">
                                                {categories.map(cat => (
                                                    <div key={cat.id} className="text-center">
                                                        <div className="text-xs text-muted-foreground">{cat.name}</div>
                                                        <div className="font-semibold text-lg">{entry.averageScores[cat.id]}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="text-right pl-4 border-l">
                                            <div className="text-sm text-muted-foreground">Total</div>
                                            <div className="font-bold text-primary text-2xl">{entry.totalAverage}</div>
                                        </div>
                                        <div className="pl-2 [&_svg]:mx-2"></div>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="px-4 pb-4 bg-muted/30">
                                    <h4 className="font-headline text-lg text-primary pt-4 pb-2">Judge Score Breakdown</h4>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Judge</TableHead>
                                                {categories.map(cat => (
                                                  <TableHead key={cat.id} className="text-center">{cat.name}</TableHead>
                                                ))}
                                                <TableHead className="text-right">Total</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {judges.map(judge => (
                                            <TableRow key={judge.id}>
                                              <TableCell className="font-medium">{judge.name}</TableCell>
                                              {categories.map(cat => (
                                                <TableCell key={cat.id} className="text-center">{entry.scoresByJudge[judge.id]?.categoryScores[cat.id] ?? 0}</TableCell>
                                              ))}
                                              <TableCell className="text-right font-bold">{entry.scoresByJudge[judge.id]?.total ?? 0}</TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </AccordionContent>
                           </Card>
                        </AccordionItem>
                    )
                })}
            </Accordion>
        </section>
    );
  }

  const renderSubJunior = () => {
    if (subJuniorFeedbackData.length === 0) return null;
    return (
        <section>
            <h2 className="font-headline text-3xl md:text-4xl text-foreground/90 mb-6">Sub-Junior Category Feedback</h2>
            <div className="space-y-6">
                {subJuniorFeedbackData.map(entry => (
                     <Card key={entry.school.id}>
                        <CardHeader>
                            <CardTitle className="font-headline text-2xl">{entry.school.name}</CardTitle>
                            <CardDescription>Feedback provided by the judges.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.values(entry.feedbacks).map((feedbackData, index) => (
                                    <Card key={index} className="bg-muted/30">
                                        <CardHeader>
                                            <CardTitle className="text-lg">{feedbackData.judgeName}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground italic">"{feedbackData.feedback}"</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>
    )
  }

  return (
    <div>
      <PageHeader title="Leaderboard" />
      
      <div className="space-y-12">
        {renderJuniorSenior('Senior')}
        {renderJuniorSenior('Junior')}
        {renderSubJunior()}
      </div>
    </div>
  );
}

    