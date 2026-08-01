import { Redirect, useLocalSearchParams, useRouter } from "expo-router";

import { AdminUserEditorScreen } from "@/features/admin-users/admin-user-editor-screen";
import { useAuth } from "@/providers/auth-provider";

export default function AdminEditUserRoute() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user } = useAuth();
  if (!user) return null;
  if (user.role !== "ADMIN") return <Redirect href="/home" />;
  if (!userId) return <Redirect href="/admin/users" />;

  return (
    <AdminUserEditorScreen
      onBack={() => router.back()}
      onSaved={() => router.replace({ params: { userId }, pathname: "/admin/user/[userId]" })}
      userId={userId}
    />
  );
}
