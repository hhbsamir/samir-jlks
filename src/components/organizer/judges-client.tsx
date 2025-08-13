
"use client";

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/page-header';
import type { Judge } from '@/lib/data';
import { PlusCircle, Edit, Trash2, RefreshCw, User } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from '@/hooks/use-toast';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
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
    {...props}
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
  </svg>
);


export default function JudgesClient({ initialJudges }: { initialJudges: Judge[] }) {
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

  const handleSendWhatsApp = (judge: Judge) => {
    if (!judge.mobile || !judge.password) {
      toast({
        title: "Missing Information",
        description: "Judge's mobile number or password is not set.",
        variant: "destructive"
      });
      return;
    }

    const mobileNumber = judge.mobile.startsWith('91') ? judge.mobile : `91${judge.mobile}`;
    const message = `Namaskar 🙏 ${judge.name}, your password for the JLKS Paradip competition scoring app is: *${judge.password}*`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${mobileNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const handleSave = async (judgeData: Omit<Judge, 'id' | 'createdAt'>, photoFile: File | null) => {
    try {
        let photoURL = judgeData.photoURL;

        if (photoFile) {
            const storageRef = ref(storage, `judges/${photoFile.name}_${Date.now()}`);
            const snapshot = await uploadBytes(storageRef, photoFile);
            photoURL = await getDownloadURL(snapshot.ref);
        }

        const finalJudgeData = { ...judgeData, photoURL };
      
      if (editingJudge) {
        const judgeDoc = doc(db, "judges", editingJudge.id);
        await updateDoc(judgeDoc, finalJudgeData);
        toast({ title: "Success", description: "Judge updated successfully." });
      } else {
        await addDoc(collection(db, "judges"), { ...finalJudgeData, createdAt: serverTimestamp() });
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

  return (
    <TooltipProvider>
      <PageHeader title="Manage Judges">
        <Button onClick={() => openDialog()}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Judge
        </Button>
      </PageHeader>
      
      <Card>
        <CardContent className="pt-6">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judge</TableHead>
                  <TableHead>Mobile Number</TableHead>
                  <TableHead>Password</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialJudges.map(judge => (
                  <TableRow key={judge.id}>
                    <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={judge.photoURL} alt={judge.name} />
                                <AvatarFallback>
                                    <User />
                                </AvatarFallback>
                            </Avatar>
                            <span>{judge.name}</span>
                        </div>
                    </TableCell>
                    <TableCell>{judge.mobile}</TableCell>
                    <TableCell>
                      {judge.password || 'Not Set'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => handleSendWhatsApp(judge)}>
                            <WhatsAppIcon className="h-5 w-5 text-green-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Send Password via WhatsApp</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => openDialog(judge)}>
                              <Edit className="h-4 w-4 text-accent" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Edit Judge</p>
                          </TooltipContent>
                      </Tooltip>
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
          </div>
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
    onSave: (data: Omit<Judge, 'id' | 'createdAt'>, photoFile: File | null) => void;
    judge: Judge | null;
}

function JudgeFormDialog({ isOpen, onClose, onSave, judge }: JudgeFormDialogProps) {
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if(isOpen) {
            setName(judge?.name || '');
            setMobile(judge?.mobile || '');
            setPassword(judge?.password || '');
            setPhotoPreview(judge?.photoURL || null);
            setPhotoFile(null);
        }
    }, [isOpen, judge]);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setPhotoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhotoPreview(reader.result as string);
            }
            reader.readAsDataURL(file);
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !mobile) return;
        
        setIsSaving(true);
        try {
            await onSave({ name, mobile, password, photoURL: judge?.photoURL }, photoFile);
        } finally {
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
                    <DialogTitle className="font-headline text-2xl sm:text-3xl text-primary">{judge ? 'Edit Judge' : 'Add New Judge'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6 py-4">
                    <div className="flex flex-col items-center gap-4">
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handlePhotoChange}
                            className="hidden"
                        />
                         <Avatar className="h-32 w-32 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <AvatarImage src={photoPreview || undefined} alt={name} className="object-cover" />
                            <AvatarFallback className="h-32 w-32">
                                <User className="h-16 w-16" />
                            </AvatarFallback>
                        </Avatar>
                         <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                            Upload Photo
                        </Button>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-lg">Judge Name</Label>
                        <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="mobile" className="text-lg">Mobile Number</Label>
                        <Input id="mobile" value={mobile} onChange={e => setMobile(e.target.value)} required placeholder="Enter 10-digit number"/>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-lg">4-Digit Password</Label>
                        <div className="flex gap-2">
                            <Input 
                                id="password" 
                                value={password} 
                                onChange={e => setPassword(e.target.value)} 
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
