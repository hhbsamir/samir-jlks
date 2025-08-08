
"use client";

import React, { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { db } from '@/lib/firebase';
import { collection, getDocs, writeBatch } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Loader2, Download } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { School, CompetitionCategory, Score, Feedback, Judge, SchoolCategory } from '@/lib/data';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

// Extend jsPDF with autoTable
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDFWithAutoTable;
}

export default function SettingsPage() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [remarks, setRemarks] = useState('');
  const { toast } = useToast();

  const generatePdf = async () => {
    setIsDeleting(true);
    toast({ title: "Generating Report", description: "Please wait while the PDF is being created..." });

    try {
        // 1. Fetch all data
        const schoolsCollection = collection(db, 'schools');
        const schoolsSnapshot = await getDocs(schoolsCollection);
        const schools = schoolsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as School));

        const categoriesCollection = collection(db, 'categories');
        const categoriesSnapshot = await getDocs(categoriesCollection);
        const categories = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CompetitionCategory));

        const scoresCollection = collection(db, 'scores');
        const scoresSnapshot = await getDocs(scoresCollection);
        const scores = scoresSnapshot.docs.map(doc => doc.data() as Score);

        const feedbacksCollection = collection(db, 'feedbacks');
        const feedbacksSnapshot = await getDocs(feedbacksCollection);
        const feedbacks = feedbacksSnapshot.docs.map(doc => doc.data() as Feedback);

        const judgesCollection = collection(db, 'judges');
        const judgesSnapshot = await getDocs(judgesCollection);
        const judges = judgesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Judge));

        // 2. Initialize PDF
        const doc = new jsPDF({ orientation: 'landscape' }) as jsPDFWithAutoTable;
        const addHeaderFooter = () => {
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                // Header
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text('Competition Score Report', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                if (remarks) {
                    doc.text(`Remarks: ${remarks}`, doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });
                }

                // Footer
                doc.setFontSize(8);
                doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
                doc.text(`Generated on: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}`, doc.internal.pageSize.getWidth() - 15, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
            }
        };

        const schoolCategories: SchoolCategory[] = ["Senior", "Junior"];
        
        schoolCategories.forEach(schoolCategory => {
            const schoolsInCategory = schools.filter(s => s.category === schoolCategory);
            if(schoolsInCategory.length === 0) return;

            doc.addPage();
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(`${schoolCategory} Category Scores`, 14, 30);

            const head = [['Rank', 'School', ...categories.map(c => c.name), 'Total Score']];
            const body = schoolsInCategory
              .map(school => {
                const totalScores = categories.map(cat => {
                    return scores.filter(s => s.schoolId === school.id && s.categoryId === cat.id)
                                 .reduce((sum, s) => sum + s.score, 0);
                });
                const totalScore = totalScores.reduce((sum, score) => sum + score, 0);
                return { school, totalScores, totalScore };
              })
              .sort((a,b) => b.totalScore - a.totalScore)
              .map((data, index) => [
                index + 1,
                data.school.name,
                ...data.totalScores,
                data.totalScore
              ]);

            doc.autoTable({
                startY: 35,
                head,
                body,
                theme: 'striped',
                headStyles: { fillColor: [35, 92, 55] },
            });

            schoolsInCategory.forEach(school => {
                doc.addPage();
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text(`Score Breakdown for: ${school.name}`, 14, 30);
                
                const judgeHead = [['Judge', ...categories.map(c => c.name), 'Total']];
                const judgeBody = judges.map(judge => {
                    const judgeCategoryScores = categories.map(cat => {
                        return scores.find(s => s.schoolId === school.id && s.categoryId === cat.id && s.judgeId === judge.id)?.score || 0;
                    });
                    const judgeTotal = judgeCategoryScores.reduce((sum, score) => sum + score, 0);
                    return [
                        judge.name,
                        ...judgeCategoryScores,
                        judgeTotal
                    ]
                });

                doc.autoTable({
                    startY: 35,
                    head: judgeHead,
                    body: judgeBody,
                    theme: 'grid'
                });
            });
        });
        
        // Handle Sub-Junior Feedback
        const subJuniorSchools = schools.filter(s => s.category === 'Sub-Junior');
        if (subJuniorSchools.length > 0) {
            doc.addPage();
            doc.setFontSize(14);
            doc.text('Sub-Junior Category Feedback', 14, 30);
            
            const feedbackHead = [['School', 'Judge', 'Feedback']];
            const feedbackBody = [];
            for(const school of subJuniorSchools) {
                for(const judge of judges) {
                    const feedback = feedbacks.find(f => f.schoolId === school.id && f.judgeId === judge.id)?.feedback || "N/A";
                    feedbackBody.push([school.name, judge.name, feedback]);
                }
            }

            doc.autoTable({
                startY: 35,
                head: feedbackHead,
                body: feedbackBody,
                theme: 'striped',
                headStyles: { fillColor: [35, 92, 55] },
            });
        }
        
        // Remove the default blank page
        doc.deletePage(1);

        addHeaderFooter();
        const date = format(new Date(), 'yyyy-MM-dd');
        doc.save(`Competition-Report-${date}.pdf`);

        toast({
          title: "Report Generated",
          description: "Your PDF report has been downloaded.",
        });

        return true; // PDF generation successful
    } catch(error) {
        console.error("Error generating PDF:", error);
        toast({
            title: "PDF Generation Failed",
            description: "There was an error creating the report.",
            variant: "destructive"
        });
        return false; // PDF generation failed
    } finally {
        setIsDeleting(false);
    }
  };

  const handleStartNewCompetition = async () => {
    setIsDeleting(true);
    const pdfGenerated = await generatePdf();

    if (!pdfGenerated) {
        setIsDeleting(false);
        return; // Stop if PDF generation failed
    }

    try {
      const batch = writeBatch(db);

      const collectionsToDelete = ['schools', 'scores', 'feedbacks'];

      for (const collectionName of collectionsToDelete) {
        const collectionRef = collection(db, collectionName);
        const snapshot = await getDocs(collectionRef);
        snapshot.forEach(doc => {
          batch.delete(doc.ref);
        });
      }
      
      await batch.commit();

      toast({
        title: "New Competition Started!",
        description: "All schools, scores, and feedback have been successfully deleted.",
      });
      setRemarks('');

    } catch (error) {
      console.error("Error starting new competition:", error);
      toast({
        title: "Error",
        description: "There was a problem resetting the competition data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <PageHeader title="Settings" />
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
            <CardHeader>
            <CardTitle>Generate Final Report</CardTitle>
            <CardDescription>
                Download a complete PDF report of the competition including all scores and feedback. 
                Enter any final remarks below to include them in the report header.
            </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="remarks">Remarks for Report</Label>
                    <Textarea 
                        id="remarks"
                        placeholder="e.g., Final results for the annual 2024 competition."
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                    />
                </div>
                <Button onClick={generatePdf} disabled={isDeleting}>
                    {isDeleting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="mr-2 h-4 w-4" />
                    )}
                    {isDeleting ? "Generating..." : "Download Report PDF"}
                </Button>
            </CardContent>
        </Card>
        <Card className="border-destructive">
            <CardHeader>
            <CardTitle className="text-destructive">Reset Competition Data</CardTitle>
            <CardDescription>
                This will permanently delete all existing schools, scores, and feedback. 
                Judges and Categories will not be affected. This action cannot be undone.
                It is highly recommended to download the final report before proceeding.
            </CardDescription>
            </CardHeader>
            <CardContent>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Start New Competition
                </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                    This action is irreversible. It will permanently delete all schools, scores, and feedback.
                    Have you saved the final PDF report?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleStartNewCompetition} className="bg-destructive hover:bg-destructive/90">
                        {isDeleting ? (<Loader2 className="mr-2 h-4 w-4 animate-spin"/>) : null}
                        {isDeleting ? "Processing..." : "Yes, Delete Everything"}
                    </AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            </CardContent>
        </Card>
      </div>
    </>
  );
}
