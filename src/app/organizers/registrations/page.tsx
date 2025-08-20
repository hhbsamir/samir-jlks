
"use client";

import React, { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Download, FileText, FileSpreadsheet, Loader2, Trash2, Edit, Copy, Check, Users, Banknote, UserSquare, VenetianMask } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCompetitionData } from '@/app/organizers/layout';
import type { Registration, Participant } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { collection, getDocs, writeBatch, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';


// Extend jsPDF with autoTable
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDFWithAutoTable;
}

export default function RegistrationsPage() {
    const { registrations, loading } = useCompetitionData();
    const [isDownloading, setIsDownloading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const { toast } = useToast();

    const handleCopyId = (id: string) => {
        navigator.clipboard.writeText(id);
        setCopiedId(id);
        toast({ title: "Copied!", description: "Registration ID copied to clipboard."});
        setTimeout(() => setCopiedId(null), 2000);
    }

    const handleDownloadBankExcel = () => {
        setIsDownloading(true);
        try {
            const dataForExcel = registrations.map(school => ({
                "School Name": school.schoolName,
                "Account Holder Name": school.bankDetails.accountHolderName,
                "Bank Name": school.bankDetails.bankName,
                "Account Number": school.bankDetails.accountNumber,
                "IFSC Code": school.bankDetails.ifscCode,
                "UPI ID": school.bankDetails.upiId,
                "Contact Name": school.contactPerson.contactName,
                "Designation": school.contactPerson.designation,
                "Mobile Number": school.contactPerson.mobileNumber,
                "Email": school.contactPerson.email,
            }));

            const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Bank & Contact Details");
            XLSX.writeFile(workbook, "School_Bank_And_Contact_Details.xlsx");
            
            toast({ title: "Download Successful", description: "Excel file is being downloaded." });
        } catch(e) {
             toast({ title: "Download Failed", description: "Could not generate Excel file.", variant: "destructive" });
        } finally {
            setIsDownloading(false);
        }
    };

    const handleDownloadBankPdf = () => {
        setIsDownloading(true);
        try {
            const doc = new jsPDF() as jsPDFWithAutoTable;
            doc.text("School Bank and Contact Details", 14, 15);
            doc.autoTable({
                head: [['School', 'Account Name', 'Bank', 'Account No', 'IFSC', 'Contact', 'Mobile', 'Email']],
                body: registrations.map(s => ([
                    s.schoolName,
                    s.bankDetails.accountHolderName,
                    s.bankDetails.bankName,
                    s.bankDetails.accountNumber,
                    s.bankDetails.ifscCode,
                    s.contactPerson.contactName,
                    s.contactPerson.mobileNumber,
                    s.contactPerson.email || 'N/A',
                ])),
                styles: { fontSize: 8 },
            });
            doc.save("School_Bank_And_Contact_Details.pdf");
            toast({ title: "Download Successful", description: "Bank details PDF is being downloaded." });

        } catch(e) {
             toast({ title: "Download Failed", description: "Could not generate PDF file.", variant: "destructive" });
        } finally {
            setIsDownloading(false);
        }
    };

    const generatePdfForSchool = async (school: Registration) => {
        const doc = new jsPDF() as jsPDFWithAutoTable;

        doc.setFontSize(18);
        doc.text(school.schoolName, 14, 22);
        doc.setFontSize(11);
        
        doc.autoTable({
            startY: 30,
            head: [['Details', 'Information']],
            body: [
                ['Contact Person', school.contactPerson.contactName],
                ['Designation', school.contactPerson.designation],
                ['Mobile Number', school.contactPerson.mobileNumber],
                ['Email', school.contactPerson.email || 'N/A'],
            ],
            theme: 'striped'
        });

        let finalY = (doc as any).lastAutoTable.finalY;

        doc.autoTable({
            startY: finalY + 10,
            head: [['Bank Details', '']],
            body: [
                ['Account Holder', school.bankDetails.accountHolderName],
                ['Bank', school.bankDetails.bankName],
                ['Account No', school.bankDetails.accountNumber],
                ['IFSC Code', school.bankDetails.ifscCode],
                ['UPI ID', school.bankDetails.upiId || 'N/A'],
            ],
                headStyles: { fillColor: [22, 163, 74] },
        });
        
        finalY = (doc as any).lastAutoTable.finalY;

        doc.autoTable({
            startY: finalY + 10,
            head: [['#', 'Participant Name']],
            body: school.participants.map((p, i) => [i + 1, p.name]),
                headStyles: { fillColor: [37, 99, 235] },
        });

        const participantsWithId = school.participants.filter(p => p.idCardUrl);
        if (participantsWithId.length > 0) {
            doc.addPage();
            doc.setFontSize(18);
            doc.text(`${school.schoolName} - ID Cards`, 14, 22);

            const pageMargin = 10;
            const topMargin = 30;
            const bottomMargin = 10;
            const gap = 4;
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const contentWidth = pageWidth - (pageMargin * 2);
            
            const images = [];

            // First pass: load images and get dimensions
            for (const participant of participantsWithId) {
                if (participant.idCardUrl) {
                    try {
                        const response = await fetch(participant.idCardUrl);
                        const blob = await response.blob();
                        const reader = new FileReader();
                        const dataUrl = await new Promise<string>(resolve => {
                            reader.onload = (e) => resolve(e.target?.result as string);
                            reader.readAsDataURL(blob);
                        });
                        images.push({ dataUrl, name: participant.name });
                    } catch (e) {
                        console.error(`Could not load image for ${participant.name}`, e);
                        images.push({ dataUrl: null, name: participant.name });
                    }
                }
            }

            // Calculate layout dynamically
            const numImages = images.length;
            let numCols = 4;
            if (numImages <= 3) numCols = numImages;
            else if (numImages <= 8) numCols = 4;
            else if (numImages <= 15) numCols = 5;
            else numCols = 6; // Max 6 columns for very large groups
            
            const imgWidth = (contentWidth - (gap * (numCols - 1))) / numCols;
            const imgHeight = imgWidth * 1.5; // Assuming a 2:3 aspect ratio for ID cards
            const textHeight = 5;
            const totalItemHeight = imgHeight + textHeight + gap;

            let xPos = pageMargin;
            let yPos = topMargin;

            for (const image of images) {
                if (yPos + totalItemHeight > pageHeight - bottomMargin) {
                    console.warn("ID cards might overflow the page. Consider a multi-page layout for large numbers of participants.");
                    break;
                }

                if (image.dataUrl) {
                    doc.setFontSize(8);
                    doc.text(image.name, xPos + imgWidth / 2, yPos, { maxWidth: imgWidth, align: 'center' });
                    doc.addImage(image.dataUrl, 'JPEG', xPos, yPos + textHeight, imgWidth, imgHeight);
                } else {
                    doc.setFontSize(8);
                    doc.text(image.name, xPos + imgWidth / 2, yPos, { maxWidth: imgWidth, align: 'center' });
                    doc.text('Image error', xPos, yPos + 10);
                }

                xPos += imgWidth + gap;
                if (xPos >= pageWidth - pageMargin) {
                    xPos = pageMargin;
                    yPos += totalItemHeight;
                }
            }
        }
        return doc;
    };
    
    const handleDownloadAllPdf = async () => {
        setIsDownloading(true);
        try {
            const doc = new jsPDF() as jsPDFWithAutoTable;
            for (const [index, school] of registrations.entries()) {
                const schoolPdf = await generatePdfForSchool(school);
                const pages = schoolPdf.internal.pages;
                 for (let j = 1; j < pages.length; j++) {
                     if (index > 0 || j > 1) doc.addPage();
                     const page = schoolPdf.internal.getPage(j);
                     doc.internal.pageSize.width = page.width;
                     doc.internal.pageSize.height = page.height;
                     doc.addPage(page.width, page.height);
                     doc.internal.write("q"); 
                     doc.internal.getFormObject(doc.internal.pages[doc.internal.pages.length-1][1]).doForm(page.forms);
                     doc.internal.write("Q");
                }
            }
            doc.save("All_School_Registrations.pdf");
            toast({ title: "Download Successful", description: "Full registration PDF is being downloaded." });
        } catch (e) {
            console.error(e);
            toast({ title: "Download Failed", description: "Could not generate PDF file.", variant: "destructive" });
        } finally {
            setIsDownloading(false);
        }
    };
    
    const handleDownloadSinglePdf = async (school: Registration) => {
        setIsDownloading(true);
        try {
            const doc = await generatePdfForSchool(school);
            doc.save(`${school.schoolName}_Registration.pdf`);
            toast({ title: "Download Successful", description: `PDF for ${school.schoolName} is downloading.` });
        } catch (e) {
            console.error("Error generating single PDF:", e);
            toast({ title: "Download Failed", description: "Could not generate PDF file.", variant: "destructive" });
        } finally {
            setIsDownloading(false);
        }
    }
    
    const handleDeleteRegistration = async (id: string) => {
        try {
            await deleteDoc(doc(db, "registrations", id));
            toast({ title: "Registration Deleted", description: "The registration has been successfully removed." });
        } catch(error) {
            console.error("Error deleting registration:", error);
            toast({ title: "Deletion Failed", description: "An error occurred.", variant: "destructive" });
        }
    };
    
    const handleDeleteAllRegistrations = async () => {
        setIsDeleting(true);
        try {
            const registrationsSnapshot = await getDocs(collection(db, "registrations"));
            if (registrationsSnapshot.empty) {
                toast({ title: "No Registrations Found", description: "There are no registrations to delete." });
                return;
            }
            
            const batch = writeBatch(db);
            registrationsSnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            
            toast({
                title: "All Registrations Deleted",
                description: "All registration records have been successfully removed."
            });
        } catch(error) {
            console.error("Error deleting all registrations: ", error);
            toast({
                title: "Deletion Failed",
                description: "An error occurred while trying to delete all registrations.",
                variant: "destructive"
            });
        } finally {
            setIsDeleting(false);
        }
    };


    return (
        <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                <PageHeader title="Registered School Data" />
                <div className="flex flex-wrap justify-start gap-2 mb-8">
                    <Button onClick={handleDownloadAllPdf} variant="outline" disabled={isDownloading || isDeleting || registrations.length === 0}>
                        {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4" />} Download All (PDF)
                    </Button>
                    <Button onClick={handleDownloadBankPdf} disabled={isDownloading || isDeleting || registrations.length === 0}>
                        {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FileText className="mr-2 h-4 w-4" />} Bank Details (PDF)
                    </Button>
                    <Button onClick={handleDownloadBankExcel} disabled={isDownloading || isDeleting || registrations.length === 0}>
                        {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FileSpreadsheet className="mr-2 h-4 w-4" />} Bank Details (Excel)
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={isDeleting || registrations.length === 0}>
                                {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Trash2 className="mr-2 h-4 w-4" />} Delete All
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete ALL registration data.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleDeleteAllRegistrations}
                                    disabled={isDeleting}
                                    className="bg-destructive hover:bg-destructive/90"
                                >
                                    {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Yes, Delete All Registrations
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
                <Card>
                    <CardContent className="pt-6">
                        {loading ? (
                            <div className="flex justify-center items-center py-20">
                                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            </div>
                        ) : registrations.length > 0 ? (
                            <Accordion type="multiple" className="w-full space-y-4">
                                {registrations.map((school, index) => (
                                    <AccordionItem value={school.id} key={school.id} className="border rounded-lg overflow-hidden">
                                        <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/50 data-[state=open]:bg-muted/50">
                                            <div className="flex justify-between items-center w-full">
                                                <div className="flex items-center gap-4">
                                                    <span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-bold">{index + 1}</span>
                                                    <h3 className="font-headline text-lg md:text-xl text-left">{school.schoolName}</h3>
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="bg-muted/20">
                                            <div className="p-6 space-y-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                    
                                                    <Card>
                                                        <CardHeader>
                                                            <CardTitle className="flex items-center gap-2 text-lg"><Users />Participants</CardTitle>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <ul className="space-y-2">
                                                                {school.participants.map((p, i) => (
                                                                    <li key={i} className="flex items-center justify-between">
                                                                        <span className="text-sm">{i+1}. {p.name}</span>
                                                                        {p.idCardUrl && (
                                                                             <div className="relative h-10 w-16 rounded-md overflow-hidden border">
                                                                                <Image src={p.idCardUrl} alt={`ID for ${p.name}`} layout="fill" objectFit="cover" />
                                                                             </div>
                                                                        )}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </CardContent>
                                                    </Card>
                                                    
                                                    <Card>
                                                        <CardHeader>
                                                            <CardTitle className="flex items-center gap-2 text-lg"><Banknote />Bank Details</CardTitle>
                                                        </CardHeader>
                                                        <CardContent className="space-y-1 text-sm">
                                                            <p><strong>Holder:</strong> {school.bankDetails.accountHolderName}</p>
                                                            <p><strong>Bank:</strong> {school.bankDetails.bankName}</p>
                                                            <p><strong>Account:</strong> {school.bankDetails.accountNumber}</p>
                                                            <p><strong>IFSC:</strong> {school.bankDetails.ifscCode}</p>
                                                            {school.bankDetails.upiId && <p><strong>UPI:</strong> {school.bankDetails.upiId}</p>}
                                                        </CardContent>
                                                    </Card>

                                                    <Card>
                                                        <CardHeader>
                                                            <CardTitle className="flex items-center gap-2 text-lg"><UserSquare />Contact Person</CardTitle>
                                                        </CardHeader>
                                                        <CardContent className="space-y-1 text-sm">
                                                            <p><strong>Name:</strong> {school.contactPerson.contactName}</p>
                                                            <p><strong>Designation:</strong> {school.contactPerson.designation}</p>
                                                            <p><strong>Mobile:</strong> {school.contactPerson.mobileNumber}</p>
                                                            {school.contactPerson.email && <p><strong>Email:</strong> {school.contactPerson.email}</p>}
                                                        </CardContent>
                                                    </Card>

                                                </div>
                                                <Separator />
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-mono text-xs text-muted-foreground bg-muted p-1 rounded">ID: {school.id}</span>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopyId(school.id)}>
                                                            {copiedId === school.id ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                                                        </Button>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Button asChild variant="outline" size="sm">
                                                            <Link href={`/registration/edit?id=${school.id}`}>
                                                                <Edit className="mr-2 h-4 w-4" /> Edit
                                                            </Link>
                                                        </Button>
                                                        <Button variant="outline" size="sm" onClick={() => handleDownloadSinglePdf(school)} disabled={isDownloading}>
                                                            <Download className="h-4 w-4 mr-2" /> Download PDF
                                                        </Button>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                            <Button variant="destructive" size="sm">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Delete {school.schoolName}?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                This will permanently delete this registration. This action cannot be undone.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                onClick={() => handleDeleteRegistration(school.id)}
                                                                className="bg-destructive hover:bg-destructive/90"
                                                                >
                                                                Delete
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        ) : (
                            <p className="text-center text-muted-foreground py-12">No schools have registered yet.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
