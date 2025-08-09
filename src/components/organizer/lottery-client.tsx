
"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import type { School, SchoolCategory } from '@/lib/data';
import { Dices, Save, ArrowRight, Download } from 'lucide-react';
import { db } from '@/lib/firebase';
import { writeBatch, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

// Extend jsPDF with autoTable
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDFWithAutoTable;
}


const schoolCategoryOrder: SchoolCategory[] = ["Sub-Junior", "Junior", "Senior"];

// Durstenfeld shuffle algorithm
const shuffleArray = <T extends any[]>(array: T): T => {
    const newArray = [...array] as T;
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

export default function LotteryClient({ initialSchools }: { initialSchools: School[] }) {
    const [schools, setSchools] = useState<School[]>(initialSchools);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    const categorizedSchools = useMemo(() => {
        return schoolCategoryOrder.reduce((acc, category) => {
            const categorySchools = schools
                .filter(school => school.category === category)
                .sort((a, b) => (a.serialNumber ?? Infinity) - (b.serialNumber ?? Infinity));
            if (categorySchools.length > 0) {
                acc[category] = categorySchools;
            }
            return acc;
        }, {} as Record<SchoolCategory, School[]>);
    }, [schools]);

    const runLotteryForCategory = useCallback((category: SchoolCategory) => {
        setSchools(currentSchools => {
            const otherCategorySchools = currentSchools.filter(s => s.category !== category);
            const schoolsToShuffle = currentSchools.filter(s => s.category === category);
            const shuffled = shuffleArray(schoolsToShuffle);
            const updatedSchools = shuffled.map((school, index) => ({
                ...school,
                serialNumber: index + 1
            }));
            return [...otherCategorySchools, ...updatedSchools];
        });
        toast({
            title: `Lottery Run for ${category}`,
            description: "New performance order has been generated. Review and save the changes."
        });
    }, [toast]);

    const handleSaveOrder = async () => {
        setIsSaving(true);
        try {
            const batch = writeBatch(db);
            schools.forEach(school => {
                if (school.serialNumber) {
                    const schoolRef = doc(db, 'schools', school.id);
                    batch.update(schoolRef, { serialNumber: school.serialNumber });
                }
            });
            await batch.commit();
            toast({
                title: "Save Successful",
                description: "The new performance order has been saved.",
            });
            router.refresh();
        } catch (error) {
            console.error("Error saving school order: ", error);
            toast({
                title: "Save Failed",
                description: "There was a problem saving the new order.",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDownloadOrder = () => {
        try {
            const doc = new jsPDF() as jsPDFWithAutoTable;
            const pageMargin = 15;
            const primaryColor = '#16a34a'; // Green
            const accentColor = '#6366f1'; // Indigo

            schoolCategoryOrder.forEach((category, index) => {
                const schoolsInCategory = categorizedSchools[category];
                if (schoolsInCategory && schoolsInCategory.length > 0) {
                    
                    if (index > 0) {
                        doc.addPage();
                    }

                    // Title
                    doc.setFontSize(24);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(primaryColor);
                    doc.text('Performance Order Lottery', 105, 20, { align: 'center' });

                    // Date
                    const reportDate = format(new Date(), 'do MMMM yyyy');
                    doc.setFontSize(12);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(100);
                    doc.text(`Generated on: ${reportDate}`, 105, 28, { align: 'center' });

                    let lastY = 40;

                    // Category Title
                    doc.setFontSize(18);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(accentColor);
                    doc.text(`${category} Category`, pageMargin, lastY);
                    
                    const head = [['Serial Number', 'School Name']];
                    const body = schoolsInCategory.map(school => [
                        school.serialNumber,
                        school.name,
                    ]);

                    doc.autoTable({
                        startY: lastY + 5,
                        head,
                        body,
                        theme: 'striped',
                        headStyles: { fillColor: primaryColor, textColor: 255 },
                        styles: { fontSize: 12, cellPadding: 3 },
                        margin: { left: pageMargin, right: pageMargin },
                        didDrawPage: (data) => {
                            lastY = data.cursor?.y || 0;
                        }
                    });
                }
            });

            doc.save("Performance_Order.pdf");

            toast({
                title: "Download Started",
                description: "The performance order is being downloaded as a PDF file."
            });
        } catch (error) {
            console.error("Error generating PDF:", error);
            toast({
                title: "PDF Generation Failed",
                description: "There was an error creating the PDF.",
                variant: "destructive"
            });
        }
    };

    return (
        <>
            <PageHeader title="Lottery">
                <div className="flex flex-wrap gap-2">
                    <Button onClick={handleDownloadOrder} variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Download Order
                    </Button>
                    <Button onClick={handleSaveOrder} disabled={isSaving}>
                        <Save className="mr-2 h-4 w-4" />
                        {isSaving ? "Saving..." : "Save Order"}
                    </Button>
                </div>
            </PageHeader>
            <div className="space-y-12">
                {schoolCategoryOrder.map(category => (
                    categorizedSchools[category] && (
                        <Card key={category}>
                            <CardHeader>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                    <CardTitle className="font-headline text-3xl text-primary">{category} Schools</CardTitle>
                                    <Button onClick={() => runLotteryForCategory(category)}>
                                        <Dices className="mr-2 h-4 w-4" /> Run Lottery for {category}
                                    </Button>
                                </div>
                                <CardDescription>
                                    Current performance order for the {category} category. Use the lottery button to generate a new random order.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {categorizedSchools[category].map((school, index) => (
                                    <div key={school.id} className="flex items-center gap-4 p-3 rounded-lg bg-background">
                                        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground font-bold text-lg">
                                            {school.serialNumber || index + 1}
                                        </div>
                                        <div className="font-medium text-lg">{school.name}</div>
                                        {school.serialNumber && index + 1 !== school.serialNumber && (
                                            <div className="flex items-center gap-2 ml-auto text-muted-foreground">
                                                <span className="text-sm line-through">{school.serialNumber}</span>
                                                <ArrowRight className="h-4 w-4" />
                                                <span className="text-lg font-bold text-primary">{index + 1}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )
                ))}
            </div>
        </>
    );
}
