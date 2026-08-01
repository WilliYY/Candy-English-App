import { Redirect, useLocalSearchParams, useRouter } from "expo-router";

import { AdminPreRegistrationDetailScreen } from "@/features/admin-pre-registrations/admin-pre-registration-detail-screen";
import { useAuth } from "@/providers/auth-provider";

export default function AdminPreRegistrationDetailRoute() {
  const router = useRouter();
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const { user } = useAuth();

  if (!user) return null;
  if (user.role !== "ADMIN") return <Redirect href="/home" />;
  if (!requestId) return <Redirect href="/admin/pre-registrations" />;

  return (
    <AdminPreRegistrationDetailScreen
      onBack={() => router.back()}
      requestId={requestId}
    />
  );
}
