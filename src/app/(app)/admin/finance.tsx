import { Redirect, useRouter } from "expo-router";

import { AdminFinanceScreen } from "@/features/admin-finance/admin-finance-screen";
import { useAuth } from "@/providers/auth-provider";

export default function AdminFinanceRoute() {
  const router = useRouter();
  const { user } = useAuth();

  if (!user) return null;
  if (user.role !== "ADMIN") return <Redirect href="/home" />;

  return <AdminFinanceScreen onBack={() => router.back()} />;
}
