
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Trash2, Upload, Download } from 'lucide-react';
import { NavButtons } from '@/components/common/NavButtons';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import type { InterschoolCulturalSettings } from '@/lib/data';

const participantSchema = z.object({
  name: z.string().min(1, 'Participant name is required.'),
  idCardUrl: z.string().optional(),
});

const registrationSchema = z.object({
  schoolName: z.string().min(1, 'School name is required.'),
  participants: z.array(participantSchema).min(1, 'At least one participant is required.'),
  accountHolderName: z.string().min(1, 'Account holder name is required.'),
  bankName: z.string().min(1, 'Bank name is required.'),
  accountNumber: z.string().min(1, 'Account number is required.'),
  confirmAccountNumber: z.string().min(1, 'Please confirm your account number.'),
  ifscCode: z.string().min(1, 'IFSC code is required.'),
  upiId: z.string().optional(),
  contactName: z.string().min(1, 'Contact name is required.'),
  designation: z.string().min(1, 'Designation is required.'),
  mobileNumber: z.string()
    .startsWith('+91', { message: "Mobile number must start with +91." })
    .length(13, { message: "Mobile number must be 10 digits long, prefixed with +91 (e.g. +919876543210)."}),
}).refine(data => data.accountNumber === data.confirmAccountNumber, {
    message: "Account numbers do not match.",
    path: ["confirmAccountNumber"],
});

type RegistrationFormValues = z.infer<typeof registrationSchema>;

const indianBankNames = [
    "Axis Bank Ltd.",
    "Bandhan Bank",
    "Bank of Baroda",
    "Bank of India",
    "Bank of Maharashtra",
    "BNP Paribas",
    "Canara Bank",
    "Catholic Syrian Bank Ltd.",
    "Central Bank of India",
    "Citi Bank",
    "City Union Bank Ltd.",
    "DBS Bank Ltd.",
    "Deutsche Bank",
    "Development Credit Bank Ltd.",
    "Dhanlaxmi Bank Ltd.",
    "Federal Bank Ltd.",
    "HDFC Bank Ltd.",
    "HSBC",
    "ICICI Bank Ltd.",
    "IDBI Bank Ltd.",
    "IDFC First Bank",
    "Indian Bank",
    "Indian Overseas Bank",
    "Indusind Bank Ltd.",
    "Karnataka Bank Ltd.",
    "Karur Vysya Bank Ltd.",
    "Kotak Mahindra Bank Ltd.",
    "National Westminster Bank",
    "Punjab & Sind Bank",
    "Punjab National Bank",
    "RBL Bank",
    "Standard Chartered Bank",
    "State Bank of India",
    "Tamilnad Mercantile Bank Ltd.",
    "The Jammu & Kashmir Bank Ltd.",
    "The Nainital Bank Ltd.",
    "The South Indian Bank Ltd.",
    "UCO Bank",
    "Union Bank of India",
    "Yes Bank Ltd.",
    "Other"
].sort((a,b) => a.localeCompare(b));


function ParticipantIdUploader({ index, onUploadSuccess }: { index: number; onUploadSuccess: (index: number, url: string) => void }) {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > 50 * 1024) { // 50 KB size limit
            toast({
                title: 'File Too Large',
                description: 'Please upload an image smaller than 50 KB.',
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
                onUploadSuccess(index, data.url);
                toast({ title: 'ID Card uploaded successfully!' });
            } else {
                throw new Error(data.error || 'Upload failed');
            }
        } catch (error) {
            console.error('Error uploading photo:', error);
            toast({
                title: 'Upload Failed',
                description: 'Could not upload the ID card. Please try again.',
                variant: 'destructive',
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="flex flex-col gap-2 items-start">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoUpload}
                className="hidden"
                accept="image/*"
            />
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
            >
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {isUploading ? 'Uploading...' : 'Upload ID Card'}
            </Button>
            <p className="text-xs text-muted-foreground">Max file size: 50 KB.</p>
        </div>
    );
}

export default function RegistrationPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settings, setSettings] = useState<InterschoolCulturalSettings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
        try {
            const settingsDocRef = doc(db, 'settings', 'interschoolCulturalSettings');
            const settingsDoc = await getDoc(settingsDocRef);
            if (settingsDoc.exists()) {
                setSettings(settingsDoc.data() as InterschoolCulturalSettings);
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
        }
    };
    fetchSettings();
  }, []);

  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      schoolName: '',
      participants: [{ name: '', idCardUrl: '' }],
      accountHolderName: '',
      bankName: '',
      accountNumber: '',
      confirmAccountNumber: '',
      ifscCode: '',
      upiId: '',
      contactName: '',
      designation: '',
      mobileNumber: '+91',
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'participants',
  });

  const handleIdCardUpload = (index: number, url: string) => {
    const currentParticipant = form.getValues('participants')[index];
    update(index, { ...currentParticipant, idCardUrl: url });
  };

  const onSubmit = async (data: RegistrationFormValues) => {
    setIsSubmitting(true);
    
    try {
        // Prepare data for Firestore
        const registrationData = {
            schoolName: data.schoolName,
            participants: data.participants,
            bankDetails: {
                accountHolderName: data.accountHolderName,
                bankName: data.bankName,
                accountNumber: data.accountNumber,
                ifscCode: data.ifscCode,
                upiId: data.upiId || '',
            },
            contactPerson: {
                contactName: data.contactName,
                designation: data.designation,
                mobileNumber: data.mobileNumber,
            },
            createdAt: serverTimestamp(),
        };

        // Save to Firestore
        await addDoc(collection(db, 'registrations'), registrationData);
        
        toast({
          title: 'Registration Submitted!',
          description: 'Thank you for registering. We will be in touch shortly.',
        });
        form.reset();

    } catch (error) {
        console.error("Error submitting registration: ", error);
        toast({
            title: "Submission Failed",
            description: "An unexpected error occurred. Please try again.",
            variant: "destructive"
        })
    } finally {
        setIsSubmitting(false);
    }
  };

  const getDownloadFilename = () => {
    const remarks = settings?.registrationPdfRemarks?.trim();
    if (remarks) {
        return `${remarks}.pdf`;
    }
    return settings?.registrationPdfName || 'circular.pdf';
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8 relative">
      <div className="absolute top-4 left-4 z-50">
        <NavButtons />
      </div>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 pt-12 sm:pt-0">
            <h1 className="font-headline text-4xl sm:text-5xl font-bold text-primary">Registration for Inter-School Cultural Meet</h1>
            <p className="text-muted-foreground mt-2">Enter your school's details to participate</p>
        </div>

        {settings?.registrationPdfUrl && (
            <div className="mb-8 p-4 border-2 border-dashed border-primary/50 rounded-lg flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
                 <p className="font-semibold text-lg text-primary">Please review the event circular before registering.</p>
                 <Button asChild>
                    <a href={settings.registrationPdfUrl} download={getDownloadFilename()} target="_blank" rel="noopener noreferrer">
                       <Download className="mr-2 h-4 w-4" />
                       Download Circular
                    </a>
                 </Button>
            </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>School Information</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="schoolName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>School Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter school name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Participants</CardTitle>
                <CardDescription>Add participant details and upload their ID cards.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex flex-col sm:flex-row gap-4 items-start p-4 border rounded-md">
                    <div className="flex-grow space-y-4 w-full">
                        <FormField
                            control={form.control}
                            name={`participants.${index}.name`}
                            render={({ field: nameField }) => (
                                <FormItem>
                                    <FormLabel>Participant #{index + 1} Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter participant's name" {...nameField} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex items-center gap-4">
                            <ParticipantIdUploader index={index} onUploadSuccess={handleIdCardUpload} />
                             {form.getValues('participants')[index]?.idCardUrl && (
                                <div className="relative h-16 w-24 rounded-md overflow-hidden">
                                    <Image
                                        src={form.getValues('participants')[index].idCardUrl!}
                                        alt="ID card preview"
                                        layout="fill"
                                        objectFit="cover"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={() => remove(index)}
                        className="mt-2 sm:mt-0 flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => append({ name: '', idCardUrl: '' })}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Participant
                </Button>
              </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Bank Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name="accountHolderName" render={({ field }) => (
                        <FormItem><FormLabel>Account Holder's Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField
                      control={form.control}
                      name="bankName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank Name</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a bank" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {indianBankNames.map((bank) => (
                                <SelectItem key={bank} value={bank}>{bank}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField control={form.control} name="accountNumber" render={({ field }) => (
                        <FormItem><FormLabel>Account Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="confirmAccountNumber" render={({ field }) => (
                        <FormItem><FormLabel>Confirm Account Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="ifscCode" render={({ field }) => (
                        <FormItem><FormLabel>IFSC Code</FormLabel><FormControl><Input {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase())} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="upiId" render={({ field }) => (
                        <FormItem><FormLabel>UPI ID (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Contact Person</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <FormField control={form.control} name="contactName" render={({ field }) => (
                        <FormItem><FormLabel>Contact Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <FormField control={form.control} name="designation" render={({ field }) => (
                        <FormItem><FormLabel>Designation</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <FormField control={form.control} name="mobileNumber" render={({ field }) => (
                        <FormItem><FormLabel>Mobile Number</FormLabel><FormControl><Input type="tel" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button type="submit" size="lg" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Registration
                </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
