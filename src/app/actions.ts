
'use server';

import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { HomePageContent } from '@/lib/data';

const HOME_CONTENT_DOC_ID = 'homePageContent';

export async function getHomePageContent(): Promise<HomePageContent | null> {
  try {
    const homeContentDocRef = doc(db, 'settings', HOME_CONTENT_DOC_ID);
    const homeContentDoc = await getDoc(homeContentDocRef);
    if (homeContentDoc.exists()) {
      // The object from Firestore isn't a plain object, so we need to create one.
      const data = homeContentDoc.data();
      return {
        id: data.id,
        imageUrl: data.imageUrl,
        note: data.note,
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching home page content on the server:", error);
    // Return null or throw error, depending on desired behavior for errors
    return null;
  }
}
