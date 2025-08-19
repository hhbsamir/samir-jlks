
"use client";

import React, { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { NavButtons } from '@/components/common/NavButtons';
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import type { Registration, Participant } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Extend jsPDF with autoTable
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDFWithAutoTable;
}

export default function SchoolDataPage() {
    const [registeredSchools, setRegisteredSchools] = useState<Registration[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const fetchRegistrations = async () => {
            setLoading(true);
            try {
                const registrationsCollection = collection(db, 'registrations');
                const q = query(registrationsCollection, orderBy("createdAt", "desc"));
                const querySnapshot = await getDocs(q);
                const schoolsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Registration));
                setRegisteredSchools(schoolsList);
            } catch (error) {
                console.error("Error fetching registrations: ", error);
                toast({
                    title: "Error Loading Data",
                    description: "Could not fetch school registration data.",
                    variant: "destructive"
                });
            } finally {
                setLoading(false);
            }
        };

        fetchRegistrations();
    }, [toast]);

    const handleDownloadBankExcel = () => {
        setIsDownloading(true);
        try {
            const dataForExcel = registeredSchools.map(school => ({
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
                body: registeredSchools.map(s => ([
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
    
    const handleDownloadAllPdf = () => {
        setIsDownloading(true);
        try {
            const doc = new jsPDF() as jsPDFWithAutoTable;

            registeredSchools.forEach((school, index) => {
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
            });

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
             <div className="absolute top-4 left-4 z-50">
                <NavButtons />
            </div>
            <div className="max-w-7xl mx-auto">
                <PageHeader title="Registered School Data">
                    <div className="flex flex-wrap justify-end gap-2">
                        <Button onClick={handleDownloadAllPdf} variant="outline" disabled={isDownloading || registeredSchools.length === 0}>
                            {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4" />} Download All (PDF)
                        </Button>
                        <Button onClick={handleDownloadBankPdf} disabled={isDownloading || registeredSchools.length === 0}>
                            {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FileText className="mr-2 h-4 w-4" />} Bank Details (PDF)
                        </Button>
                        <Button onClick={handleDownloadBankExcel} disabled={isDownloading || registeredSchools.length === 0}>
                            {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <FileSpreadsheet className="mr-2 h-4 w-4" />} Bank Details (Excel)
                        </Button>
                    </div>
                </PageHeader>
                <div className="space-y-8">
                     {loading ? (
                        <div className="flex justify-center items-center py-20">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        </div>
                    ) : registeredSchools.length > 0 ? (
                        registeredSchools.map(school => (
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
                                                        <TableHead>Participant Name</TableHead>
                                                        <TableHead className="text-right">ID Card</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {school.participants.map((p: Participant, index: number) => (
                                                        <TableRow key={index}>
                                                            <TableCell>{p.name}</TableCell>
                                                            <TableCell className="text-right">
                                                                <Button variant="link" asChild>
                                                                    <a href={p.idCardUrl} target="_blank" rel="noopener noreferrer">View ID</a>
                                                                </Button>
                                                            </TableCell>
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
