
"use client";

import React, { useState, useCallback, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/page-header';
import type { School, SchoolCategory } from '@/lib/data';
import { PlusCircle, Edit, Trash2, Upload, Loader2, Download } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, writeBatch, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { useRouter } from 'next/navigation';
import { useCompetitionData } from '@/app/organizers/layout';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

const validCategories: SchoolCategory[] = ["Sub-Junior", "Junior", "Senior"];

// Extend jsPDF with autoTable for TS support
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDFWithAutoTable;
}

export default function SchoolsClient() {
  const { schools: initialSchools } = useCompetitionData();
  const { toast } = useToast();
  const [schools, setSchools] = useState<School[]>(initialSchools);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // The schools data from context will update in real-time.
  // We use useEffect to keep our local state in sync.
  React.useEffect(() => {
    setSchools(initialSchools);
  }, [initialSchools]);

  const refreshData = () => {
    // No longer need to call router.refresh() as context provides real-time data.
    // This is a placeholder if some non-data related refresh is needed.
  }

  const categorizedSchools = useMemo(() => {
    return validCategories.reduce((acc, category) => {
        const sortedSchools = schools
            .filter(school => school.category === category)
            .sort((a, b) => (a.serialNumber ?? Infinity) - (b.serialNumber ?? Infinity) || a.name.localeCompare(b.name));
        acc[category] = sortedSchools;
        return acc;
    }, {} as Record<SchoolCategory, School[]>);
  }, [schools]);

  const openDialog = (school: School | null = null) => {
    setEditingSchool(school);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingSchool(null);
  };

  const handleSave = async (schoolData: Partial<Omit<School, 'id'>> & { name: string; category: SchoolCategory; }) => {
    try {
        // Explicitly handle serialNumber to allow clearing it
        const dataToSave: any = {
            name: schoolData.name,
            category: schoolData.category,
            serialNumber: schoolData.serialNumber ? schoolData.serialNumber : null,
        };

        if (editingSchool) {
            const schoolDoc = doc(db, "schools", editingSchool.id);
            await updateDoc(schoolDoc, dataToSave);
            toast({ title: "Success", description: "School updated successfully." });
        } else {
            await addDoc(collection(db, "schools"), dataToSave);
            toast({ title: "Success", description: "School added successfully." });
        }
        // Data will update via the real-time listener in the layout.
        closeDialog();
    } catch (error) {
        console.error("Error saving school: ", error);
        toast({ title: "Error", description: "Could not save school.", variant: "destructive" });
    }
  };

  const handleDelete = async (schoolId: string) => {
    try {
        await deleteDoc(doc(db, "schools", schoolId));
        toast({ title: "Success", description: "School deleted successfully." });
        // Data will update via the real-time listener in the layout.
    } catch (error) {
        console.error("Error deleting school: ", error);
        toast({ title: "Error", description: "Could not delete school.", variant: "destructive" });
    }
  }

  const handleDeleteAllSchools = async () => {
    setIsDeletingAll(true);
    try {
        const schoolsSnapshot = await getDocs(collection(db, "schools"));
        if (schoolsSnapshot.empty) {
            toast({ title: "No Schools Found", description: "There are no schools to delete." });
            return;
        }
        
        const batch = writeBatch(db);
        schoolsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        
        toast({
            title: "All Schools Deleted",
            description: "All school records have been successfully removed."
        });
        
        // Data will update via the real-time listener in the layout.

    } catch(error) {
        console.error("Error deleting all schools: ", error);
        toast({
            title: "Deletion Failed",
            description: "An error occurred while trying to delete all schools.",
            variant: "destructive"
        });
    } finally {
        setIsDeletingAll(false);
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<{ "School Name": string; "Category": SchoolCategory; "Serial Number": number }>(worksheet);
        
        const newSchools = json.map(row => ({
          name: row["School Name"],
          category: row["Category"],
          serialNumber: row["Serial Number"] ? Number(row["Serial Number"]) : undefined,
        }));

        const invalidSchools = newSchools.filter(school => !school.name || !school.category || !validCategories.includes(school.category));
        
        if (invalidSchools.length > 0) {
            toast({
                title: "Invalid Data",
                description: `Found ${invalidSchools.length} invalid rows. Please ensure 'School Name' is filled and 'Category' is one of: ${validCategories.join(', ')}.`,
                variant: "destructive",
                duration: 9000,
            });
            return;
        }

        const batch = writeBatch(db);
        newSchools.forEach(school => {
            const newSchoolRef = doc(collection(db, "schools"));
            const schoolData: Partial<School> = {
                name: school.name,
                category: school.category,
            };
            if(school.serialNumber) {
                schoolData.serialNumber = school.serialNumber;
            }
            batch.set(newSchoolRef, schoolData);
        });

        await batch.commit();

        toast({
            title: "Upload Successful",
            description: `${newSchools.length} schools have been added.`
        });
        
        // Data will update via the real-time listener in the layout.

      } catch (error) {
        console.error("Error processing Excel file: ", error);
        toast({ title: "Upload Failed", description: "There was an error processing your file.", variant: "destructive" });
      } finally {
        setIsUploading(false);
        // Reset file input
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDownloadPdf = () => {
    try {
        const doc = new jsPDF() as jsPDFWithAutoTable;
        const pageMargin = 15;
        const primaryColor = '#16a34a'; // Green from theme
        const accentColor = '#4f46e5'; // Purple from theme
        const pageWidth = doc.internal.pageSize.getWidth();

        // Title
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor);
        doc.text('List of Participating Schools', pageWidth / 2, 20, { align: 'center' });

        // Date
        const reportDate = format(new Date(), 'do MMMM yyyy');
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100);
        doc.text(`Generated on: ${reportDate}`, pageWidth / 2, 28, { align: 'center' });

        let lastY = 40;

        validCategories.forEach(category => {
            const schoolsInCategory = categorizedSchools[category];
            if (schoolsInCategory && schoolsInCategory.length > 0) {
                
                const tableHeight = (schoolsInCategory.length * 10) + 20; // Approximation
                if (lastY + tableHeight > 270 && lastY > 40) {
                    doc.addPage();
                    lastY = 20;
                }

                // Category Title
                doc.setFontSize(18);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(accentColor);
                doc.text(`${category} Schools`, pageMargin, lastY);
                
                const head = [['Serial Number', 'School Name']];
                const body = schoolsInCategory.map(school => [
                    school.serialNumber ?? 'N/A',
                    school.name,
                ]);

                doc.autoTable({
                    startY: lastY + 5,
                    head,
                    body,
                    theme: 'striped',
                    headStyles: { fillColor: primaryColor, textColor: 255 },
                    styles: { fontSize: 12, cellPadding: 3 },
                    margin: { left: pageMargin, right: pageMargin },
                });

                lastY = (doc as any).lastAutoTable.finalY + 15;
            }
        });

        doc.save("School_List.pdf");

        toast({
            title: "Download Started",
            description: "The school list is being downloaded as a PDF file."
        });
    } catch (error) {
        console.error("Error generating PDF:", error);
        toast({
            title: "PDF Generation Failed",
            description: "There was an error creating the PDF.",
            variant: "destructive"
        });
    }
  };


  return (
    <>
      <PageHeader title="Manage Schools">
        <div className="flex flex-wrap justify-end gap-2">
            <Button onClick={handleDownloadPdf} variant="outline" disabled={schools.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Download as PDF
            </Button>
            <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden" 
                accept=".xlsx, .xls"
            />
            <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                <Upload className="mr-2 h-4 w-4" />
                {isUploading ? "Uploading..." : "Upload from Excel"}
            </Button>
            <Button onClick={() => openDialog()}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add School
            </Button>
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isDeletingAll || schools.length === 0}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        {isDeletingAll ? 'Deleting...' : 'Delete All Schools'}
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete ALL schools from the database.
                        This action will not delete judges, categories, scores, or feedback.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDeleteAllSchools}
                        disabled={isDeletingAll}
                        className="bg-destructive hover:bg-destructive/90"
                    >
                        {isDeletingAll ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : null}
                        {isDeletingAll
                        ? 'Deleting all schools...'
                        : 'Yes, Delete All Schools'}
                    </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
      </PageHeader>
      
      <div className="space-y-12">
        {validCategories.map(category => (
            categorizedSchools[category] && categorizedSchools[category].length > 0 && (
            <section key={category}>
                <h2 className="font-headline text-3xl md:text-4xl text-foreground/90 mb-6">{category} Schools</h2>
                <Card>
                    <CardContent className="pt-6">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[80px]">Sl. No.</TableHead>
                                        <TableHead>School Name</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {categorizedSchools[category].map(school => (
                                        <TableRow key={school.id}>
                                            <TableCell className="font-medium">{school.serialNumber ?? 'N/A'}</TableCell>
                                            <TableCell className="font-medium">{school.name}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" onClick={() => openDialog(school)}>
                                                <Edit className="h-4 w-4 text-accent" />
                                                </Button>
                                                <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. This will permanently delete the school and all associated scores.
                                                    </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(school.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </section>
            )
        ))}
      </div>

      <SchoolFormDialog 
        isOpen={isDialogOpen} 
        onClose={closeDialog} 
        onSave={handleSave}
        school={editingSchool} 
      />
    </>
  );
}

type SchoolFormDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<Omit<School, 'id'>> & { name: string; category: SchoolCategory; }) => void;
    school: School | null;
}

function SchoolFormDialog({ isOpen, onClose, onSave, school }: SchoolFormDialogProps) {
    const [name, setName] = useState('');
    const [category, setCategory] = useState<SchoolCategory | undefined>();
    const [serialNumber, setSerialNumber] = useState<string>('');
    const [isSaving, setIsSaving] = useState(false);

    React.useEffect(() => {
        if(isOpen) {
            setName(school?.name || '');
            setCategory(school?.category);
            setSerialNumber(school?.serialNumber?.toString() || '');
        }
    }, [isOpen, school]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (name && category) {
            setIsSaving(true);
            const schoolData: any = { 
                name, 
                category,
                serialNumber: serialNumber ? parseInt(serialNumber, 10) : null 
            };
            await onSave(schoolData);
            setIsSaving(false);
        }
    };

    return (
         <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl sm:text-3xl text-primary">{school ? 'Edit School' : 'Add New School'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-lg">School Name</Label>
                        <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="serialNumber" className="text-lg">Serial Number</Label>
                        <Input id="serialNumber" type="number" value={serialNumber} onChange={e => setSerialNumber(e.target.value)} placeholder="Optional, for custom ordering" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="category" className="text-lg">Category</Label>
                        <Select value={category} onValueChange={(value: SchoolCategory) => setCategory(value)} required>
                            <SelectTrigger id="category">
                                <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Sub-Junior">Sub-Junior</SelectItem>
                                <SelectItem value="Junior">Junior</SelectItem>
                                <SelectItem value="Senior">Senior</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <DialogFooter>
                         <DialogClose asChild>
                            <Button type="button" variant="ghost" disabled={isSaving}>Cancel</Button>
                         </DialogClose>
                        <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save School'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
