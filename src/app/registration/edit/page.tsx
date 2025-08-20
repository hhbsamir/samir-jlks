
"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';
import RegistrationPage from '@/app/registration/page';
import { NavButtons } from '@/components/common/NavButtons';

export default function EditRegistrationSearchPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [registrationIdInput, setRegistrationIdInput] = useState('');
    
    // The ID is stored in the component's state. It can be set from the URL or the search input.
    const [editId, setEditId] = useState<string | null>(searchParams.get('id'));

    // This effect ensures that if the user pastes a URL with an ID, it's used.
    useEffect(() => {
        const idFromUrl = searchParams.get('id');
        if (idFromUrl) {
            setEditId(idFromUrl);
        }
    }, [searchParams]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (registrationIdInput) {
            // Update the URL and the state to trigger the edit view
            router.push(`/registration/edit?id=${registrationIdInput}`, { scroll: false });
            setEditId(registrationIdInput);
        }
    };

    // If an ID is present (from URL or search), show the main registration page in edit mode.
    if (editId) {
        return <RegistrationPage editId={editId} />;
    }

    // Otherwise, show the search form.
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
                        <Button type="submit" className="w-full">
                           <Search className="mr-2" /> Find Registration
                       </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
