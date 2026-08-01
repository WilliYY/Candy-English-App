import { Redirect, useRouter } from "expo-router";

import { AdminContractsScreen } from "@/features/admin-contracts/admin-contracts-screen";
import { useAuth } from "@/providers/auth-provider";

export default function AdminContractsRoute() {
  const router = useRouter();
  const { user } = useAuth();

  if (!user) return null;
  if (user.role !== "ADMIN") return <Redirect href="/home" />;

  return (
    <AdminContractsScreen
      onBack={() => router.back()}
      onOpenContract={(contractId) =>
        router.push({
          params: { contractId },
          pathname: "/admin/contracts/[contractId]",
        })
      }
    />
  );
}
