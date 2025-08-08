"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/page-header';
import type { Judge } from '@/lib/data';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function JudgesClient() {
  const [judges, setJudges] = useState<Judge[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJudge, setEditingJudge] = useState<Judge | null>(null);

  useEffect(() => {
    const fetchJudges = async () => {
      const judgesCollection = collection(db, 'judges');
      const judgesSnapshot = await getDocs(judgesCollection);
      const judgesList = judgesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Judge));
      setJudges(judgesList);
    };

    fetchJudges();
  }, []);

  const openDialog = (judge: Judge | null = null) => {
    setEditingJudge(judge);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingJudge(null);
  };

  const handleSave = (judgeData: Omit<Judge, 'id'>) => {
    if (editingJudge) {
      setJudges(judges.map(j => j.id === editingJudge.id ? { ...editingJudge, ...judgeData } : j));
    } else {
      const newJudge = { id: `jud${Date.now()}`, ...judgeData };
      setJudges([...judges, newJudge]);
    }
    closeDialog();
  };
  
  const handleDelete = (judgeId: string) => {
      setJudges(judges.filter(j => j.id !== judgeId));
  }


  return (
    <>
      <PageHeader title="Manage Judges">
        <Button onClick={() => openDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Judge
        </Button>
      </PageHeader>
      
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Judge Name</TableHead>
                <TableHead>Mobile Number</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {judges.map(judge => (
                <TableRow key={judge.id}>
                  <TableCell className="font-medium">{judge.name}</TableCell>
                  <TableCell>{judge.mobile}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openDialog(judge)}>
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
                            This action cannot be undone. This will permanently delete the judge and all associated scores.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(judge.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
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

      <JudgeFormDialog 
        isOpen={isDialogOpen} 
        onClose={closeDialog} 
        onSave={handleSave}
        judge={editingJudge} 
      />
    </>
  );
}

type JudgeFormDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<Judge, 'id'>) => void;
    judge: Judge | null;
}

function JudgeFormDialog({ isOpen, onClose, onSave, judge }: JudgeFormDialogProps) {
    const [name, setName] = useState(judge?.name || '');
    const [mobile, setMobile] = useState(judge?.mobile || '');

    React.useEffect(() => {
        if(isOpen) {
            setName(judge?.name || '');
            setMobile(judge?.mobile || '');
        }
    }, [isOpen, judge]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name && mobile) {
            onSave({ name, mobile });
        }
    };

    return (
         <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="font-headline text-3xl text-primary">{judge ? 'Edit Judge' : 'Add New Judge'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-lg">Judge Name</Label>
                        <Input id="name" value={name} onChange={e => setName(e.target.value)} required className="text-base"/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="mobile" className="text-lg">Mobile Number</Label>
                        <Input id="mobile" value={mobile} onChange={e => setMobile(e.target.value)} required className="text-base"/>
                    </div>
                     <DialogFooter>
                         <DialogClose asChild>
                            <Button type="button" variant="ghost">Cancel</Button>
                         </DialogClose>
                        <Button type="submit">Save Judge</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
