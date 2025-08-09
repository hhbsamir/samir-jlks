
"use client";

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import type { School, CompetitionCategory, Score, SchoolCategory, Judge, Feedback } from '@/lib/data';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, Award, Star } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';


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

type CategoryWinner = {
    school: School;
    score: number;
}

type LeaderboardClientProps = {
    schools: School[];
    categories: CompetitionCategory[];
    scores: Score[];
    feedbacks: Feedback[];
    judges: Judge[];
}

export default function LeaderboardClient({ schools, categories, scores, feedbacks, judges }: LeaderboardClientProps) {

  const schoolCategories: SchoolCategory[] = ["Senior", "Junior", "Sub-Junior"];
  const themeCategory = useMemo(() => categories.find(c => c.name.toLowerCase() === 'theme'), [categories]);
  const [selectedPrizeCategoryId, setSelectedPrizeCategoryId] = useState<string | undefined>(themeCategory?.id ?? categories[0]?.id);


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

  const categoryPrizeWinners = useMemo(() => {
    if (!selectedPrizeCategoryId) return { Senior: [], Junior: [] };

    const getWinners = (category: 'Senior' | 'Junior'): CategoryWinner[] => {
        const categoryLeaderboard = categorizedLeaderboardData[category];
        if (!categoryLeaderboard) return [];

        const top3OverallIds = categoryLeaderboard.slice(0, 3).map(entry => entry.school.id);

        const contenders = categoryLeaderboard
            .filter(entry => !top3OverallIds.includes(entry.school.id))
            .map(entry => ({
                school: entry.school,
                score: entry.totalScores[selectedPrizeCategoryId] ?? 0
            }))
            .sort((a, b) => b.score - a.score);
        
        return contenders.slice(0, 3);
    };

    return {
        Senior: getWinners('Senior'),
        Junior: getWinners('Junior'),
    };
  }, [categorizedLeaderboardData, selectedPrizeCategoryId]);
  
  const getRankDisplay = (rank: number) => {
    const rankStyles = [
        { icon: Trophy, color: 'text-yellow-500', size: 'w-6 h-6 sm:w-8 sm:h-8' }, // 1st
        { icon: Medal, color: 'text-slate-400', size: 'w-5 h-5 sm:w-7 sm:h-7' },   // 2nd
        { icon: Award, color: 'text-orange-400', size: 'w-4 h-4 sm:w-6 sm:h-6' },  // 3rd
    ];

    if (rank >= 1 && rank <= 3) {
        const { icon: Icon, color, size } = rankStyles[rank - 1];
        return (
            <div className="flex items-center justify-center gap-2 w-12 sm:w-16">
                <Icon className={cn(size, color)} />
                <span className={cn("font-bold text-lg sm:text-xl", color)}>{rank}</span>
            </div>
        );
    }
    return <div className="font-bold text-base sm:text-lg text-muted-foreground w-12 sm:w-16 text-center">{rank}</div>;
  }

  const renderJuniorSenior = (category: 'Junior' | 'Senior') => {
    const leaderboardData = categorizedLeaderboardData[category];
    if (!leaderboardData || leaderboardData.length === 0) return <p className="p-4 text-center text-muted-foreground">No data available for this category yet.</p>;

    return (
        <section key={category}>
             <Accordion type="multiple" className="w-full space-y-4">
                {leaderboardData.map((entry, index) => {
                    const rank = index + 1;
                    return (
                        <AccordionItem value={entry.school.id} key={entry.school.id} className="border-b-0">
                           <Card className="overflow-hidden">
                            <AccordionTrigger className="hover:no-underline text-left p-0 data-[state=open]:bg-muted/50">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full p-2 sm:p-4 hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-2 sm:gap-4 flex-grow w-full sm:w-auto">
                                        {getRankDisplay(rank)}
                                        <div className="flex-grow">
                                            <span className="font-headline text-lg sm:text-2xl">{entry.school.name}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-end gap-2 sm:gap-4 mt-2 sm:mt-0 w-full sm:w-auto flex-nowrap">
                                        {categories.map(cat => (
                                            <div key={cat.id} className="text-center flex-shrink-0 w-14 sm:w-16">
                                                <div className="text-xs text-muted-foreground truncate">{cat.name}</div>
                                                <div className="font-semibold text-base sm:text-lg">{entry.totalScores[cat.id]}</div>
                                            </div>
                                        ))}
                                        <div className="text-right pl-2 sm:pl-4 border-l flex-shrink-0 w-16 sm:w-20">
                                            <div className="text-xs sm:text-sm text-muted-foreground">Total</div>
                                            <div className="font-bold text-primary text-xl sm:text-2xl">{entry.totalScore}</div>
                                        </div>
                                        <div className="hidden sm:block pl-2 [&_svg]:mx-2 self-center"></div>
                                    </div>

                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="px-4 pb-4 bg-muted/30 overflow-x-auto">
                                    <h4 className="font-headline text-lg text-primary pt-4 pb-2">Judge Score Breakdown</h4>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="min-w-[120px]">Judge</TableHead>
                                                {categories.map(cat => (
                                                  <TableHead key={cat.id} className="text-center min-w-[80px]">{cat.name}</TableHead>
                                                ))}
                                                <TableHead className="text-right min-w-[80px]">Total</TableHead>
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
    if (subJuniorFeedbackData.length === 0) return <p className="p-4 text-center text-muted-foreground">No feedback available for this category yet.</p>;
    return (
        <section>
            <div className="space-y-6">
                {subJuniorFeedbackData.map(entry => (
                     <Card key={entry.school.id}>
                        <CardHeader>
                            <CardTitle className="font-headline text-xl sm:text-2xl">{entry.school.name}</CardTitle>
                            <CardDescription>Feedback provided by the judges.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {Object.values(entry.feedbacks).map((feedbackData, index) => (
                                    <Card key={index} className="bg-muted/30">
                                        <CardHeader>
                                            <CardTitle className="text-base sm:text-lg">{feedbackData.judgeName}</CardTitle>
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

  const renderCategoryPrizes = () => {
    const hasSeniorWinners = categoryPrizeWinners.Senior.length > 0;
    const hasJuniorWinners = categoryPrizeWinners.Junior.length > 0;
    const selectedCategoryName = categories.find(c => c.id === selectedPrizeCategoryId)?.name || '';

    if (!categories || categories.length === 0) {
        return <p className="p-4 text-center text-muted-foreground">No scoring categories have been configured.</p>;
    }
    
    return (
        <div className="space-y-8">
            <Card className="max-w-sm mx-auto">
                <CardContent className="pt-6">
                    <Label htmlFor="category-prize-select" className="text-base">Select Prize Category</Label>
                    <Select value={selectedPrizeCategoryId} onValueChange={setSelectedPrizeCategoryId}>
                        <SelectTrigger id="category-prize-select">
                            <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map(cat => (
                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {!selectedPrizeCategoryId ? (
                <p className="p-4 text-center text-muted-foreground">Please select a category to view winners.</p>
            ) : (
            <>
                {hasSeniorWinners && (
                <Card>
                    <CardHeader>
                    <CardTitle className="font-headline text-xl sm:text-2xl text-purple-700">Senior - {selectedCategoryName} Winners</CardTitle>
                    <CardDescription>Top 3 schools based on {selectedCategoryName} score, excluding overall top 3 winners.</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Rank</TableHead>
                            <TableHead>School</TableHead>
                            <TableHead className="text-right">{selectedCategoryName} Score</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {categoryPrizeWinners.Senior.map((winner, index) => (
                            <TableRow key={winner.school.id}>
                            <TableCell className="font-bold flex items-center gap-2">
                                <Star className="w-6 h-6 text-purple-500" /> {index + 1}
                            </TableCell>
                            <TableCell>{winner.school.name}</TableCell>
                            <TableCell className="text-right font-bold">{winner.score}</TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    </CardContent>
                </Card>
                )}
                {hasJuniorWinners && (
                <Card>
                    <CardHeader>
                    <CardTitle className="font-headline text-xl sm:text-2xl text-purple-700">Junior - {selectedCategoryName} Winners</CardTitle>
                    <CardDescription>Top 3 schools based on {selectedCategoryName} score, excluding overall top 3 winners.</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Rank</TableHead>
                            <TableHead>School</TableHead>
                            <TableHead className="text-right">{selectedCategoryName} Score</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {categoryPrizeWinners.Junior.map((winner, index) => (
                            <TableRow key={winner.school.id}>
                            <TableCell className="font-bold flex items-center gap-2">
                                <Star className="w-6 h-6 text-purple-500" /> {index + 1}
                            </TableCell>
                            <TableCell>{winner.school.name}</TableCell>
                            <TableCell className="text-right font-bold">{winner.score}</TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    </CardContent>
                </Card>
                )}
                {!hasJuniorWinners && !hasSeniorWinners && (
                     <p className="p-4 text-center text-muted-foreground">No prize winners to show for {selectedCategoryName}.</p>
                )}
            </>
            )}
        </div>
    );
  };

  const hasSeniorData = categorizedLeaderboardData.Senior && categorizedLeaderboardData.Senior.length > 0;
  const hasJuniorData = categorizedLeaderboardData.Junior && categorizedLeaderboardData.Junior.length > 0;
  const hasSubJuniorData = subJuniorFeedbackData.length > 0;
  const hasCategoryPrizes = categories.length > 0;

  const TABS = [
    { value: 'senior', label: 'Senior', hasData: hasSeniorData, content: () => renderJuniorSenior('Senior') },
    { value: 'junior', label: 'Junior', hasData: hasJuniorData, content: () => renderJuniorSenior('Junior') },
    { value: 'category-prizes', label: 'Category', hasData: hasCategoryPrizes, content: renderCategoryPrizes },
    { value: 'sub-junior', label: 'Sub-Junior', hasData: hasSubJuniorData, content: renderSubJunior },
  ];
  
  const availableTabs = TABS.filter(tab => tab.hasData);
  const [activeTab, setActiveTab] = useState(availableTabs[0]?.value || '');

  React.useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.find(tab => tab.value === activeTab)) {
      setActiveTab(availableTabs[0].value);
    }
  }, [availableTabs, activeTab]);

  return (
    <div>
      <PageHeader title="Leaderboard" centerTitle={true} />
      
      {availableTabs.length > 0 ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex justify-center">
            <TabsList className="grid w-full max-w-2xl grid-cols-2 md:grid-cols-4 h-auto">
              {availableTabs.map(tab => (
                 <TabsTrigger key={tab.value} value={tab.value} className="py-2 text-sm sm:py-3 sm:text-base">
                   {tab.label}
                 </TabsTrigger>
              ))}
            </TabsList>
          </div>
          {availableTabs.map(tab => (
            <TabsContent key={tab.value} value={tab.value} className="pt-4 sm:pt-8">
              {tab.content()}
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">The leaderboard is currently empty.</p>
            <p className="text-muted-foreground">Scores and feedback will appear here as judges submit them.</p>
        </div>
      )}
    </div>
  );
}
