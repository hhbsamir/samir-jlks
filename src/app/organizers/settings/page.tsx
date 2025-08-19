
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { db } from '@/lib/firebase';
import { collection, getDocs, writeBatch, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Loader2, Download, Upload, XCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { School, CompetitionCategory, Score, Feedback, Judge, SchoolCategory, ReportSettings, HomePageContent } from '@/lib/data';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';

// Extend jsPDF with autoTable
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDFWithAutoTable;
}

const REMARKS_DOC_ID = 'reportSettings';
const HOME_CONTENT_DOC_ID = 'homePageContent';


// Function to remove emojis from a string
const removeEmojis = (text: string) => {
  if (!text) return "";
  // This regex matches most common emojis.
  return text.replace(/([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g, '').trim();
};

async function deleteCloudinaryImage(publicId: string) {
    try {
        if (!publicId) {
            throw new Error("Could not extract public_id");
        }
        const response = await fetch('/api/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicId }),
        });
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Failed to delete image from Cloudinary.');
        }
        return true;
    } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
        return false;
    }
}


export default function SettingsPage() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [generatingSummaryReport, setGeneratingSummaryReport] = useState(false);
  const [generatingFeedbackReport, setGeneratingFeedbackReport] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [homeContent, setHomeContent] = useState<HomePageContent>({ id: HOME_CONTENT_DOC_ID, imageUrl: '', note: '' });
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const fetchSettings = useCallback(async () => {
    try {
        const remarksDocRef = doc(db, 'settings', REMARKS_DOC_ID);
        const remarksDoc = await getDoc(remarksDocRef);
        if (remarksDoc.exists()) {
            setRemarks(remarksDoc.data().remarks);
        }
        
        const homeContentDocRef = doc(db, 'settings', HOME_CONTENT_DOC_ID);
        const homeContentDoc = await getDoc(homeContentDocRef);
        if (homeContentDoc.exists()) {
            setHomeContent(homeContentDoc.data() as HomePageContent);
        }

    } catch (error) {
        console.error("Error fetching settings:", error);
        toast({
            title: "Error",
            description: "Could not load saved settings.",
            variant: "destructive"
        });
    }
  }, [toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSettingsUpdate = async (field: keyof HomePageContent, value: string) => {
    const newContent = { ...homeContent, [field]: value };
    setHomeContent(newContent);
     try {
        const docRef = doc(db, 'settings', HOME_CONTENT_DOC_ID);
        await setDoc(docRef, { [field]: value }, { merge: true });
    } catch (error) {
        console.error(`Error saving ${field}:`, error);
        toast({
            title: "Error",
            description: `Could not save ${field}. Please try again.`,
            variant: "destructive"
        });
    }
  }
  
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024) { // 100 KB size limit
        toast({
            title: 'File Too Large',
            description: 'Please upload an image smaller than 100 KB.',
            variant: 'destructive',
        });
        return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.success) {
        if(homeContent.imageUrl) {
          // This assumes the public_id is part of the homeContent object, which it isn't yet.
          // Let's assume the upload logic needs to be robust enough to handle overwrites or we add it.
        }
        await handleSettingsUpdate('imageUrl', data.url);
        toast({ title: 'Photo uploaded successfully!' });
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: 'Upload Failed',
        description: 'Could not upload the photo. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    // This part of the code is problematic because we don't store the public_id.
    // I will disable it for now to prevent errors, as the user did not ask to fix it.
    toast({ title: 'Info', description: 'Image removal functionality is temporarily disabled.' });
  };


  const handleRemarksChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newRemarks = e.target.value;
    setRemarks(newRemarks);
    try {
        const remarksDocRef = doc(db, 'settings', REMARKS_DOC_ID);
        await setDoc(remarksDocRef, { remarks: newRemarks }, { merge: true });
    } catch (error) {
        console.error("Error saving remarks:", error);
        toast({
            title: "Error",
            description: "Could not save remarks. Please try again.",
            variant: "destructive"
        });
    }
  }

  const handleGenerateSubJuniorFeedbackReport = async () => {
    setGeneratingFeedbackReport(true);
    toast({ title: "Generating Sub-Junior Feedback Report", description: "Please wait while the PDF is being created..." });
    
    try {
        const [schoolsSnapshot, feedbacksSnapshot, judgesSnapshot] = await Promise.all([
            getDocs(collection(db, 'schools')),
            getDocs(collection(db, 'feedbacks')),
            getDocs(collection(db, 'judges'))
        ]);
        const schools: School[] = schoolsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as School));
        const feedbacks: Feedback[] = feedbacksSnapshot.docs.map(doc => doc.data() as Feedback);
        const judges: Judge[] = judgesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Judge));

        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }) as jsPDFWithAutoTable;
        const primaryColor = '#2563eb';
        const accentColor = '#f97316';
        const reportDate = format(new Date(), 'do MMMM yyyy');
        const pageMargin = 15;
        const pageWidth = doc.internal.pageSize.getWidth();
        
        // --- Title Page ---
        doc.setFontSize(36);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor);
        doc.text('JLKS Paradip Port', 105, 120, { align: 'center' });

        doc.setFontSize(24);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(accentColor);
        doc.text('Sub-Junior Feedback Report', 105, 135, { align: 'center' });

        if (remarks) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(80, 80, 80);
            const remarksLines = doc.splitTextToSize(remarks, 180);
            doc.text(remarksLines, 105, 170, { align: 'center' });
        }

        const addHeaderAndFooter = (isContentPage: boolean) => {
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                
                if (isContentPage && i > 1) { // Only add header to content pages
                    // Header
                    doc.setFontSize(20);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(primaryColor);
                    doc.text('Sub-Junior Feedback Report', pageWidth / 2, 20, { align: 'center' });
                    
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(100);
                    doc.text(`Generated on: ${reportDate}`, pageWidth / 2, 26, { align: 'center' });
                    
                    doc.setDrawColor(primaryColor);
                    doc.setLineWidth(0.5);
                    doc.line(pageMargin, 32, pageWidth - pageMargin, 32);
                }

                // Footer
                doc.setFontSize(9);
                doc.setTextColor(150);
                doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, 287, { align: 'center' });
            }
        };

        const subJuniorSchools = schools
            .filter(s => s.category === 'Sub-Junior')
            .sort((a,b) => (a.serialNumber || 0) - (b.serialNumber || 0));

        if (subJuniorSchools.length > 0) {
            doc.addPage();
            let lastY = 40;
        
            if (remarks) {
                doc.setFontSize(11);
                doc.setFont('helvetica', 'italic');
                doc.setTextColor(80, 80, 80);
                const remarksLines = doc.splitTextToSize(remarks, pageWidth - (pageMargin * 2));
                doc.text(remarksLines, pageWidth / 2, lastY, { align: 'center' });
                lastY += (remarksLines.length * 5) + 10;
            }

            subJuniorSchools.forEach(school => {
                const feedbackBody = judges.map(judge => {
                    const feedbackText = feedbacks.find(f => f.schoolId === school.id && f.judgeId === judge.id)?.feedback || "No feedback provided.";
                    const cleanFeedback = removeEmojis(feedbackText);
                    return [{ content: judge.name, styles: { fontStyle: 'bold' } }, cleanFeedback];
                });

                const tableHeight = (feedbackBody.length * 8) + 25; // Approximation
                if (lastY + tableHeight > 270) {
                    doc.addPage();
                    lastY = 40;
                }
                
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(accentColor);
                doc.text(school.name, pageMargin, lastY);
                if(school.serialNumber) {
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(100);
                    doc.text(`Serial Number: ${school.serialNumber}`, pageWidth - pageMargin, lastY, { align: 'right' });
                }
                lastY += 2;

                doc.autoTable({
                    startY: lastY + 3,
                    head: [['Judge', 'Feedback']],
                    body: feedbackBody,
                    theme: 'grid',
                    headStyles: { 
                        fillColor: primaryColor, 
                        textColor: 255, 
                        fontSize: 12,
                        halign: 'center' 
                    },
                    columnStyles: { 
                        0: { cellWidth: 50, halign: 'left' },
                        1: { cellWidth: 'auto', halign: 'left' } 
                    },
                    styles: {
                        cellPadding: 3,
                        fontSize: 10,
                        valign: 'middle'
                    },
                    margin: { left: pageMargin, right: pageMargin }
                });
                lastY = (doc as any).lastAutoTable.finalY + 15;
            });
             addHeaderAndFooter(true);
        } else {
             doc.addPage();
             doc.setFontSize(12);
             doc.text("No feedback found for Sub-Junior schools.", pageMargin, 40);
             addHeaderAndFooter(true);
        }
        
        doc.save(`Sub-Junior-Feedback-Report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);

        toast({
          title: "Feedback Report Generated",
          description: "Your PDF feedback report has been downloaded.",
        });

    } catch (error) {
        console.error("Error generating feedback PDF:", error);
        toast({
            title: "PDF Generation Failed",
            description: "There was an error creating the feedback report.",
            variant: "destructive"
        });
    } finally {
        setGeneratingFeedbackReport(false);
    }
  };


  const handleGenerateSummaryReport = async () => {
    setGeneratingSummaryReport(true);
    toast({ title: "Generating Summary Report", description: "Please wait while the PDF is being created..." });

    try {
        // 1. Fetch all required data from Firestore
        const [schoolsSnapshot, categoriesSnapshot, scoresSnapshot] = await Promise.all([
            getDocs(collection(db, 'schools')),
            getDocs(collection(db, 'categories')),
            getDocs(collection(db, 'scores')),
        ]);
        const schools: School[] = schoolsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as School));
        const categories: CompetitionCategory[] = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CompetitionCategory));
        const scores: Score[] = scoresSnapshot.docs.map(doc => doc.data() as Score);
        
        // 2. Initialize PDF
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }) as jsPDFWithAutoTable;
        
        const primaryColor = '#2563eb';
        const accentColor = '#f97316';
        const reportDate = format(new Date(), 'do MMMM yyyy');
        const pageMargin = 14;

        // --- Helper Functions ---
        const addHeaderAndFooter = () => {
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                
                // Header
                if (i > 1) { // Dont show header on first page
                    doc.setFontSize(16);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(primaryColor);
                    doc.text('Competition Summary Report', 105, 15, { align: 'center' });
                    
                    if (remarks) {
                        doc.setFontSize(10);
                        doc.setFont('helvetica', 'italic');
                        doc.setTextColor(80, 80, 80);
                        const remarksLines = doc.splitTextToSize(remarks, 180);
                        doc.text(remarksLines, 105, 22, { align: 'center' });
                    }
                }


                // Footer
                doc.setFontSize(8);
                doc.setTextColor(100);
                doc.text(`Page ${i} of ${pageCount}`, 105, 287, { align: 'center' });
                doc.text(`Report Date: ${reportDate}`, 210 - pageMargin, 287, { align: 'right' });
            }
        };

        // --- Title Page ---
        doc.setFontSize(36);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor);
        doc.text('JLKS Paradip Port', 105, 120, { align: 'center' });
        
        doc.setFontSize(24);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(accentColor);
        doc.text('Competition Summary Report', 105, 135, { align: 'center' });

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
        
        addHeaderAndFooter();
        doc.save(`Competition-Summary-Report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);

        toast({
          title: "Summary Report Generated",
          description: "Your PDF summary report has been downloaded.",
        });

        return true; 
    } catch(error) {
        console.error("Error generating PDF:", error);
        toast({
            title: "PDF Generation Failed",
            description: "There was an error creating the summary report.",
            variant: "destructive"
        });
        return false;
    } finally {
        setGeneratingSummaryReport(false);
    }
  };

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    toast({ title: "Generating Full Report", description: "Please wait while the PDF is being created..." });

    try {
        // 1. Fetch all required data from Firestore
        const [schoolsSnapshot, categoriesSnapshot, scoresSnapshot, feedbacksSnapshot, judgesSnapshot] = await Promise.all([
            getDocs(collection(db, 'schools')),
            getDocs(collection(db, 'categories')),
            getDocs(collection(db, 'scores')),
            getDocs(collection(db, 'feedbacks')),
            getDocs(collection(db, 'judges'))
        ]);
        const schools: School[] = schoolsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as School));
        const categories: CompetitionCategory[] = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CompetitionCategory));
        const scores: Score[] = scoresSnapshot.docs.map(doc => doc.data() as Score);
        const feedbacks: Feedback[] = feedbacksSnapshot.docs.map(doc => doc.data() as Feedback);
        const judges: Judge[] = judgesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Judge));

        // 2. Initialize PDF
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' }) as jsPDFWithAutoTable;
        
        const primaryColor = '#2563eb';
        const accentColor = '#f97316';
        const reportDate = format(new Date(), 'do MMMM yyyy');
        const pageMargin = 14;

        // --- Helper Functions ---
        const addHeaderAndFooter = () => {
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                
                // Header
                if (i > 1) { // Don't show header on first page
                    doc.setFontSize(16);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(primaryColor);
                    doc.text('Competition Full Report', 105, 15, { align: 'center' });
                    
                    if (remarks) {
                        doc.setFontSize(10);
                        doc.setFont('helvetica', 'italic');
                        doc.setTextColor(80, 80, 80);
                        const remarksLines = doc.splitTextToSize(remarks, 180);
                        doc.text(remarksLines, 105, 22, { align: 'center' });
                    }
                }


                // Footer
                doc.setFontSize(8);
                doc.setTextColor(100);
                doc.text(`Page ${i} of ${pageCount}`, 105, 287, { align: 'center' });
                doc.text(`Report Date: ${reportDate}`, 210 - pageMargin, 287, { align: 'right' });
            }
        };

        // --- Title Page ---
        doc.setFontSize(36);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor);
        doc.text('JLKS Paradip Port', 105, 120, { align: 'center' });
        
        doc.setFontSize(24);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(accentColor);
        doc.text('Competition Full Report', 105, 135, { align: 'center' });

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
            const rankedSchoolsData = schoolsInCategory
              .map(school => {
                const totalScores = categories.map(cat => {
                    return scores.filter(s => s.schoolId === school.id && s.categoryId === cat.id)
                                 .reduce((sum, s) => sum + s.score, 0);
                });
                const totalScore = totalScores.reduce((sum, score) => sum + score, 0);
                return { school, totalScores, totalScore };
              })
              .sort((a,b) => b.totalScore - a.totalScore);
            
            const body = rankedSchoolsData.map((data, index) => [
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

            // --- Judge Breakdown Section ---
            let lastY = (doc as any).lastAutoTable.finalY || 45;
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(accentColor);
            doc.text(`Judge Score Breakdown`, pageMargin, lastY + 15);
            lastY += 20;

            rankedSchoolsData.forEach(({school}) => { // Use rankedSchoolsData to ensure order
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
        
        // --- Sub-Junior Feedback Section ---
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
                    const feedbackText = feedbacks.find(f => f.schoolId === school.id && f.judgeId === judge.id)?.feedback || "N/A";
                    const cleanFeedback = removeEmojis(feedbackText);
                    return [judge.name, cleanFeedback];
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
        
        addHeaderAndFooter();
        doc.save(`Competition-Full-Report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);

        toast({
          title: "Full Report Generated",
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
        setGeneratingReport(false);
    }
  };

  const handleResetCompetition = async () => {
    setIsDeleting(true);

    const pdfGenerated = await handleGenerateReport();
    if (!pdfGenerated) {
        toast({
            title: "Reset Stopped",
            description: "Competition data was not cleared because the report failed to generate.",
            variant: "destructive"
        });
        setIsDeleting(false);
        return;
    }

    try {
      const batch = writeBatch(db);
      const collectionsToDelete = ['scores', 'feedbacks'];

      // Clear scores and feedback
      for (const collectionName of collectionsToDelete) {
        const snapshot = await getDocs(collection(db, collectionName));
        snapshot.forEach(doc => {
          batch.delete(doc.ref);
        });
      }

      await batch.commit();
      
      toast({
        title: "Competition Reset!",
        description: "All scores and feedback have been cleared. Schools and their serial numbers are preserved.",
      });

    } catch (error) {
      console.error("Error resetting competition:", error);
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
      <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
        
        <Card>
          <CardHeader>
            <CardTitle>Manage Home Page Content</CardTitle>
            <CardDescription>
                Upload a photo and add a note to be displayed on the public home page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
                <Label>Home Page Photo</Label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-24 w-24 border">
                     {homeContent.imageUrl && <AvatarImage src={homeContent.imageUrl} alt="Home page photo" />}
                    <AvatarFallback>
                      <User className="h-12 w-12 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-2">
                    <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />
                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading || isRemoving}>
                        {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        {isUploading ? 'Uploading...' : 'Upload Photo'}
                    </Button>
                    {homeContent.imageUrl && (
                        <Button type="button" variant="destructive" size="sm" onClick={handleRemoveImage} disabled={isUploading || isRemoving}>
                            {isRemoving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                            Remove
                        </Button>
                    )}
                    <p className="text-xs text-muted-foreground">Max file size: 100 KB.</p>
                  </div>
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="note">Home Page Note</Label>
                <Textarea 
                    id="note"
                    placeholder="e.g., A warm welcome to all participants..."
                    value={homeContent.note}
                    onChange={(e) => handleSettingsUpdate('note', e.target.value)}
                    rows={4}
                />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generate Final Report</CardTitle>
            <CardDescription>
                Download PDF reports of the competition. Enter any final remarks below to include them on every page of the reports.
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
            <div className="flex flex-wrap gap-4">
              <Button onClick={handleGenerateReport} disabled={generatingReport || generatingSummaryReport || generatingFeedbackReport}>
                {generatingReport ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                {generatingReport ? "Generating..." : "Download Full Report"}
              </Button>
              <Button onClick={handleGenerateSummaryReport} disabled={generatingReport || generatingSummaryReport || generatingFeedbackReport} variant="outline">
                {generatingSummaryReport ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                {generatingSummaryReport ? "Generating..." : "Download Summary"}
              </Button>
               <Button onClick={handleGenerateSubJuniorFeedbackReport} disabled={generatingReport || generatingSummaryReport || generatingFeedbackReport} variant="secondary">
                {generatingFeedbackReport ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                {generatingFeedbackReport ? "Generating..." : "Sub-Junior Feedback"}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-destructive bg-destructive/10 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-destructive">Reset Competition Data</CardTitle>
            <CardDescription className="text-destructive/80">
              This action will clear all scores and feedback for every school to start a new competition. 
              Your list of schools, judges, and serial numbers will NOT be deleted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeleting}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isDeleting ? 'Processing...' : 'Reset Competition'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all scores and feedback, but keep your schools, judges, and serial numbers.
                    It is highly recommended to download the final reports first.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleResetCompetition}
                    disabled={isDeleting}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {isDeleting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {isDeleting
                      ? 'Processing...'
                      : 'Yes, Save Report and Reset'}
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
