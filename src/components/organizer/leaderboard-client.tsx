
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import type { School, CompetitionCategory, Score, SchoolCategory, Judge, Feedback } from '@/lib/data';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';


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
        [judgeId: string]: string;
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
            schoolData.feedbacks[judge.id] = feedbackEntry?.feedback || 'No feedback yet.';
        });

        return schoolData;
    });
  }, [schools, feedbacks, judges]);

  const renderJuniorSenior = (category: 'Junior' | 'Senior') => {
    const leaderboardData = categorizedLeaderboardData[category];
    if (!leaderboardData || leaderboardData.length === 0) return null;

    return (
        <section key={category}>
            <h2 className="font-headline text-3xl md:text-4xl text-foreground/90 mb-6">{category} Category</h2>
            <Card>
                 <Accordion type="multiple" className="w-full">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">Rank</TableHead>
                                <TableHead>School</TableHead>
                                {categories.map(cat => (
                                <TableHead key={cat.id} className="text-center hidden sm:table-cell">{cat.name}</TableHead>
                                ))}
                                <TableHead className="text-right font-bold">Total</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                    </Table>
                    {leaderboardData.map((entry, index) => (
                        <AccordionItem value={entry.school.id} key={entry.school.id} className="border-b">
                           <Table>
                             <TableBody>
                               <TableRow>
                                   <TableCell className="w-[50px] font-bold text-lg">{index + 1}</TableCell>
                                   <TableCell>
                                       <div className="font-medium">{entry.school.name}</div>
                                   </TableCell>
                                   {categories.map(cat => (
                                       <TableCell key={cat.id} className="text-center text-lg hidden sm:table-cell">{entry.averageScores[cat.id]}</TableCell>
                                   ))}
                                   <TableCell className="text-right font-bold text-primary text-xl">{entry.totalAverage}</TableCell>
                                   <TableCell className="w-[50px]">
                                       <AccordionTrigger className="hover:no-underline [&_svg]:mx-4 p-0"></AccordionTrigger>
                                   </TableCell>
                               </TableRow>
                             </TableBody>
                           </Table>
                            <AccordionContent>
                                <div className="px-4 pb-4">
                                  <Card className="bg-primary/5">
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
                                                <TableCell key={cat.id} className="text-center">{entry.scoresByJudge[judge.id]?.categoryScores[cat.id] || 0}</TableCell>
                                              ))}
                                              <TableCell className="text-right font-bold">{entry.scoresByJudge[judge.id]?.total || 0}</TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                    </Table>
                                  </Card>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </Card>
        </section>
    );
  }

  const renderSubJunior = () => {
    if (subJuniorFeedbackData.length === 0) return null;
    return (
        <section>
            <h2 className="font-headline text-3xl md:text-4xl text-foreground/90 mb-6">Sub-Junior Category Feedback</h2>
            <Accordion type="multiple" className="w-full space-y-4">
                {subJuniorFeedbackData.map(entry => (
                    <AccordionItem value={entry.school.id} key={entry.school.id}>
                        <AccordionTrigger className="text-xl text-foreground/90 font-headline hover:no-underline bg-muted/50 px-4 rounded-md">
                            {entry.school.name}
                        </AccordionTrigger>
                        <AccordionContent className="pt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {judges.map(judge => (
                                    <Card key={judge.id}>
                                        <CardHeader>
                                            <CardTitle>{judge.name}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <p className="text-sm text-muted-foreground">{entry.feedbacks[judge.id]}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
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
