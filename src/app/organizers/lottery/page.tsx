
import LotteryClient from '@/components/organizer/lottery-client';
import type { School } from '@/lib/data';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

async function getSchools() {
    const schoolsCollection = collection(db, 'schools');
    const schoolsSnapshot = await getDocs(schoolsCollection);
    const schoolsList = schoolsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as School));
    return schoolsList;
}

export default async function LotteryPage() {
  const schools = await getSchools();
  return <LotteryClient initialSchools={schools} />;
}
