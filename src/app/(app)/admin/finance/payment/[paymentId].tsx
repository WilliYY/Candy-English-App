import { Redirect, useLocalSearchParams, useRouter } from "expo-router";

import { AdminFinancePaymentScreen } from "@/features/admin-finance/admin-finance-payment-screen";
import { useAuth } from "@/providers/auth-provider";

export default function AdminFinancePaymentRoute() {
  const router = useRouter();
  const { paymentId } = useLocalSearchParams<{ paymentId?: string }>();
  const { user } = useAuth();

  if (!user) return null;
  if (user.role !== "ADMIN") return <Redirect href="/home" />;
  if (!paymentId) return <Redirect href="/admin/finance" />;

  return (
    <AdminFinancePaymentScreen
      onBack={() => router.back()}
      paymentId={paymentId}
    />
  );
}
