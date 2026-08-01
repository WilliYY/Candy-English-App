import { Redirect, useRouter } from "expo-router";

import { AdminFinanceActivityScreen } from "@/features/admin-finance/admin-finance-activity-screen";
import { useAuth } from "@/providers/auth-provider";

export default function AdminFinanceActivityRoute() {
  const router = useRouter();
  const { user } = useAuth();

  if (!user) return null;
  if (user.role !== "ADMIN") return <Redirect href="/home" />;

  return <AdminFinanceActivityScreen onBack={() => router.back()} />;
}
