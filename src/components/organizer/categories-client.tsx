
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
import { useRouter } from 'next/navigation';

export default function CategoriesClient({ initialCategories }: { initialCategories: CompetitionCategory[] }) {
  const [categories, setCategories] = useState<CompetitionCategory[]>(initialCategories);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CompetitionCategory | null>(null);
  const router = useRouter();

  const refreshData = () => {
    router.refresh();
  };

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
      if (editingCategory) {
        const categoryDoc = doc(db, "categories", editingCategory.id);
        await updateDoc(categoryDoc, categoryData);
        toast({ title: "Success", description: "Category updated successfully." });
      } else {
        await addDoc(collection(db, "categories"), categoryData);
        toast({ title: "Success", description: "Category added successfully." });
      }
      refreshData();
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
      setCategories(categories.filter(c => c.id !== categoryId));
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map(category => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
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
    const [isSaving, setIsSaving] = useState(false);

    React.useEffect(() => {
        if(isOpen) {
            setName(category?.name || '');
        }
    }, [isOpen, category]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (name) {
            setIsSaving(true);
            await onSave({ name });
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
