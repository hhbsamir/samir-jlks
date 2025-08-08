"use client";

import React, { useState, useEffect } from 'react';
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
import { collection, getDocs } from 'firebase/firestore';


export default function CategoriesClient() {
  const [categories, setCategories] = useState<CompetitionCategory[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CompetitionCategory | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      const categoriesCollection = collection(db, 'categories');
      const categoriesSnapshot = await getDocs(categoriesCollection);
      const categoriesList = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CompetitionCategory));
      setCategories(categoriesList);
    };

    fetchCategories();
  }, []);

  const openDialog = (category: CompetitionCategory | null = null) => {
    setEditingCategory(category);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingCategory(null);
  };

  const handleSave = (categoryData: Omit<CompetitionCategory, 'id'>) => {
    if (editingCategory) {
      setCategories(categories.map(c => c.id === editingCategory.id ? { ...editingCategory, ...categoryData } : c));
    } else {
      const newCategory = { id: `cat${Date.now()}`, ...categoryData };
      setCategories([...categories, newCategory]);
    }
    closeDialog();
  };

  const handleDelete = (categoryId: string) => {
      setCategories(categories.filter(c => c.id !== categoryId));
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
    const [name, setName] = useState(category?.name || '');

    React.useEffect(() => {
        if(isOpen) {
            setName(category?.name || '');
        }
    }, [isOpen, category]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name) {
            onSave({ name });
        }
    };

    return (
         <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="font-headline text-3xl text-primary">{category ? 'Edit Category' : 'Add New Category'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-lg">Category Name</Label>
                        <Input id="name" value={name} onChange={e => setName(e.target.value)} required className="text-base"/>
                    </div>
                     <DialogFooter>
                         <DialogClose asChild>
                            <Button type="button" variant="ghost">Cancel</Button>
                         </DialogClose>
                        <Button type="submit">Save Category</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
