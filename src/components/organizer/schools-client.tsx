
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
import { PlusCircle, Edit, Trash2, Upload, Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, writeBatch, getDocs } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { useRouter } from 'next/navigation';

const validCategories: SchoolCategory[] = ["Sub-Junior", "Junior", "Senior"];

export default function SchoolsClient({ initialSchools }: { initialSchools: School[] }) {
  const [schools, setSchools] = useState<School[]>(initialSchools);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const refreshData = () => {
    router.refresh();
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
        if (editingSchool) {
            const schoolDoc = doc(db, "schools", editingSchool.id);
            await updateDoc(schoolDoc, schoolData);
            toast({ title: "Success", description: "School updated successfully." });
        } else {
            await addDoc(collection(db, "schools"), schoolData);
            toast({ title: "Success", description: "School added successfully." });
        }
        refreshData();
        const newSchoolsSnapshot = await getDocs(collection(db, 'schools'));
        setSchools(newSchoolsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as School)));
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
        setSchools(schools.filter(s => s.id !== schoolId));
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
        
        setSchools([]);
        refreshData();

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

        refreshData();
        const newSchoolsSnapshot = await getDocs(collection(db, 'schools'));
        setSchools(newSchoolsSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as School)));

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

  return (
    <>
      <PageHeader title="Manage Schools">
        <div className="flex flex-wrap justify-end gap-2">
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
                                    {categorizedSchools[category].map((school, index) => (
                                        <TableRow key={school.id}>
                                            <TableCell className="font-medium">{school.serialNumber ?? index + 1}</TableCell>
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
            const schoolData: Partial<Omit<School, 'id'>> & { name: string; category: SchoolCategory; } = { name, category };
            if (serialNumber) {
                schoolData.serialNumber = parseInt(serialNumber, 10);
            }
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
