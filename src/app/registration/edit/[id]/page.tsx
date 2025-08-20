
"use client"

// This file is no longer needed with the new edit flow, but we keep it
// to prevent breaking any old links immediately. It will redirect to the new flow.
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function OldEditRedirectPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new edit page, passing the ID as a query parameter.
    router.replace(`/registration/edit?id=${params.id}`);
  }, [params.id, router]);

  // You can show a loading spinner here while redirecting
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecting to the new edit page...</p>
    </div>
  );
}
