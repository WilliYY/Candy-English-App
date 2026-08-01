import { Redirect, useRouter } from "expo-router";

import { AdminAgendaScreen } from "@/features/admin-agenda/admin-agenda-screen";
import { useAuth } from "@/providers/auth-provider";

export default function AdminAgendaRoute() {
  const router = useRouter();
  const { user } = useAuth();

  if (!user) return null;
  if (user.role !== "ADMIN") return <Redirect href="/home" />;

  return <AdminAgendaScreen onBack={() => router.back()} />;
}
