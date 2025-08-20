"use client";

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import RegistrationForm from '@/components/registration-form';
import { Loader2 } from 'lucide-react';

function EditRegistrationContent() {
    const searchParams = useSearchParams();
    const editId = searchParams.get('id');

    // The RegistrationForm component will handle fetching data if editId is present.
    // We just need to pass the ID to it.
    return <RegistrationForm editId={editId} />;
}


export default function EditRegistrationPage() {
  return (
    <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen bg-background">
            <div className="text-center">
                <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
                <p className="mt-4 text-muted-foreground">Loading Editor...</p>
            </div>
        </div>
    }>
      <EditRegistrationContent />
    </Suspense>
  );
}
