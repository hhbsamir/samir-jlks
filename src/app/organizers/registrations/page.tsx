
"use client";

import React, { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Download, FileText, FileSpreadsheet, Loader2, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCompetitionData } from '@/app/organizers/layout';
import type { Registration, Participant } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { collection, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';


// Extend jsPDF with autoTable
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDFWithAutoTable;
}

export default function RegistrationsPage() {
    const { registrations, schools, loading } = useCompetitionData();
    const [isDownloading, setIsDownloading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const { toast } = useToast();

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
    
    const handleDownloadAllPdf = async () => {
        setIsDownloading(true);
        try {
            const doc = new jsPDF() as jsPDFWithAutoTable;

            for (const [index, school] of registrations.entries()) {
                if (index > 0) doc.addPage();
                
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
                            // This would ideally create a new page, for now we just log a warning
                             console.warn("ID cards might overflow the page. Consider a multi-page layout for large numbers of participants.");
                             break; // Stop adding more images to this page
                        }

                        if (image.dataUrl) {
                            doc.setFontSize(8);
                            doc.text(image.name, xPos + imgWidth / 2, yPos, { maxWidth: imgWidth, align: 'center' });
                            doc.addImage(image.dataUrl, 'JPEG', xPos, textHeight, imgWidth, imgHeight);
                        } else {
                            doc.setFontSize(8);
                            doc.text(image.name, xPos + imgWidth / 2, yPos, { maxWidth: imgWidth, align: 'center' });
                            doc.text('Image error', xPos, yPos + 10);
                        }

                        xPos += imgWidth + gap;
                        if (xPos + imgWidth > pageWidth - pageMargin) {
                            xPos = pageMargin;
                            yPos += totalItemHeight;
                        }
                    }
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
                <div className="space-y-4">
                     {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        </div>
                    ) : registrations.length > 0 ? (
                        <Accordion type="multiple" className="w-full space-y-4">
                            {registrations.map(school => {
                                const schoolInfo = schools.find(s => s.name.toUpperCase() === school.schoolName.toUpperCase());
                                return (
                                    <AccordionItem value={school.id} key={school.id}>
                                        <Card>
                                            <AccordionTrigger className="w-full p-0 hover:no-underline">
                                                <CardHeader className="flex-row items-center justify-between w-full">
                                                    <div className="flex items-center gap-4">
                                                        {schoolInfo?.serialNumber && (
                                                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                                                                {schoolInfo.serialNumber}
                                                            </div>
                                                        )}
                                                        <CardTitle>{school.schoolName}</CardTitle>
                                                    </div>
                                                </CardHeader>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <CardContent>
                                                    <div className="space-y-6">
                                                        <div>
                                                            <h4 className="font-semibold text-lg mb-2">Contact Information</h4>
                                                            <p><strong>Contact Person:</strong> {school.contactPerson.contactName} ({school.contactPerson.designation})</p>
                                                            <p><strong>Mobile:</strong> {school.contactPerson.mobileNumber}</p>
                                                            {school.contactPerson.email && <p><strong>Email:</strong> {school.contactPerson.email}</p>}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-lg mb-2">Bank Details</h4>
                                                            <p><strong>Account Name:</strong> {school.bankDetails.accountHolderName}</p>
                                                            <p><strong>Bank:</strong> {school.bankDetails.bankName}</p>
                                                            <p><strong>Account No:</strong> {school.bankDetails.accountNumber}</p>
                                                            <p><strong>IFSC:</strong> {school.bankDetails.ifscCode}</p>
                                                            {school.bankDetails.upiId && <p><strong>UPI ID:</strong> {school.bankDetails.upiId}</p>}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-lg mb-2">Participants</h4>
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow>
                                                                        <TableHead>#</TableHead>
                                                                        <TableHead>Participant Name</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {school.participants.map((p: Participant, index: number) => (
                                                                        <TableRow key={index}>
                                                                            <TableCell>{index + 1}</TableCell>
                                                                            <TableCell>{p.name}</TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </AccordionContent>
                                        </Card>
                                    </AccordionItem>
                                )}
                            )}
                        </Accordion>
                    ) : (
                        <Card>
                            <CardContent className="pt-6">
                                <p className="text-center text-muted-foreground py-12">No schools have registered yet.</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );

    