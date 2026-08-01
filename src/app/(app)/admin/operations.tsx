import { Redirect, useRouter } from "expo-router";

import { AdminOperationsScreen } from "@/features/admin-operations/admin-operations-screen";
import { useAuth } from "@/providers/auth-provider";

export default function AdminOperationsRoute() {
  const router = useRouter();
  const { user } = useAuth();

  if (!user) return null;
  if (user.role !== "ADMIN") return <Redirect href="/home" />;

  return <AdminOperationsScreen onBack={() => router.back()} />;
}
