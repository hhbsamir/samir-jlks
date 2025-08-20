"use client";

import React from 'react';
import { useSearchParams } from 'next/navigation';
import RegistrationForm from '@/components/registration-form';

export default function EditRegistrationPage() {
    const searchParams = useSearchParams();
    const editId = searchParams.get('id');

    // The RegistrationForm component will handle fetching data if editId is present.
    // We just need to pass the ID to it.
    return <RegistrationForm editId={editId} />;
}
