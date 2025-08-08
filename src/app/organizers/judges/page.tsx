
import JudgesClient from '@/components/organizer/judges-client';
import type { Judge } from '@/lib/data';
import { db } from '@/lib/firebase';
import { collection, getDocs, Timestamp } from 'firebase/firestore';

async function getJudges(): Promise<Judge[]> {
    const judgesCollection = collection(db, 'judges');
    const judgesSnapshot = await getDocs(judgesCollection);
    const judgesList = judgesSnapshot.docs.map(doc => {
      const data = doc.data();
      const createdAt = data.createdAt;
      // Convert timestamp to a serializable format
      const serializableCreatedAt = createdAt instanceof Timestamp ? createdAt.toMillis() : (createdAt || null);

      return { 
        id: doc.id, 
        ...data,
        createdAt: serializableCreatedAt,
      } as unknown as Judge;
    });
    
    judgesList.sort((a, b) => {
        const aTime = a.createdAt ?? 0;
        const bTime = b.createdAt ?? 0;
        if (aTime !== bTime) {
            return aTime - bTime;
        }
        // a.name can be undefined for old data
        return (a.name || '').localeCompare(b.name || '');
    });
    return judgesList;
}

export default async function JudgesPage() {
  const judges = await getJudges();
  return <JudgesClient initialJudges={judges} />;
}
