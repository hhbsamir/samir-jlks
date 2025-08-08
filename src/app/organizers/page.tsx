
import LeaderboardClient from '@/components/organizer/leaderboard-client';
import { School, CompetitionCategory, Score, Feedback, Judge } from '@/lib/data';
import { db } from '@/lib/firebase';
import { collection, getDocs, Timestamp } from 'firebase/firestore';

async function getLeaderboardData() {
    const schoolsCollection = collection(db, 'schools');
    const schoolsSnapshot = await getDocs(schoolsCollection);
    const schools = schoolsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as School));

    const categoriesCollection = collection(db, 'categories');
    const categoriesSnapshot = await getDocs(categoriesCollection);
    const categories = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CompetitionCategory));

    const scoresCollection = collection(db, 'scores');
    const scoresSnapshot = await getDocs(scoresCollection);
    const scores = scoresSnapshot.docs.map(doc => doc.data() as Score);

    const feedbacksCollection = collection(db, 'feedbacks');
    const feedbacksSnapshot = await getDocs(feedbacksCollection);
    const feedbacks = feedbacksSnapshot.docs.map(doc => doc.data() as Feedback);
    
    const judgesCollection = collection(db, 'judges');
    const judgesSnapshot = await getDocs(judgesCollection);
    const judges = judgesSnapshot.docs.map(doc => {
        const data = doc.data();
        const createdAt = data.createdAt;
        const serializableCreatedAt = createdAt instanceof Timestamp ? createdAt.toMillis() : (createdAt || null);
        return { 
          id: doc.id, 
          ...data,
          createdAt: serializableCreatedAt,
        } as unknown as Judge;
    });

    return { schools, categories, scores, feedbacks, judges };
}

// Revalidate every 30 seconds
export const revalidate = 30;

export default async function OrganizersPage() {
  const { schools, categories, scores, feedbacks, judges } = await getLeaderboardData();

  return <LeaderboardClient 
    schools={schools}
    categories={categories}
    scores={scores}
    feedbacks={feedbacks}
    judges={judges}
  />;
}
