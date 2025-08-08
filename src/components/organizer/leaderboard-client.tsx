
"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import type { School, CompetitionCategory, Score, SchoolCategory, Judge, Feedback } from '@/lib/data';
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
  totalScores: { [categoryId: string]: number };
  totalScore: number;
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

type LeaderboardClientProps = {
    schools: School[];
    categories: CompetitionCategory[];
    scores: Score[];
    feedbacks: Feedback[];
    judges: Judge[];
}

export default function LeaderboardClient({ schools, categories, scores, feedbacks, judges }: LeaderboardClientProps) {

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
            totalScores: {},
            totalScore: 0,
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
            const totalScore = categoryScores.reduce((sum, s) => sum + s.score, 0);
            schoolData.totalScores[category.id] = totalScore;
            schoolData.totalScore += totalScore;
          });
          
          return schoolData;
        });

        acc[category] = schoolScores.sort((a, b) => b.totalScore - a.totalScore);
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
    if (!leaderboardData || leaderboardData.length === 0) return <p className="p-4 text-muted-foreground">No data available for this category yet.</p>;

    return (
        <section key={category}>
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
                                                        <div className="font-semibold text-lg">{entry.totalScores[cat.id]}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="text-right pl-4 border-l">
                                            <div className="text-sm text-muted-foreground">Total</div>
                                            <div className="font-bold text-primary text-2xl">{entry.totalScore}</div>
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
    if (subJuniorFeedbackData.length === 0) return <p className="p-4 text-muted-foreground">No feedback available for this category yet.</p>;
    return (
        <section>
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

  const hasSeniorData = categorizedLeaderboardData.Senior && categorizedLeaderboardData.Senior.length > 0;
  const hasJuniorData = categorizedLeaderboardData.Junior && categorizedLeaderboardData.Junior.length > 0;
  const hasSubJuniorData = subJuniorFeedbackData.length > 0;


  return (
    <div>
      <PageHeader title="Leaderboard" />
      
      <Accordion type="multiple" className="w-full space-y-8" defaultValue={["senior", "junior", "sub-junior"]}>
        {hasSeniorData && (
          <AccordionItem value="senior">
            <AccordionTrigger className="text-xl font-bold hover:no-underline p-4 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-lg">
              Senior Category
            </AccordionTrigger>
            <AccordionContent className="pt-8">
              {renderJuniorSenior('Senior')}
            </AccordionContent>
          </AccordionItem>
        )}
        {hasJuniorData && (
          <AccordionItem value="junior">
            <AccordionTrigger className="text-xl font-bold hover:no-underline p-4 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 rounded-lg">
              Junior Category
            </AccordionTrigger>
            <AccordionContent className="pt-8">
              {renderJuniorSenior('Junior')}
            </AccordionContent>
          </AccordionItem>
        )}
        {hasSubJuniorData && (
          <AccordionItem value="sub-junior">
            <AccordionTrigger className="text-xl font-bold hover:no-underline p-4 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 rounded-lg">
              Sub-Junior Category Feedback
            </AccordionTrigger>
            <AccordionContent className="pt-8">
              {renderSubJunior()}
            </AccordionContent>
          </AccordionItem>
        )}
         {!hasSeniorData && !hasJuniorData && !hasSubJuniorData && (
            <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">The leaderboard is currently empty.</p>
                <p className="text-muted-foreground">Scores and feedback will appear here as judges submit them.</p>
            </div>
        )}
      </Accordion>
    </div>
  );
}
