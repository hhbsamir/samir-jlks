
import LeaderboardClient from '@/components/organizer/leaderboard-client';

// Revalidate every 30 seconds is no longer needed with real-time updates
// export const revalidate = 30;

export default function OrganizersPage() {
  // Data will now be fetched on the client-side in real-time
  return <LeaderboardClient />;
}
