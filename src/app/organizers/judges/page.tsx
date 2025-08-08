
import JudgesClient from '@/components/organizer/judges-client';
import type { Judge } from '@/lib/data';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

async function getJudges() {
    const judgesCollection = collection(db, 'judges');
    const judgesSnapshot = await getDocs(judgesCollection);
    const judgesList = judgesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Judge));
    
    judgesList.sort((a, b) => {
        const aTime = a.createdAt?.toMillis() ?? 0;
        const bTime = b.createdAt?.toMillis() ?? 0;
        if (aTime !== bTime) {
            return aTime - bTime;
        }
        return a.name.localeCompare(b.name);
    });
    return judgesList;
}

export default async function JudgesPage() {
  const judges = await getJudges();
  return <JudgesClient initialJudges={judges} />;
}
