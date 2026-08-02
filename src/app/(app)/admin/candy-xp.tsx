import { Redirect, useRouter } from "expo-router";

import { AdminCandyXpScreen } from "@/features/admin-candy-xp/admin-candy-xp-screen";
import { useAuth } from "@/providers/auth-provider";

export default function AdminCandyXpRoute() {
  const router = useRouter();
  const { user } = useAuth();

  if (!user) return null;
  if (user.role !== "ADMIN") return <Redirect href="/home" />;

  return (
    <AdminCandyXpScreen
      onBack={() => router.back()}
      onOpenActivity={(activityId) =>
        router.push({
          params: { activityId },
          pathname: "/admin/candy-xp/[activityId]",
        })
      }
    />
  );
}
