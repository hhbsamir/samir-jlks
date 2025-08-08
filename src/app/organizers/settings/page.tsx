
"use client";

import React, { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { db } from '@/lib/firebase';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleStartNewCompetition = async () => {
    setIsDeleting(true);
    try {
      const batch = writeBatch(db);

      // Delete all schools
      const schoolsCollection = collection(db, 'schools');
      const schoolsSnapshot = await getDocs(schoolsCollection);
      schoolsSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Delete all scores
      const scoresCollection = collection(db, 'scores');
      const scoresSnapshot = await getDocs(scoresCollection);
      scoresSnapshot.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      toast({
        title: "New Competition Started!",
        description: "All schools and scores have been successfully deleted.",
      });

    } catch (error) {
      console.error("Error starting new competition:", error);
      toast({
        title: "Error",
        description: "There was a problem resetting the competition data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <PageHeader title="Settings" />
      <Card>
        <CardHeader>
          <CardTitle>Reset Competition Data</CardTitle>
          <CardDescription>
            Starting a new competition will permanently delete all existing schools and scores. 
            Judges and Categories will not be affected. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                {isDeleting ? "Deleting Data..." : "Start New Competition"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action is irreversible. It will permanently delete all schools and all scores from the database. 
                  Are you sure you want to start a new competition?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleStartNewCompetition} className="bg-destructive hover:bg-destructive/90">
                  Yes, Delete Everything and Start Fresh
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </>
  );
}
