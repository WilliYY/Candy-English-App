import { Redirect, useRouter } from "expo-router";

import { AdminPreRegistrationsScreen } from "@/features/admin-pre-registrations/admin-pre-registrations-screen";
import { useAuth } from "@/providers/auth-provider";

export default function AdminPreRegistrationsRoute() {
  const router = useRouter();
  const { user } = useAuth();

  if (!user) return null;
  if (user.role !== "ADMIN") return <Redirect href="/home" />;

  return (
    <AdminPreRegistrationsScreen
      onBack={() => router.back()}
      onOpenPreRegistration={(requestId) =>
        router.push({
          params: { requestId },
          pathname: "/admin/pre-registration/[requestId]",
        })
      }
    />
  );
}
