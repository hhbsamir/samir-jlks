
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
import { Loader2, PlusCircle, Trash2, Upload, Download, Copy, Check, ArrowLeft, X, Edit, Search } from 'lucide-react';
import { NavButtons } from '@/components/common/NavButtons';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp, doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import type { InterschoolCulturalSettings, Registration } from '@/lib/data';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

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
    .min(10, { message: "Mobile number must be at least 10 digits long."}),
  email: z.string().email("Please enter a valid email address.").optional().or(z.literal('')),
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

export default function RegistrationForm({ editId }: { editId?: string | null }) {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!editId);
  const [settings, setSettings] = useState<InterschoolCulturalSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [newRegistrationId, setNewRegistrationId] = useState('');
  const [initialData, setInitialData] = useState<Registration | null>(null);
  const [notFound, setNotFound] = useState(false);

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
      mobileNumber: '',
      email: '',
    },
  });

  useEffect(() => {
    const fetchSettings = async () => {
        setLoadingSettings(true);
        try {
            const settingsDocRef = doc(db, 'settings', 'interschoolCulturalSettings');
            const settingsDoc = await getDoc(settingsDocRef);
            if (settingsDoc.exists()) {
                setSettings(settingsDoc.data() as InterschoolCulturalSettings);
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
            toast({ title: "Error", description: "Could not load settings information."});
        } finally {
            setLoadingSettings(false);
        }
    };
    fetchSettings();
  }, [toast]);
  
  useEffect(() => {
    const fetchInitialData = async () => {
        if (editId) {
            setIsLoading(true);
            try {
                const docRef = doc(db, 'registrations', editId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = { id: docSnap.id, ...docSnap.data() } as Registration;
                    setInitialData(data);
                    form.reset({
                        schoolName: data.schoolName,
                        participants: data.participants,
                        accountHolderName: data.bankDetails.accountHolderName,
                        bankName: data.bankDetails.bankName,
                        accountNumber: data.bankDetails.accountNumber,
                        confirmAccountNumber: data.bankDetails.accountNumber, // Pre-fill confirmation
                        ifscCode: data.bankDetails.ifscCode,
                        upiId: data.bankDetails.upiId,
                        contactName: data.contactPerson.contactName,
                        designation: data.contactPerson.designation,
                        mobileNumber: data.contactPerson.mobileNumber,
                        email: data.contactPerson.email,
                    });
                } else {
                    toast({ title: "Not Found", description: "The registration you are trying to edit does not exist.", variant: "destructive" });
                    setNotFound(true);
                }
            } catch (e) {
                toast({ title: "Error", description: "Failed to load registration data.", variant: "destructive" });
                setNotFound(true);
            } finally {
                setIsLoading(false);
            }
        }
    };
    fetchInitialData();
  }, [editId, form, toast]);


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
                email: data.email || '',
            },
            updatedAt: serverTimestamp(),
        };

        if (editId) {
            const docRef = doc(db, 'registrations', editId);
            await updateDoc(docRef, registrationData);
            toast({
              title: 'Registration Updated!',
              description: 'Your changes have been saved successfully.',
            });
        } else {
            const docRef = await addDoc(collection(db, 'registrations'), {
                ...registrationData,
                createdAt: serverTimestamp(),
            });
            setNewRegistrationId(docRef.id);
            setSubmissionSuccess(true);
        }

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

  const SuccessScreen = () => {
      const [copied, setCopied] = useState(false);
      
      const handleCopy = () => {
          if (newRegistrationId) {
            navigator.clipboard.writeText(newRegistrationId);
            setCopied(true);
            toast({ title: "Copied!", description: "Registration ID copied to clipboard." });
            setTimeout(() => setCopied(false), 2000);
          }
      };

      return (
          <div className="flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-green-500 rounded-lg bg-green-50">
              <Check className="w-16 h-16 text-green-600 bg-white rounded-full p-2 shadow-lg mb-4" />
              <h2 className="font-headline text-2xl sm:text-3xl font-bold text-green-800">Registration Submitted Successfully!</h2>
              <p className="mt-2 text-green-700">Please save your Registration ID. You will need it to edit your submission later.</p>
              
              <Alert className="mt-6 text-left bg-white">
                  <AlertTitle className="font-bold">Your Unique Registration ID</AlertTitle>
                  <AlertDescription>
                      <div className="flex flex-col sm:flex-row items-center gap-4 mt-2">
                          <Input readOnly value={newRegistrationId} className="bg-gray-100 font-mono text-center" />
                          <Button onClick={handleCopy} variant="outline" className="w-full sm:w-auto" disabled={!newRegistrationId}>
                              {copied ? <Check className="mr-2"/> : <Copy className="mr-2"/>}
                              {copied ? 'Copied!' : 'Copy ID'}
                          </Button>
                      </div>
                      <p className="text-xs mt-4 bg-red-100 text-red-700 font-bold p-2 rounded-md">
                          Important: Keep this ID safe. It is the only way to access and modify your registration details.
                      </p>
                  </AlertDescription>
              </Alert>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                  <Button asChild>
                      <Link href={`/registration/edit?id=${newRegistrationId}`}>
                          <Edit className="mr-2 h-4 w-4"/> Go to Edit Page
                      </Link>
                  </Button>
                   <Button onClick={() => window.location.href = '/registration'} variant="outline">
                      <PlusCircle className="mr-2" /> Start New Registration
                  </Button>
              </div>
          </div>
      );
  }

  const SearchForIdScreen = () => {
    const [registrationIdInput, setRegistrationIdInput] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (registrationIdInput) {
            router.push(`/registration/edit?id=${registrationIdInput}`);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <div className="fixed top-4 left-4 z-50">
                <NavButtons />
            </div>
            <Card className="w-full max-w-md mx-4">
                <CardHeader className="text-center">
                    <CardTitle className="font-headline text-3xl text-primary">Edit Registration</CardTitle>
                    <CardDescription>Enter your Registration ID to find and edit your submission.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSearch} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="registrationId">Registration ID</Label>
                            <Input
                                id="registrationId"
                                type="text"
                                placeholder="Paste your ID here"
                                value={registrationIdInput}
                                onChange={(e) => setRegistrationIdInput(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 animate-spin" />
                                    <span>Loading...</span>
                                </>
                            ) : (
                                <>
                                    <Search className="mr-2" />
                                    <span>Find Registration</span>
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
  };

  // If this is the edit page but no ID is provided, show search screen
  if (editId === null) {
    return <SearchForIdScreen />;
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <p className="mt-4 text-muted-foreground">Loading Registration Data...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return <SearchForIdScreen />;
  }

  if (submissionSuccess) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8 flex items-center justify-center">
        <div className="max-w-4xl mx-auto w-full">
          <SuccessScreen />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8 flex items-center justify-center">
      <div className="fixed top-4 left-4 z-50">
        <NavButtons />
      </div>
      <div className="max-w-4xl mx-auto w-full">
        <div className="text-center mb-8 pt-12 sm:pt-0">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <h1 className="font-headline text-4xl sm:text-5xl font-bold text-primary">
                {editId ? 'Edit Registration' : 'Registration for Inter-School Cultural Meet'}
              </h1>
              {!editId && (
                <Button asChild variant="outline">
                    <Link href="/registration/edit">
                        <Edit className="mr-2 h-4 w-4"/> Edit Registration
                    </Link>
                </Button>
              )}
          </div>
          <p className="text-muted-foreground mt-2">
            {editId ? 'Modify the details below and click update.' : "Enter your school's details to participate"}
          </p>
        </div>

        {loadingSettings ? (
          <div className="mb-8 p-4 h-20 border-2 border-dashed border-primary/50 rounded-lg flex items-center justify-center">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            <p className="font-semibold text-lg text-primary">Loading circular...</p>
          </div>
        ) : settings?.registrationPdfUrl && (
            <Accordion type="single" collapsible className="w-full mb-8">
              <AccordionItem value="item-1">
                <AccordionTrigger className="p-4 border-2 border-dashed border-primary/50 rounded-lg font-semibold text-lg text-primary">
                  Please review the event circular before registering. (Click to view)
                </AccordionTrigger>
                <AccordionContent>
                    <div className="aspect-[3/4] sm:aspect-video mt-2">
                        <iframe
                            src={settings.registrationPdfUrl}
                            title="Event Circular"
                            className="w-full h-full border rounded-md"
                        />
                    </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
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
                        <Input 
                            placeholder="Enter school name" 
                            {...field} 
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
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
                 <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email (Optional)</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" size="lg" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editId ? 'Update Registration' : 'Submit Registration'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
