
"use client";

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCompetitionData } from '@/app/organizers/layout';
import type { Registration, Participant } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Extend jsPDF with autoTable
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDFWithAutoTable;
}

export default function RegistrationsPage() {
    const { registrations, loading } = useCompetitionData();
    const [isDownloading, setIsDownloading] = useState(false);
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
                head: [['School', 'Account Name', 'Bank', 'Account No', 'IFSC', 'Contact', 'Mobile']],
                body: registrations.map(s => ([
                    s.schoolName,
                    s.bankDetails.accountHolderName,
                    s.bankDetails.bankName,
                    s.bankDetails.accountNumber,
                    s.bankDetails.ifscCode,
                    s.contactPerson.contactName,
                    s.contactPerson.mobileNumber,
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
                    let yPos = 30;

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

                                const img = new Image();
                                img.src = dataUrl;
                                await new Promise(resolve => { img.onload = resolve; });

                                doc.setFontSize(12);
                                doc.text(participant.name, 14, yPos);
                                yPos += 5;

                                const imgProps = doc.getImageProperties(dataUrl);
                                const imgWidth = 180;
                                const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
                                
                                if (yPos + imgHeight > 280) { // Check if it fits on page
                                    doc.addPage();
                                    yPos = 20;
                                }
                                doc.addImage(dataUrl, 'JPEG', 14, yPos, imgWidth, imgHeight);
                                yPos += imgHeight + 10;

                            } catch (e) {
                                console.error(`Could not load image for ${participant.name}`, e);
                            }
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


    return (
        <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                <PageHeader title="Registered School Data" />
                <div className="flex flex-wrap justify-start gap-2 mb-8">
                    <Button onClick={handleDownloadAllPdf} variant="outline" disabled={isDownloading || registrations.length === 0}>
                        {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4" />} Download All (PDF)
                    </Button>
                    <Button onClick={handleDownloadBankPdf} disabled={isDownloading || registrations.length === 0}>
                        {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FileText className="mr-2 h-4 w-4" />} Bank Details (PDF)
                    </Button>
                    <Button onClick={handleDownloadBankExcel} disabled={isDownloading || registrations.length === 0}>
                        {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FileSpreadsheet className="mr-2 h-4 w-4" />} Bank Details (Excel)
                    </Button>
                </div>
                <div className="space-y-8">
                     {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        </div>
                    ) : registrations.length > 0 ? (
                        registrations.map(school => (
                            <Card key={school.id}>
                                <CardHeader>
                                    <CardTitle>{school.schoolName}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="font-semibold text-lg mb-2">Contact Information</h4>
                                            <p><strong>Contact Person:</strong> {school.contactPerson.contactName} ({school.contactPerson.designation})</p>
                                            <p><strong>Mobile:</strong> {school.contactPerson.mobileNumber}</p>
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
                            </Card>
                        ))
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
}
