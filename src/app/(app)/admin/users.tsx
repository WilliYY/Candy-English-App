import { Redirect, useRouter } from "expo-router";

import { AdminUsersScreen } from "@/features/admin-users/admin-users-screen";
import { useAuth } from "@/providers/auth-provider";

export default function AdminUsersRoute() {
  const router = useRouter();
  const { user } = useAuth();

  if (!user) return null;
  if (user.role !== "ADMIN") return <Redirect href="/home" />;

  return (
    <AdminUsersScreen
      onBack={() => router.back()}
      onOpenUser={(userId) =>
        router.push({
          params: { userId },
          pathname: "/admin/user/[userId]",
        })
      }
    />
  );
}
