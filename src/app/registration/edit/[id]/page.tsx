
"use client"

import RegistrationPage from "@/app/registration/page";

export default function EditRegistrationPage({ params }: { params: { id: string } }) {
  return <RegistrationPage editId={params.id} />;
}
