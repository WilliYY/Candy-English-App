import { Redirect, useLocalSearchParams, useRouter } from "expo-router";

import { AdminCandyXpActivityScreen } from "@/features/admin-candy-xp/admin-candy-xp-activity-screen";
import { useAuth } from "@/providers/auth-provider";

export default function AdminCandyXpActivityRoute() {
  const router = useRouter();
  const { activityId } = useLocalSearchParams<{ activityId?: string }>();
  const { user } = useAuth();

  if (!user) return null;
  if (user.role !== "ADMIN") return <Redirect href="/home" />;
  if (!activityId) return <Redirect href="/admin/candy-xp" />;

  return (
    <AdminCandyXpActivityScreen
      activityId={activityId}
      onBack={() => router.back()}
    />
  );
}
