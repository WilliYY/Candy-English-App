import { Redirect, useLocalSearchParams, useRouter } from "expo-router";

import { AdminUserDetailScreen } from "@/features/admin-users/admin-user-detail-screen";
import { useAuth } from "@/providers/auth-provider";

export default function AdminUserDetailRoute() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user } = useAuth();

  if (!user) return null;
  if (user.role !== "ADMIN") return <Redirect href="/home" />;
  if (!userId) return <Redirect href="/admin/users" />;

  return (
    <AdminUserDetailScreen
      onBack={() => router.back()}
      userId={userId}
    />
  );
}
