
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, XCircle, File as FileIcon } from 'lucide-react';
import type { InterschoolCulturalSettings } from '@/lib/data';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const SETTINGS_DOC_ID = 'interschoolCulturalSettings';

async function deleteCloudinaryFile(publicId: string) {
    try {
        if (!publicId) {
            throw new Error("Could not extract public_id from URL");
        }
        const response = await fetch('/api/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicId, resourceType: 'raw' }),
        });
        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Failed to delete file from Cloudinary.');
        }
        return true;
    } catch (error) {
        console.error('Error deleting file from Cloudinary:', error);
        return false;
    }
}

export default function InterschoolCulturalSettingsClient() {
    const [settings, setSettings] = useState<InterschoolCulturalSettings | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const fetchSettings = useCallback(async () => {
        try {
            const settingsDocRef = doc(db, 'settings', SETTINGS_DOC_ID);
            const settingsDoc = await getDoc(settingsDocRef);
            if (settingsDoc.exists()) {
                setSettings(settingsDoc.data() as InterschoolCulturalSettings);
            } else {
                setSettings({ id: SETTINGS_DOC_ID, registrationPdfUrl: '', registrationPdfName: '', registrationPdfRemarks: '' });
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
            toast({
                title: "Error",
                description: "Could not load settings.",
                variant: "destructive"
            });
        }
    }, [toast]);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const handleSettingsUpdate = async (updateData: Partial<InterschoolCulturalSettings>) => {
        const newSettings = { ...(settings || { id: SETTINGS_DOC_ID, registrationPdfUrl: '', registrationPdfName: '', registrationPdfRemarks: '' }), ...updateData };
        setSettings(newSettings);
        try {
            const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
            // Use setDoc with merge:true to create or update the document
            await setDoc(docRef, updateData, { merge: true });
        } catch (error) {
            console.error(`Error saving settings:`, error);
            toast({
                title: "Error",
                description: `Could not save settings. Please try again.`,
                variant: "destructive"
            });
        }
    };
    
    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            toast({
                title: 'Invalid File Type',
                description: 'Please upload a PDF file.',
                variant: 'destructive',
            });
            return;
        }

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            // If there's an existing PDF, delete it from Cloudinary first.
            if (settings?.registrationPdfPublicId) {
                await deleteCloudinaryFile(settings.registrationPdfPublicId);
            }

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            if (data.success) {
                await handleSettingsUpdate({ 
                    registrationPdfUrl: data.url, 
                    registrationPdfName: file.name,
                    registrationPdfPublicId: data.public_id,
                });
                toast({ title: 'PDF uploaded successfully!' });
            } else {
                throw new Error(data.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Error uploading PDF:', error);
            toast({
                title: 'Upload Failed',
                description: 'Could not upload the PDF. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveFile = async () => {
        if (!settings?.registrationPdfPublicId) return;
        setIsRemoving(true);
        const success = await deleteCloudinaryFile(settings.registrationPdfPublicId);
        if (success) {
            await handleSettingsUpdate({ registrationPdfUrl: '', registrationPdfName: '', registrationPdfPublicId: '' });
            toast({ title: 'Success', description: 'PDF removed.' });
        } else {
            toast({ title: 'Error', description: 'Failed to remove PDF.', variant: 'destructive'});
        }
        setIsRemoving(false);
    };

    return (
        <>
            <PageHeader title="Interschool Cultural Settings" />
            <div className="grid gap-8 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Registration PDF</CardTitle>
                        <CardDescription>
                            Upload a PDF file (e.g., a circular or rulebook) to be displayed on the registration page for download.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex items-start gap-4">
                                <div className="flex flex-col gap-2">
                                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf" />
                                    <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading || isRemoving}>
                                        {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                        {isUploading ? 'Uploading...' : 'Upload PDF'}
                                    </Button>
                                    {settings?.registrationPdfUrl && (
                                        <Button type="button" variant="destructive" size="sm" onClick={handleRemoveFile} disabled={isUploading || isRemoving}>
                                            {isRemoving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                                            Remove PDF
                                        </Button>
                                    )}
                                </div>
                                {settings?.registrationPdfUrl && (
                                    <div className="flex items-center gap-2 p-2 border rounded-md bg-muted flex-grow">
                                        <FileIcon className="h-6 w-6 text-primary flex-shrink-0" />
                                        <a href={settings.registrationPdfUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-sm hover:underline break-all">
                                            {settings.registrationPdfName || 'View PDF'}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>PDF Remarks</CardTitle>
                        <CardDescription>
                            Enter a filename for the circular. This will be the name of the file when users download it. Do not include the .pdf extension.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="space-y-2">
                            <Label htmlFor="remarks">Download Filename</Label>
                            <Textarea 
                                id="remarks"
                                placeholder="e.g. Interschool Cultural Meet Circular 2024"
                                value={settings?.registrationPdfRemarks || ''}
                                onChange={(e) => handleSettingsUpdate({ registrationPdfRemarks: e.target.value })}
                                rows={3}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
