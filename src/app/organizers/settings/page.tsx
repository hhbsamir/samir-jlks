
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
  const [generatingReportType, setGeneratingReportType] = useState<'full' | 'summary' | null>(null);
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

  const generatePdf = async (reportType: 'full' | 'summary') => {
    setGeneratingReportType(reportType);
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
        
        const primaryColor = '#2563eb';
        const accentColor = '#f97316';
        const date = format(new Date(), 'yyyy-MM-dd');
        const reportDate = format(new Date(), 'do MMMM yyyy');
        const pageMargin = 14;

        // --- Helper Functions ---
        const addHeaderAndFooter = () => {
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                
                // Header
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(primaryColor);
                doc.text(`JLKS Paradip - Competition ${reportType === 'full' ? 'Full' : 'Summary'} Report`, 105, 15, { align: 'center' });
                
                if (remarks) {
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'italic');
                    doc.setTextColor(80, 80, 80);
                    const remarksLines = doc.splitTextToSize(remarks, 180);
                    doc.text(remarksLines, 105, 22, { align: 'center' });
                }

                // Footer
                doc.setFontSize(8);
                doc.setTextColor(100);
                doc.text(`Page ${i} of ${pageCount}`, 105, 287, { align: 'center' });
                doc.text(`Generated on: ${reportDate}`, 210 - pageMargin, 287, { align: 'right' });
            }
        };

        // --- Title Page ---
        doc.setFontSize(36);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor);
        doc.text(`Competition ${reportType === 'summary' ? 'Summary' : 'Score'} Report`, 105, 120, { align: 'center' });

        doc.setFontSize(20);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(accentColor);
        doc.text(`Date: ${reportDate}`, 105, 140, { align: 'center' });

        if (remarks) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(80, 80, 80);
            const remarksLines = doc.splitTextToSize(remarks, 180);
            doc.text(remarksLines, 105, 160, { align: 'center' });
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
            doc.text(`${schoolCategory} Category Results`, pageMargin, 30);

            // --- Summary Table ---
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(accentColor);
            doc.text('Final Rankings', pageMargin, 42);
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
                startY: 45,
                head,
                body,
                theme: 'striped',
                headStyles: { fillColor: primaryColor, textColor: 255 },
                styles: { fontSize: 10, cellPadding: 2 },
                margin: { left: pageMargin, right: pageMargin },
                columnStyles: {
                    1: { cellWidth: 'auto' }, // School name column
                }
            });

            // --- Judge Breakdown Section (Full Report Only) ---
            if (reportType === 'full') {
                let lastY = (doc as any).lastAutoTable.finalY || 45;
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(accentColor);
                doc.text(`Judge Score Breakdown`, pageMargin, lastY + 15);
                lastY += 20;

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

                    if (lastY + (judgeBody.length + 2) * 8 > 280) { // Estimate table height
                        doc.addPage();
                        lastY = 30;
                    }

                    doc.setFontSize(12);
                    doc.setFont('helvetica', 'bold');
                    doc.text(school.name, pageMargin, lastY);
                    
                    doc.autoTable({
                        startY: lastY + 3,
                        head: judgeHead,
                        body: judgeBody,
                        theme: 'grid',
                        headStyles: { fillColor: '#475569', textColor: 255, fontSize: 9 },
                        styles: { fontSize: 9, cellPadding: 2 },
                        margin: { left: pageMargin, right: pageMargin },
                        columnStyles: {
                            0: { cellWidth: 'auto' }, // Judge name column
                        }
                    });
                    lastY = (doc as any).lastAutoTable.finalY + 10;
                });
            }
        });
        
        // --- Theme Prize Section ---
        const themeCategory = categories.find(c => c.name.toLowerCase() === 'theme');
        if (themeCategory) {
            doc.addPage();
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(primaryColor);
            doc.text('Theme Category Prizes', pageMargin, 30);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100);
            doc.text('Top 3 schools based on Theme score, excluding overall top 3 winners.', pageMargin, 36);
            
            let lastY = 45;

            schoolCategories.forEach(schoolCategory => {
                const schoolsInCategory = schools.filter(s => s.category === schoolCategory);
                if (schoolsInCategory.length === 0) return;

                const rankedSchools = schoolsInCategory.map(school => {
                     const totalScore = categories.reduce((total, cat) => {
                        return total + scores
                            .filter(s => s.schoolId === school.id && s.categoryId === cat.id)
                            .reduce((sum, s) => sum + s.score, 0);
                    }, 0);
                    return { school, totalScore };
                }).sort((a, b) => b.totalScore - a.totalScore);
                
                const top3OverallIds = rankedSchools.slice(0, 3).map(entry => entry.school.id);

                const contenders = schoolsInCategory
                    .filter(school => !top3OverallIds.includes(school.id))
                    .map(school => {
                        const themeScore = scores
                            .filter(s => s.schoolId === school.id && s.categoryId === themeCategory.id)
                            .reduce((sum, s) => sum + s.score, 0);
                        return { school, themeScore };
                    })
                    .sort((a, b) => b.themeScore - a.themeScore)
                    .slice(0, 3);
                
                if (contenders.length > 0) {
                    doc.setFontSize(16);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(accentColor);
                    doc.text(`${schoolCategory} Winners`, pageMargin, lastY);

                    const head = [['Rank', 'School', 'Theme Score']];
                    const body = contenders.map((winner, index) => [
                        index + 1,
                        winner.school.name,
                        winner.themeScore,
                    ]);

                    doc.autoTable({
                        startY: lastY + 3,
                        head,
                        body,
                        theme: 'striped',
                        headStyles: { fillColor: '#8b5cf6', textColor: 255 },
                        styles: { fontSize: 10, cellPadding: 2.5 },
                        margin: { left: pageMargin, right: pageMargin },
                        columnStyles: {
                            1: { cellWidth: 'auto' }, // School name column
                        }
                    });
                    lastY = (doc as any).lastAutoTable.finalY + 15;
                }
            });
        }
        
        // --- Sub-Junior Feedback Section (Full Report Only) ---
        if (reportType === 'full') {
            const subJuniorSchools = schools.filter(s => s.category === 'Sub-Junior');
            if (subJuniorSchools.length > 0) {
                doc.addPage();
                doc.setFontSize(22);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(primaryColor);
                doc.text('Sub-Junior Category Feedback', pageMargin, 30);
                
                let lastY = 35;
                subJuniorSchools.forEach(school => {
                    const feedbackBody = judges.map(judge => {
                        const feedback = feedbacks.find(f => f.schoolId === school.id && f.judgeId === judge.id)?.feedback || "N/A";
                        return [judge.name, feedback];
                    });

                    const tableHeight = (feedbackBody.length + 1) * 10 + 10; // Approximate height
                    if (lastY + tableHeight > 280) {
                        doc.addPage();
                        lastY = 30;
                    }
                    
                    doc.setFontSize(14);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(accentColor);
                    doc.text(school.name, pageMargin, lastY + 5);

                    doc.autoTable({
                        startY: lastY + 8,
                        head: [['Judge', 'Feedback']],
                        body: feedbackBody,
                        theme: 'grid',
                        headStyles: { fillColor: primaryColor, textColor: 255 },
                        columnStyles: { 
                            0: { cellWidth: 'auto' },
                            1: { cellWidth: 'auto' } 
                        },
                        margin: { left: pageMargin, right: pageMargin }
                    });
                    lastY = (doc as any).lastAutoTable.finalY + 10;
                })
            }
        }
        
        addHeaderAndFooter();
        doc.save(`Competition-Report-${reportType === 'summary' ? 'Summary-': ''}${date}.pdf`);

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
        setGeneratingReportType(null);
    }
  };

  const handleStartNewCompetition = async () => {
    setIsDeleting(true);
    const pdfGenerated = await generatePdf('full');

    if (!pdfGenerated) {
        toast({
            title: "Action Stopped",
            description: "Competition data was not cleared because the report failed to generate.",
            variant: "destructive"
        });
        setIsDeleting(false);
        return;
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
                Enter any final remarks below to include them on every page of the report.
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
                <div className="flex flex-wrap gap-2">
                    <Button onClick={() => generatePdf('full')} disabled={!!generatingReportType}>
                        {generatingReportType === 'full' ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Download className="mr-2 h-4 w-4" />
                        )}
                        {generatingReportType === 'full' ? "Generating..." : "Download Full Report"}
                    </Button>
                    <Button onClick={() => generatePdf('summary')} disabled={!!generatingReportType} variant="outline">
                        {generatingReportType === 'summary' ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Download className="mr-2 h-4 w-4" />
                        )}
                        {generatingReportType === 'summary' ? "Generating..." : "Download Summary Report"}
                    </Button>
                </div>
            </CardContent>
        </Card>
        <Card className="border-destructive">
            <CardHeader>
            <CardTitle className="text-destructive">Reset Competition Data</CardTitle>
            <CardDescription>
                This will permanently delete all existing schools, scores, and feedback. 
                Judges and Categories will not be affected. It is highly recommended to download the final report before proceeding.
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

    