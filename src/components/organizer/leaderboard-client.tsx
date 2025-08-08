"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/page-header';
import { initialSchools, initialCategories, initialScores, initialJudges } from '@/lib/data';
import type { School, CompetitionCategory, Score, SchoolCategory } from '@/lib/data';

type SchoolScore = {
  school: School;
  scores: { [categoryId: string]: number };
  total: number;
};

type CategorizedLeaderboard = {
  [key in SchoolCategory]?: SchoolScore[];
};

export default function LeaderboardClient() {
  const [schools] = useState(initialSchools);
  const [categories] = useState(initialCategories);
  const [scores] = useState(initialScores);
  const [judges] = useState(initialJudges);

  const schoolCategories: SchoolCategory[] = ["Senior", "Junior", "Sub-Junior"];

  const categorizedLeaderboardData = useMemo(() => {
    return schoolCategories.reduce((acc: CategorizedLeaderboard, category) => {
      const schoolsInCategory = schools.filter(school => school.category === category);
      
      if (schoolsInCategory.length > 0) {
        const schoolScores = schoolsInCategory.map(school => {
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

        acc[category] = schoolScores.sort((a, b) => b.total - a.total);
      }
      return acc;
    }, {});
  }, [schools, categories, scores, judges]);

  return (
    <div>
      <PageHeader title="Leaderboard" />
      
      <div className="space-y-12">
        {schoolCategories.map(category => {
          const leaderboardData = categorizedLeaderboardData[category];
          if (!leaderboardData || leaderboardData.length === 0) return null;

          return (
            <section key={category}>
              <h2 className="font-headline text-3xl md:text-4xl text-foreground/90 mb-6">{category} Category</h2>
              
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
          )
        })}
      </div>
    </div>
  );
}
