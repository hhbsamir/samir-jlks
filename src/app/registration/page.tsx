
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
import { Loader2, PlusCircle, Trash2, Upload } from 'lucide-react';
import { NavButtons } from '@/components/common/NavButtons';

const participantSchema = z.object({
  name: z.string().min(1, 'Participant name is required.'),
  idCard: z.any().refine(file => file, "ID Card is required."),
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

export default function RegistrationPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<RegistrationFormValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      schoolName: '',
      participants: [{ name: '', idCard: null }],
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
    // Here you would typically handle file uploads to a storage service (like Firebase Storage)
    // and then save the form data (with file URLs) to a database (like Firestore).
    console.log(data);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    toast({
      title: 'Registration Submitted!',
      description: 'Thank you for registering. We will be in touch shortly.',
    });
    form.reset();
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 md:p-8">
      <div className="absolute top-4 left-4 z-50">
        <NavButtons />
      </div>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
            <h1 className="font-headline text-4xl sm:text-5xl font-bold text-primary">School Registration</h1>
            <p className="text-muted-foreground mt-2">Enter your school's details to participate in the competition.</p>
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
                <CardDescription>Add participant details and upload their ID cards.</CardDescription>
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
                         <Controller
                            control={form.control}
                            name={`participants.${index}.idCard`}
                            render={({ field: { onChange, value, ...rest } }) => (
                                <FormItem>
                                    <FormLabel>ID Card</FormLabel>
                                    <FormControl>
                                        <div className="flex items-center gap-2">
                                            <label className="flex-grow">
                                                <Input
                                                    type="file"
                                                    onChange={(e) => onChange(e.target.files?.[0])}
                                                    {...rest}
                                                    className="hidden"
                                                    accept="image/*,.pdf"
                                                />
                                                <Button type="button" variant="outline" asChild>
                                                    <div className="flex items-center gap-2 cursor-pointer">
                                                        <Upload className="w-4 h-4"/>
                                                        <span>{value?.name || "Upload ID Card"}</span>
                                                    </div>
                                                </Button>
                                            </label>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() => remove(index)}
                      className="mt-2 sm:mt-0 flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => append({ name: '', idCard: null })}
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
                    <FormField name="accountHolderName" render={({ field }) => (
                        <FormItem><FormLabel>Account Holder's Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField name="bankName" render={({ field }) => (
                        <FormItem><FormLabel>Bank Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField name="accountNumber" render={({ field }) => (
                        <FormItem><FormLabel>Account Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField name="ifscCode" render={({ field }) => (
                        <FormItem><FormLabel>IFSC Code</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField name="upiId" render={({ field }) => (
                        <FormItem><FormLabel>UPI ID (Optional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Contact Person</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <FormField name="contactName" render={({ field }) => (
                        <FormItem><FormLabel>Contact Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <FormField name="designation" render={({ field }) => (
                        <FormItem><FormLabel>Designation</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <FormField name="mobileNumber" render={({ field }) => (
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
