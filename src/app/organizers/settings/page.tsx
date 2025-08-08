import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" />
      <Card>
        <CardHeader>
          <CardTitle>Application Settings</CardTitle>
          <CardDescription>Manage your application settings here. More options will be available soon.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This page is under construction.</p>
        </CardContent>
      </Card>
    </>
  );
}
