
"use client";

import React, { useState, useEffect } from 'react';
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

const REMARKS_STORAGE_KEY = 'competition-report-remarks';

export default function SettingsPage() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [remarks, setRemarks] = useState('');
  const { toast } = useToast();
  
  useEffect(() => {
    const savedRemarks = localStorage.getItem(REMARKS_STORAGE_KEY);
    if (savedRemarks) {
        setRemarks(savedRemarks);
    }
  }, []);

  const handleRemarksChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRemarks(e.target.value);
    localStorage.setItem(REMARKS_STORAGE_KEY, e.target.value);
  }

  const generatePdf = async () => {
    setIsGenerating(true);
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
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }) as jsPDFWithAutoTable;
        
        const primaryColor = '#2563eb'; // Rich Blue from your theme
        const accentColor = '#f97316'; // Golden Amber from your theme
        const date = format(new Date(), 'yyyy-MM-dd');
        const reportDate = format(new Date(), 'do MMMM yyyy');

        // --- Helper Functions ---
        const addHeaderFooter = () => {
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(primaryColor);
                doc.text('JLKS Paradip - Competition Report', 105, 15, { align: 'center' });

                doc.setFontSize(8);
                doc.setTextColor(100);
                doc.text(`Page ${i} of ${pageCount}`, 105, 287, { align: 'center' });
                doc.text(`Generated on: ${reportDate}`, 200, 287, { align: 'right' });
            }
        };

        // --- Title Page ---
        doc.rect(0, 0, 210, 297, 'F'); // Full page background - can be white or a light color
        doc.setFillColor(255, 255, 255);
        doc.setFontSize(32);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor);
        doc.text('Competition Score Report', 105, 80, { align: 'center' });

        doc.setFontSize(18);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(accentColor);
        doc.text(`Date: ${reportDate}`, 105, 100, { align: 'center' });

        if (remarks) {
            doc.setFontSize(14);
            doc.setTextColor(80,80,80);
            const remarksLines = doc.splitTextToSize(remarks, 160);
            doc.text(remarksLines, 105, 140, { align: 'center' });
        }
        
        // --- Score Sections ---
        const schoolCategories: SchoolCategory[] = ["Senior", "Junior"];
        
        schoolCategories.forEach(schoolCategory => {
            const schoolsInCategory = schools.filter(s => s.category === schoolCategory);
            if(schoolsInCategory.length === 0) return;

            doc.addPage();
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(primaryColor);
            doc.text(`${schoolCategory} Category Results`, 14, 20);

            // --- Summary Table ---
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(accentColor);
            doc.text('Final Rankings', 14, 35);
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
                ...data.totalScores.map(String),
                data.totalScore
              ]);

            doc.autoTable({
                startY: 40,
                head,
                body,
                theme: 'striped',
                headStyles: { fillColor: primaryColor, textColor: 255 },
                styles: { fontSize: 10 },
            });

            // --- Judge Breakdown Section ---
            doc.addPage();
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(accentColor);
            doc.text(`Judge Score Breakdown (${schoolCategory})`, 14, 20);

            let lastY = 25;
            schoolsInCategory.forEach(school => {
                const judgeHead = [['Judge', ...categories.map(c => c.name), 'Total']];
                const judgeBody = judges.map(judge => {
                    const judgeCategoryScores = categories.map(cat => {
                        return scores.find(s => s.schoolId === school.id && s.categoryId === cat.id && s.judgeId === judge.id)?.score || 0;
                    });
                    const judgeTotal = judgeCategoryScores.reduce((sum, score) => sum + score, 0);
                    return [
                        judge.name,
                        ...judgeCategoryScores.map(String),
                        judgeTotal
                    ]
                });
                
                doc.autoTable({
                    startY: lastY + 5,
                    head: judgeHead,
                    body: judgeBody,
                    theme: 'grid',
                    tableWidth: 'auto',
                    margin: { left: 14 },
                    headStyles: { fillColor: '#334155', textColor: 255 },
                    didParseCell: (data) => {
                        if (data.section === 'head') {
                            data.cell.styles.fontStyle = 'bold';
                        }
                    },
                    didDrawPage: (data) => {
                        doc.setFontSize(14);
                        doc.setFont('helvetica', 'bold');
                        doc.text(school.name, 14, data.cursor.y - judgeBody.length * 8 - 10);
                    }
                });
                lastY = (doc as any).lastAutoTable.finalY;
            });
        });
        
        // --- Sub-Junior Feedback Section ---
        const subJuniorSchools = schools.filter(s => s.category === 'Sub-Junior');
        if (subJuniorSchools.length > 0) {
            doc.addPage();
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(primaryColor);
            doc.text('Sub-Junior Category Feedback', 14, 20);
            
            let lastY = 25;
            subJuniorSchools.forEach(school => {
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(accentColor);
                doc.text(school.name, 14, lastY + 5);

                const feedbackBody = judges.map(judge => {
                    const feedback = feedbacks.find(f => f.schoolId === school.id && f.judgeId === judge.id)?.feedback || "N/A";
                    return [judge.name, feedback];
                });

                doc.autoTable({
                    startY: lastY + 10,
                    head: [['Judge', 'Feedback']],
                    body: feedbackBody,
                    theme: 'grid',
                    headStyles: { fillColor: primaryColor, textColor: 255 },
                    columnStyles: { 1: { cellWidth: 'auto' } }
                });
                lastY = (doc as any).lastAutoTable.finalY;
            })
        }
        
        // Remove the default blank page if it exists
        if (doc.internal.getNumberOfPages() > 1) {
            doc.deletePage(1);
        }

        addHeaderFooter();
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
        setIsGenerating(false);
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
      // Do not clear remarks
      // setRemarks('');

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
                        onChange={handleRemarksChange}
                    />
                </div>
                <Button onClick={generatePdf} disabled={isGenerating}>
                    {isGenerating ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Download className="mr-2 h-4 w-4" />
                    )}
                    {isGenerating ? "Generating..." : "Download Report PDF"}
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
                <Button variant="destructive" disabled={isDeleting}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    {isDeleting ? "Processing..." : "Start New Competition"}
                </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                    This action is irreversible. It will first generate and download the final PDF report, then permanently delete all schools, scores, and feedback.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleStartNewCompetition} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                        {isDeleting ? (<Loader2 className="mr-2 h-4 w-4 animate-spin"/>) : null}
                        {isDeleting ? "Processing..." : "Yes, Save Report and Delete"}
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
