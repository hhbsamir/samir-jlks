
"use client";

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';
import RegistrationPage from '@/app/registration/page';
import { NavButtons } from '@/components/common/NavButtons';

export default function EditRegistrationSearchPage() {
    const searchParams = useSearchParams();
    const [registrationId, setRegistrationId] = useState('');
    
    // We get the ID from the URL search params on initial load or from the user's search.
    const [searchedId, setSearchedId] = useState<string | null>(searchParams.get('id'));

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (registrationId) {
            // Update the state to trigger re-render with the RegistrationPage
            setSearchedId(registrationId);
        }
    };

    // If an ID has been searched for (or was in the URL), show the main registration page in edit mode.
    if (searchedId) {
        return <RegistrationPage editId={searchedId} />;
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
                                value={registrationId}
                                onChange={(e) => setRegistrationId(e.target.value)}
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
