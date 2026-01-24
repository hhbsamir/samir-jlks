
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/page-header';
import type { CompetitionCategory } from '@/lib/data';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { useCompetitionData } from '@/app/organizers/layout';

export default function CategoriesClient() {
  const { categories: unsortedCategories } = useCompetitionData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CompetitionCategory | null>(null);

  const categories = React.useMemo(() => [...unsortedCategories].sort((a, b) => {
    const aSerial = a.serialNumber;
    const bSerial = b.serialNumber;
    if (aSerial != null && bSerial != null) {
        if (aSerial !== bSerial) {
            return aSerial - bSerial;
        }
    } else if (aSerial != null) {
        return -1;
    } else if (bSerial != null) {
        return 1;
    }
    return a.name.localeCompare(b.name);
  }), [unsortedCategories]);

  const openDialog = (category: CompetitionCategory | null = null) => {
    setEditingCategory(category);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
  };

  const handleSave = async (categoryData: Omit<CompetitionCategory, 'id'>) => {
    try {
      const dataToSave: any = { ...categoryData };
      if (categoryData.totalMarks === undefined) {
        dataToSave.totalMarks = null;
      }
      if (categoryData.serialNumber === undefined) {
        dataToSave.serialNumber = null;
      }

      if (editingCategory) {
        const categoryDoc = doc(db, "categories", editingCategory.id);
        await updateDoc(categoryDoc, dataToSave);
        toast({ title: "Success", description: "Category updated successfully." });
      } else {
        await addDoc(collection(db, "categories"), dataToSave);
        toast({ title: "Success", description: "Category added successfully." });
      }
      closeDialog();
    } catch (error) {
      console.error("Error saving category: ", error);
      toast({ title: "Error", description: "Could not save category.", variant: "destructive" });
    }
  };

  const handleDelete = async (categoryId: string) => {
    try {
      await deleteDoc(doc(db, "categories", categoryId));
      toast({ title: "Success", description: "Category deleted successfully." });
    } catch (error) {
      console.error("Error deleting category: ", error);
      toast({ title: "Error", description: "Could not delete category.", variant: "destructive" });
    }
  }

  return (
    <>
      <PageHeader title="Manage Categories">
        <Button onClick={() => openDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </PageHeader>
      
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category Name</TableHead>
                <TableHead>Serial No.</TableHead>
                <TableHead>Total Marks</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map(category => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>{category.serialNumber ?? 'N/A'}</TableCell>
                  <TableCell>{category.totalMarks ?? 10}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openDialog(category)}>
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
                            This action cannot be undone. This will permanently delete the category and all associated scores.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(category.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
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

      <CategoryFormDialog 
        isOpen={isDialogOpen} 
        onClose={closeDialog} 
        onSave={handleSave}
        category={editingCategory} 
      />
    </>
  );
}

type CategoryFormDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<CompetitionCategory, 'id'>) => void;
    category: CompetitionCategory | null;
}

function CategoryFormDialog({ isOpen, onClose, onSave, category }: CategoryFormDialogProps) {
    const [name, setName] = useState('');
    const [totalMarks, setTotalMarks] = useState('');
    const [serialNumber, setSerialNumber] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    React.useEffect(() => {
        if(isOpen) {
            setName(category?.name || '');
            setTotalMarks(category?.totalMarks?.toString() || '10');
            setSerialNumber(category?.serialNumber?.toString() || '');
        }
    }, [isOpen, category]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (name) {
            setIsSaving(true);
            await onSave({ 
                name, 
                totalMarks: totalMarks ? parseInt(totalMarks, 10) : undefined,
                serialNumber: serialNumber ? parseInt(serialNumber, 10) : undefined,
            });
            setIsSaving(false);
        }
    };

    return (
         <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="font-headline text-2xl sm:text-3xl text-primary">{category ? 'Edit Category' : 'Add New Category'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-lg">Category Name</Label>
                        <Input id="name" value={name} onChange={e => setName(e.target.value)} required/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="serialNumber" className="text-lg">Serial Number</Label>
                        <Input id="serialNumber" type="number" value={serialNumber} onChange={e => setSerialNumber(e.target.value)} placeholder="Optional, for ordering" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="totalMarks" className="text-lg">Total Marks</Label>
                        <Input id="totalMarks" type="number" value={totalMarks} onChange={e => setTotalMarks(e.target.value)} placeholder="e.g., 10" required />
                    </div>
                     <DialogFooter>
                         <DialogClose asChild>
                            <Button type="button" variant="ghost" disabled={isSaving}>Cancel</Button>
                         </DialogClose>
                        <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Category'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
