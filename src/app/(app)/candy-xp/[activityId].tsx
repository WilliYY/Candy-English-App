import { Redirect, useLocalSearchParams, useRouter } from "expo-router";

import { CandyXpActivityScreen } from "@/features/candy-xp/candy-xp-activity-screen";
import { useAuth } from "@/providers/auth-provider";

export default function CandyXpActivityRoute() {
  const router = useRouter();
  const { activityId } = useLocalSearchParams<{ activityId?: string }>();
  const { user } = useAuth();

  if (user?.role !== "STUDENT") {
    return <Redirect href="/home" />;
  }

  if (!activityId) {
    return <Redirect href="/candy-xp" />;
  }

  return (
    <CandyXpActivityScreen
      activityId={activityId}
      onBack={() => router.back()}
    />
  );
}
