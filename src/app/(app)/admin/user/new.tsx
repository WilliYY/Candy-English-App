import { Redirect, useRouter } from "expo-router";

import { AdminUserEditorScreen } from "@/features/admin-users/admin-user-editor-screen";
import { useAuth } from "@/providers/auth-provider";

export default function AdminNewUserRoute() {
  const router = useRouter();
  const { user } = useAuth();
  if (!user) return null;
  if (user.role !== "ADMIN") return <Redirect href="/home" />;

  return (
    <AdminUserEditorScreen
      onBack={() => router.back()}
      onSaved={(userId) =>
        router.replace({ params: { userId }, pathname: "/admin/user/[userId]" })
      }
    />
  );
}
