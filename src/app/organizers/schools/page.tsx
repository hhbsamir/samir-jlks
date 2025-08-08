
import SchoolsClient from '@/components/organizer/schools-client';
import type { School } from '@/lib/data';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

async function getSchools() {
    const schoolsCollection = collection(db, 'schools');
    const schoolsSnapshot = await getDocs(schoolsCollection);
    const schoolsList = schoolsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as School));
    return schoolsList;
}

export default async function SchoolsPage() {
  const schools = await getSchools();
  return <SchoolsClient initialSchools={schools} />;
}
