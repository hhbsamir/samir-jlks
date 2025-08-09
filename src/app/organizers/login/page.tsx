
"use client";

import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { app } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogIn } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const auth = getAuth(app);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            toast({
                title: 'Login Successful',
                description: 'Welcome back!',
            });
            // The layout will automatically redirect to the dashboard
        } catch (error: any) {
            toast({
                title: 'Login Failed',
                description: "Invalid email or password. Please try again.",
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Card className="w-full max-w-md mx-4">
                <CardHeader className="text-center">
                    <CardTitle className="font-headline text-3xl text-primary">Organizer Login</CardTitle>
                    <CardDescription>Enter your credentials to access the dashboard.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="organizer@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row-reverse gap-2">
                           <Button type="submit" className="w-full" disabled={isLoading}>
                               {isLoading ? (
                                   <><Loader2 className="animate-spin" /> Authenticating...</>
                               ) : (
                                   <><LogIn /> Login</>
                               )}
                           </Button>
                           <Button type="button" variant="outline" asChild>
                               <Link href="/">Go to Home</Link>
                           </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
