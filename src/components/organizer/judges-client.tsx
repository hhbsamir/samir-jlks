
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/page-header';
import type { Judge } from '@/lib/data';
import { PlusCircle, Edit, Trash2, RefreshCw } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useRouter } from 'next/navigation';


const WhatsAppIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 text-green-500"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
);


export default function JudgesClient({ initialJudges }: { initialJudges: Judge[] }) {
  const [judges, setJudges] = useState<Judge[]>(initialJudges);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJudge, setEditingJudge] = useState<Judge | null>(null);
  const router = useRouter();

  const refreshData = () => {
    router.refresh();
  };

  const openDialog = (judge: Judge | null = null) => {
    setEditingJudge(judge);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingJudge(null);
  };

  const handleSave = async (judgeData: Omit<Judge, 'id' | 'createdAt'>) => {
    try {
      if (editingJudge) {
        const judgeDoc = doc(db, "judges", editingJudge.id);
        await updateDoc(judgeDoc, { ...judgeData });
        toast({ title: "Success", description: "Judge updated successfully." });
      } else {
        await addDoc(collection(db, "judges"), { ...judgeData, createdAt: serverTimestamp() });
        toast({ title: "Success", description: "Judge added successfully." });
      }
      refreshData();
      closeDialog();
    } catch (error) {
      console.error("Error saving judge: ", error);
      toast({ title: "Error", description: "Could not save judge.", variant: "destructive" });
    }
  };
  
  const handleDelete = async (judgeId: string) => {
    try {
        await deleteDoc(doc(db, "judges", judgeId));
        toast({ title: "Success", description: "Judge deleted successfully." });
        refreshData();
    } catch(error) {
        console.error("Error deleting judge: ", error);
        toast({ title: "Error", description: "Could not delete judge.", variant: "destructive" });
    }
  }

  const handleSendWhatsApp = (judge: Judge) => {
    if (!judge.mobile || !judge.password) {
        toast({
            title: "Missing Information",
            description: "Judge's mobile number or password is not set.",
            variant: "destructive"
        });
        return;
    }
    const message = `Namaste ${judge.name}, your password for the JLKS Paradip competition is: *${judge.password}*`;
    // The '91' is the country code for India.
    const whatsappUrl = `https://wa.me/91${judge.mobile}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }


  return (
    <TooltipProvider>
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
                <TableHead>Password</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialJudges.map(judge => (
                <TableRow key={judge.id}>
                  <TableCell className="font-medium">{judge.name}</TableCell>
                  <TableCell>{judge.mobile}</TableCell>
                  <TableCell>
                    {judge.password || 'Not Set'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={() => handleSendWhatsApp(judge)} className="mr-2">
                          <WhatsAppIcon />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Send via WhatsApp</p>
                      </TooltipContent>
                    </Tooltip>
                    
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
    </TooltipProvider>
  );
}

type JudgeFormDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<Judge, 'id' | 'createdAt'>) => void;
    judge: Judge | null;
}

function JudgeFormDialog({ isOpen, onClose, onSave, judge }: JudgeFormDialogProps) {
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    React.useEffect(() => {
        if(isOpen) {
            setName(judge?.name || '');
            setMobile(judge?.mobile || '');
            setPassword(judge?.password || '');
        }
    }, [isOpen, judge]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (name && mobile) {
            setIsSaving(true);
            await onSave({ name, mobile, password });
            setIsSaving(false);
        }
    };

    const generateRandomPassword = () => {
        const randomPassword = Math.floor(1000 + Math.random() * 9000).toString();
        setPassword(randomPassword);
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
                        <Input id="mobile" value={mobile} onChange={e => setMobile(e.target.value)} required className="text-base" placeholder="Enter 10-digit number"/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-lg">4-Digit Password</Label>
                        <div className="flex gap-2">
                            <Input 
                                id="password" 
                                value={password} 
                                onChange={e => setPassword(e.target.value)} 
                                className="text-base"
                                maxLength={4}
                                placeholder="Enter 4-digit password"
                            />
                            <Button type="button" variant="outline" onClick={generateRandomPassword}>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Generate
                            </Button>
                        </div>
                    </div>
                     <DialogFooter>
                         <DialogClose asChild>
                            <Button type="button" variant="ghost" disabled={isSaving}>Cancel</Button>
                         </DialogClose>
                        <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Save Judge'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
