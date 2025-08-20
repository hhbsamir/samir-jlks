
"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Loader2 } from 'lucide-react';
import RegistrationPage from '@/app/registration/page';
import { NavButtons } from '@/components/common/NavButtons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Registration } from '@/lib/data';

export default function EditRegistrationController() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const [registrationIdInput, setRegistrationIdInput] = useState('');
    const [registrationData, setRegistrationData] = useState<Registration | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [searchedId, setSearchedId] = useState<string | null>(searchParams.get('id'));

    // This effect runs if an ID is in the URL when the page loads
    useEffect(() => {
        const fetchInitialData = async () => {
            if (searchedId && !registrationData) {
                setIsLoading(true);
                try {
                    const docRef = doc(db, 'registrations', searchedId);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        setRegistrationData({ id: docSnap.id, ...docSnap.data() } as Registration);
                    } else {
                        toast({ title: "Not Found", description: "The registration you are trying to edit does not exist.", variant: "destructive" });
                        setSearchedId(null); // Clear invalid ID
                    }
                } catch (e) {
                    toast({ title: "Error", description: "Failed to load registration data.", variant: "destructive" });
                    setSearchedId(null); // Clear invalid ID
                } finally {
                    setIsLoading(false);
                }
            }
        };
        fetchInitialData();
    }, [searchedId, registrationData, toast]);


    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (registrationIdInput) {
            router.push(`/registration/edit?id=${registrationIdInput}`, { scroll: false });
            setSearchedId(registrationIdInput);
        }
    };

    // If we have registration data, show the form in edit mode
    if (registrationData && searchedId) {
        return <RegistrationPage editId={searchedId} initialData={registrationData} />;
    }

    // Otherwise, show the search form
    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <div className="absolute top-4 left-4 z-50">
                <NavButtons />
            </div>
            <Card className="w-full max-w-md mx-4">
                <CardHeader className="text-center">
                    <CardTitle className="font-headline text-3xl text-primary">Edit Registration</CardTitle>
                    <CardDescription>Enter your Registration ID to find and edit your submission.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSearch} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="registrationId">Registration ID</Label>
                            <Input
                                id="registrationId"
                                type="text"
                                placeholder="Paste your ID here"
                                value={registrationIdInput}
                                onChange={(e) => setRegistrationIdInput(e.target.value)}
                                required
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                           {isLoading ? <Loader2 className="mr-2 animate-spin"/> : <Search className="mr-2" />}
                           {isLoading ? 'Loading...' : 'Find Registration'}
                       </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
