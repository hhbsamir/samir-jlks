
"use client";

import React, { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { NavButtons } from '@/components/common/NavButtons';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const participantSchema = z.object({
  name: z.string().min(1, 'Participant name is required.'),
});

const registrationSchema = z.object({
  schoolName: z.string().min(1, 'School name is required.'),
  participants: z.array(participantSchema).min(1, 'At least one participant is required.'),
  accountHolderName: z.string().min(1, 'Account holder name is required.'),
  bankName: z.string().min(1, 'Bank name is required.'),
  accountNumber: z.string().min(1, 'Account number is required.'),
  ifscCode: z.string().min(1, 'IFSC code is required.'),
  upiId: z.string().optional(),
  contactName: z.string().min(1, 'Contact name is required.'),
  designation: z.string().min(1, 'Designation is required.'),
  mobileNumber: z.string().min(10, 'Mobile number must be at least 10 digits.'),
});

type RegistrationFormValues = z.infer<typeof registrationSchema>;

const indianBankNames = [
    "State Bank of India",
    "Punjab National Bank",
    "Bank of Baroda",
    "Canara Bank",
    "Union Bank of India",
    "HDFC Bank",
    "ICICI Bank",
    "Axis Bank",
    "Kotak Mahindra Bank",
    "IndusInd Bank",
    "Yes Bank",
    "Bank of India",
    "Central Bank of India",
    "Indian Bank",
    "UCO Bank",
    "Bank of Maharashtra",
    "Punjab & Sind Bank",
    "IDBI Bank",
    "Federal Bank",
    "South Indian Bank",
    "Karur Vysya Bank",
    "Karnataka Bank",
    "Jammu & Kashmir Bank",
    "City Union Bank",
    "Tamilnad Mercantile Bank",
    "Nainital Bank",
    "Dhanlaxmi Bank",
    "IDFC First Bank",
    "Bandhan Bank",
    "CSB Bank",
    "RBL Bank",
    "DCB Bank",
    "AU Small Finance Bank",
    "Equitas Small Finance Bank",
    "Ujjivan Small Finance Bank",
    "Jana Small Finance Bank",
    "Suryoday Small Finance Bank",
    "Fincare Small Finance Bank",
    "ESAF Small Finance Bank",
    "Utkarsh Small Finance Bank",
    "Shivalik Small Finance Bank",
    "Capital Small Finance Bank",
    "North East Small Finance Bank",
    "Unity Small Finance Bank",
    "Paytm Payments Bank",
    "Airtel Payments Bank",
    "India Post Payments Bank",
    "Fino Payments Bank",
    "Jio Payments Bank",
    "NSDL Payments Bank",
    "Standard Chartered Bank",
    "HSBC Bank",
    "Citibank",
    "DBS Bank",
    "Deutsche Bank",
    "American Express",
    "Barclays Bank",
    "BNP Paribas",
    "Credit Suisse",
    "Morgan Stanley",
    "Goldman Sachs",
    "J.P. Morgan Chase",
    "Bank of America",
    "The Royal Bank of Scotland",
    "Other"
];


export default function RegistrationPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      schoolName: '',
      participants: [{ name: '' }],
      accountHolderName: '',
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      upiId: '',
      contactName: '',
      designation: '',
      mobileNumber: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'participants',
  });

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
                <CardDescription>Add participant details.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="flex flex-col sm:flex-row gap-4 items-start p-4 border rounded-md">
                    <div className="flex-grow space-y-4 w-full">
                        <FormField
                        control={form.control}
                        name={`participants.${index}.name`}
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Participant Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Enter participant's name" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
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
                  onClick={() => append({ name: '' })}
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
                    <FormField control={form.control} name="ifscCode" render={({ field }) => (
                        <FormItem><FormLabel>IFSC Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
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
