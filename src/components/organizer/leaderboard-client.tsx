"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import { initialSchools, initialCategories, initialScores, initialJudges } from '@/lib/data';
import type { School, CompetitionCategory, Score } from '@/lib/data';
import { Trophy } from 'lucide-react';

type SchoolScore = {
  school: School;
  scores: { [categoryId: string]: number };
  total: number;
};

const winnerColors = [
  'text-yellow-400', // Gold
  'text-slate-400', // Silver
  'text-amber-600'  // Bronze
];

export default function LeaderboardClient() {
  const [schools] = useState(initialSchools);
  const [categories] = useState(initialCategories);
  const [scores] = useState(initialScores);
  const [judges] = useState(initialJudges);

  const leaderboardData = useMemo(() => {
    const schoolScores = schools.map(school => {
      const schoolData: SchoolScore = {
        school,
        scores: {},
        total: 0,
      };

      categories.forEach(category => {
        const categoryScores = scores.filter(
          s => s.schoolId === school.id && s.categoryId === category.id
        );
        const avgScore = categoryScores.reduce((sum, s) => sum + s.score, 0) / (judges.length || 1);
        schoolData.scores[category.id] = parseFloat(avgScore.toFixed(2));
        schoolData.total += avgScore;
      });
      schoolData.total = parseFloat(schoolData.total.toFixed(2));
      return schoolData;
    });

    return schoolScores.sort((a, b) => b.total - a.total);
  }, [schools, categories, scores, judges]);

  const topThree = leaderboardData.slice(0, 3);
  const others = leaderboardData.slice(3);

  return (
    <div>
      <PageHeader title="Leaderboard" />
      
      <section className="mb-12">
        <h2 className="font-headline text-3xl md:text-4xl text-foreground/90 mb-6 text-center">Top Performers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {topThree.map((entry, index) => (
             <Card key={entry.school.id} className="relative text-center border-2 border-transparent transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20" style={{borderColor: winnerColors[index].replace('text-','').replace('-400','').replace('-600','')}}>
              <CardHeader className="items-center p-4 md:p-6">
                 <Trophy className={`w-12 h-12 md:w-16 md:h-16 mb-2 ${winnerColors[index]}`} />
                 <CardTitle className="font-headline text-2xl md:text-3xl">{entry.school.name}</CardTitle>
                 <p className="text-base text-muted-foreground">{entry.school.category}</p>
              </CardHeader>
              <CardContent className="p-4 md:p-6 pt-0">
                <p className="text-5xl md:text-6xl font-bold text-primary">{entry.total}</p>
                <p className="text-sm text-muted-foreground">Total Score</p>
              </CardContent>
             </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-headline text-3xl md:text-4xl text-foreground/90 mb-6">Full Rankings</h2>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Rank</TableHead>
                <TableHead>School</TableHead>
                {categories.map(cat => (
                  <TableHead key={cat.id} className="text-center hidden sm:table-cell">{cat.name}</TableHead>
                ))}
                <TableHead className="text-right font-bold">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboardData.map((entry, index) => (
                <TableRow key={entry.school.id} className={index < 3 ? 'bg-primary/5' : ''}>
                  <TableCell className="font-bold text-lg">{index + 1}</TableCell>
                  <TableCell>
                    <div className="font-medium">{entry.school.name}</div>
                    <div className="text-sm text-muted-foreground">{entry.school.category}</div>
                  </TableCell>
                  {categories.map(cat => (
                    <TableCell key={cat.id} className="text-center text-lg hidden sm:table-cell">{entry.scores[cat.id]}</TableCell>
                  ))}
                  <TableCell className="text-right font-bold text-primary text-xl">{entry.total}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </section>
    </div>
  );
}
