
"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/page-header';
import type { School, SchoolCategory } from '@/lib/data';
import { PlusCircle, Edit, Trash2, Upload } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

const validCategories: SchoolCategory[] = ["Sub-Junior", "Junior", "Senior"];

export default function SchoolsClient() {
  const [schools, setSchools] = useState<School[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchSchools = useCallback(async () => {
    setLoading(true);
    const schoolsCollection = collection(db, 'schools');
    const schoolsSnapshot = await getDocs(schoolsCollection);
    const schoolsList = schoolsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as School)).sort((a,b) => a.name.localeCompare(b.name));
    setSchools(schoolsList);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  const openDialog = (school: School | null = null) => {
    setEditingSchool(school);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingSchool(null);
  };

  const handleSave = async (schoolData: Omit<School, 'id'>) => {
    try {
        if (editingSchool) {
            const schoolDoc = doc(db, "schools", editingSchool.id);
            await updateDoc(schoolDoc, schoolData);
            toast({ title: "Success", description: "School updated successfully." });
        } else {
            await addDoc(collection(db, "schools"), schoolData);
            toast({ title: "Success", description: "School added successfully." });
        }
        fetchSchools();
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
        fetchSchools();
    } catch (error) {
        console.error("Error deleting school: ", error);
        toast({ title: "Error", description: "Could not delete school.", variant: "destructive" });
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
        const json = XLSX.utils.sheet_to_json<{ "School Name": string; "Category": SchoolCategory }>(worksheet);
        
        const newSchools = json.map(row => ({
          name: row["School Name"],
          category: row["Category"]
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
            batch.set(newSchoolRef, school);
        });

        await batch.commit();

        toast({
            title: "Upload Successful",
            description: `${newSchools.length} schools have been added.`
        });

        fetchSchools();
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
        <div className="flex gap-2">
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
        </div>
      </PageHeader>
      
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>School Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">Loading schools...</TableCell>
                </TableRow>
              ) : schools.map(school => (
                <TableRow key={school.id}>
                  <TableCell className="font-medium">{school.name}</TableCell>
                  <TableCell>{school.category}</TableCell>
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
        </CardContent>
      </Card>

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
    onSave: (data: Omit<School, 'id'>) => void;
    school: School | null;
}

function SchoolFormDialog({ isOpen, onClose, onSave, school }: SchoolFormDialogProps) {
    const [name, setName] = useState('');
    const [category, setCategory] = useState<SchoolCategory | undefined>();
    const [isSaving, setIsSaving] = useState(false);

    React.useEffect(() => {
        if(isOpen) {
            setName(school?.name || '');
            setCategory(school?.category);
        }
    }, [isOpen, school]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (name && category) {
            setIsSaving(true);
            await onSave({ name, category });
            setIsSaving(false);
        }
    };

    return (
         <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="font-headline text-3xl text-primary">{school ? 'Edit School' : 'Add New School'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-lg">School Name</Label>
                        <Input id="name" value={name} onChange={e => setName(e.target.value)} required className="text-base" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="category" className="text-lg">Category</Label>
                        <Select value={category} onValueChange={(value: SchoolCategory) => setCategory(value)} required>
                            <SelectTrigger id="category" className="text-base">
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
