
"use client";

import React from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// This is mock data. In a real app, you would fetch this from your database.
const registeredSchools = [
    {
        id: '1',
        schoolName: 'Maple Leaf International School',
        contactName: 'Mr. John Doe',
        mobileNumber: '9876543210',
        bankDetails: {
            accountHolderName: 'Maple Leaf School',
            bankName: 'Global Bank',
            accountNumber: '1234567890',
            ifscCode: 'GBLB0001234',
            upiId: 'mapleleaf@upi'
        },
        participants: [
            { name: 'Alice Smith', idCardUrl: '#' },
            { name: 'Bob Johnson', idCardUrl: '#' },
        ]
    },
    {
        id: '2',
        schoolName: 'Oakridge Public School',
        contactName: 'Ms. Jane Smith',
        mobileNumber: '8765432109',
        bankDetails: {
            accountHolderName: 'Oakridge School Trust',
            bankName: 'National Bank',
            accountNumber: '0987654321',
            ifscCode: 'NATB0005678',
            upiId: ''
        },
        participants: [
            { name: 'Charlie Brown', idCardUrl: '#' },
        ]
    }
];

export default function SchoolDataPage() {

    const handleDownloadAllPdf = () => {
        // Logic to generate a single PDF with all school details
        alert('Downloading all school details as PDF...');
    };

    const handleDownloadBankPdf = () => {
        // Logic to generate a PDF of bank details
        alert('Downloading bank details as PDF...');
    };

    const handleDownloadBankExcel = () => {
        // Logic to generate an Excel sheet of bank details
        alert('Downloading bank details as Excel...');
    };

    return (
        <>
            <PageHeader title="Registered School Data">
                <div className="flex flex-wrap justify-end gap-2">
                    <Button onClick={handleDownloadAllPdf} variant="outline">
                        <Download className="mr-2 h-4 w-4" /> Download All Details (PDF)
                    </Button>
                    <Button onClick={handleDownloadBankPdf}>
                        <FileText className="mr-2 h-4 w-4" /> Bank Details (PDF)
                    </Button>
                    <Button onClick={handleDownloadBankExcel}>
                        <FileSpreadsheet className="mr-2 h-4 w-4" /> Bank Details (Excel)
                    </Button>
                </div>
            </PageHeader>
            <div className="space-y-8">
                {registeredSchools.map(school => (
                    <Card key={school.id}>
                        <CardHeader>
                            <CardTitle>{school.schoolName}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <div>
                                    <h4 className="font-semibold text-lg mb-2">Contact Information</h4>
                                    <p><strong>Contact Person:</strong> {school.contactName}</p>
                                    <p><strong>Mobile:</strong> {school.mobileNumber}</p>
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
                                            {school.participants.map((p, index) => (
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
                ))}
            </div>
        </>
    );
}
