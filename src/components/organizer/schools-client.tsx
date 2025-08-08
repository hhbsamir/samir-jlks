"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/page-header';
import type { School, SchoolCategory } from '@/lib/data';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';

export default function SchoolsClient() {
  const [schools, setSchools] = useState<School[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSchools = useCallback(async () => {
    setLoading(true);
    const schoolsCollection = collection(db, 'schools');
    const schoolsSnapshot = await getDocs(schoolsCollection);
    const schoolsList = schoolsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as School));
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

  return (
    <>
      <PageHeader title="Manage Schools">
        <Button onClick={() => openDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add School
        </Button>
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
