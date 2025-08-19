
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
import { PlusCircle, Edit, Trash2, RefreshCw, Upload, User, Loader2, XCircle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useCompetitionData } from '@/app/organizers/layout';
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

// Function to call the delete API
async function deleteCloudinaryImage(publicId: string) {
    try {
        if (!publicId) {
            throw new Error("No public_id provided");
        }

        const response = await fetch('/api/delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicId, resourceType: 'image' }),
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Failed to delete image from Cloudinary.');
        }

        toast({ title: 'Success', description: 'Image deleted from Cloudinary.' });
        return true;
    } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
        toast({
            title: 'Deletion Failed',
            description: `Could not delete image. Reason: ${error instanceof Error ? error.message : 'Unknown error'}`,
            variant: 'destructive',
        });
        return false;
    }
}


export default function JudgesClient() {
  const { judges } = useCompetitionData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJudge, setEditingJudge] = useState<Judge | null>(null);

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

  const handleSave = async (judgeData: Partial<Omit<Judge, 'id' | 'createdAt'>>) => {
    try {
      if (editingJudge) {
        const judgeDoc = doc(db, "judges", editingJudge.id);
        await updateDoc(judgeDoc, judgeData);
        toast({ title: "Success", description: "Judge updated successfully." });
      } else {
        await addDoc(collection(db, "judges"), { ...judgeData, createdAt: serverTimestamp() });
        toast({ title: "Success", description: "Judge added successfully." });
      }
      closeDialog();
    } catch (error) {
      console.error("Error saving judge: ", error);
      toast({ title: "Error", description: "Could not save judge.", variant: "destructive" });
    }
  };
  
  const handleDelete = async (judge: Judge) => {
    try {
        // If judge has a photo, delete it from Cloudinary first
        const publicId = judge.imageUrl ? new URL(judge.imageUrl).pathname.split('/').pop()?.split('.')[0] : null;
        if (judge.imageUrl && publicId) {
           const publicIdWithFolder = 'jlks-paradip-uploads/' + publicId.split('/').pop();
           await deleteCloudinaryImage(publicIdWithFolder);
        }
        // Then delete the judge document from Firestore
        await deleteDoc(doc(db, "judges", judge.id));
        toast({ title: "Success", description: "Judge deleted successfully." });
    } catch(error) {
        console.error("Error deleting judge: ", error);
        toast({ title: "Error", description: "Could not delete judge.", variant: "destructive" });
    }
  }
  
  const sortedJudges = [...judges].sort((a, b) => {
    const aTime = a.createdAt ?? 0;
    const bTime = b.createdAt ?? 0;
    if (aTime !== bTime) {
        return aTime - bTime;
    }
    return (a.name || '').localeCompare(b.name || '');
  });

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
                  <TableHead>Photo</TableHead>
                  <TableHead>Judge Name</TableHead>
                  <TableHead>Mobile Number</TableHead>
                  <TableHead>Password</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedJudges.map(judge => (
                  <TableRow key={judge.id}>
                    <TableCell>
                      <Avatar>
                          {judge.imageUrl && <AvatarImage src={judge.imageUrl} alt={judge.name} />}
                          <AvatarFallback><User /></AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium">
                        {judge.name}
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
                              This action cannot be undone. This will permanently delete the judge and their photo from Cloudinary.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(judge)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
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
    onSave: (data: Partial<Omit<Judge, 'id' | 'createdAt'>>) => void;
    judge: Judge | null;
}

function JudgeFormDialog({ isOpen, onClose, onSave, judge }: JudgeFormDialogProps) {
    const [name, setName] = useState('');
    const [mobile, setMobile] = useState('');
    const [password, setPassword] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [imagePublicId, setImagePublicId] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if(isOpen) {
            const publicId = judge?.imageUrl ? new URL(judge.imageUrl).pathname.split('/').pop()?.split('.')[0] : '';
            setName(judge?.name || '');
            setMobile(judge?.mobile || '');
            setPassword(judge?.password || '');
            setImageUrl(judge?.imageUrl || '');
            setImagePublicId(publicId || '');
        }
    }, [isOpen, judge]);

    const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (file.size > 50 * 1024) { // 50 KB size limit
          toast({
              title: 'File Too Large',
              description: 'Please upload an image smaller than 50 KB.',
              variant: 'destructive',
          });
          return;
      }

      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      try {
        // If there was an old image, delete it from Cloudinary
        if(imagePublicId) {
            const publicIdWithFolder = 'jlks-paradip-uploads/' + imagePublicId;
            await deleteCloudinaryImage(publicIdWithFolder);
        }

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (data.success) {
          setImageUrl(data.url);
          setImagePublicId(data.public_id);
          toast({ title: 'Photo uploaded successfully!' });
        } else {
          throw new Error(data.error || 'Upload failed');
        }
      } catch (error) {
        console.error('Error uploading photo:', error);
        toast({
          title: 'Upload Failed',
          description: 'Could not upload the photo. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsUploading(false);
      }
    };

    const handleRemoveImage = async () => {
        if (!imagePublicId) return;
        setIsRemoving(true);
        const success = await deleteCloudinaryImage(imagePublicId);
        if (success) {
            setImageUrl('');
            setImagePublicId('');
        }
        setIsRemoving(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !mobile) return;
        
        setIsSaving(true);
        try {
            await onSave({ name, mobile, password, imageUrl });
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
                    <div className="space-y-2">
                        <Label>Judge Photo</Label>
                        <div className="flex items-center gap-4">
                          <Avatar className="h-20 w-20">
                             {imageUrl && <AvatarImage src={imageUrl} alt="Judge photo" />}
                            <AvatarFallback>
                              <User className="h-10 w-10" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col gap-2">
                            <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />
                            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading || isRemoving}>
                                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                {isUploading ? 'Uploading...' : 'Upload'}
                            </Button>
                            {imageUrl && (
                                <Button type="button" variant="destructive" size="sm" onClick={handleRemoveImage} disabled={isUploading || isRemoving}>
                                    {isRemoving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <XCircle className="mr-2 h-4 w-4" />}
                                    Remove
                                </Button>
                            )}
                            <p className="text-xs text-muted-foreground">Max file size: 50 KB.</p>
                          </div>
                        </div>
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
                            <Button type="button" variant="ghost" disabled={isSaving || isUploading || isRemoving}>Cancel</Button>
                         </DialogClose>
                        <Button type="submit" disabled={isSaving || isUploading || isRemoving}>{isSaving ? 'Saving...' : 'Save Judge'}</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
