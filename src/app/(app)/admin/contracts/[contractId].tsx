import { Redirect, useLocalSearchParams, useRouter } from "expo-router";

import { ContractScreen } from "@/features/contracts/contract-screen";
import { getMobileApi } from "@/lib/api/mobile-api";
import { useAuth } from "@/providers/auth-provider";

export default function AdminContractRoute() {
  const router = useRouter();
  const { contractId } = useLocalSearchParams<{ contractId?: string }>();
  const { user } = useAuth();

  if (!user) return null;
  if (user.role !== "ADMIN") return <Redirect href="/home" />;

  const id = contractId ?? "";
  return (
    <ContractScreen
      contractId={id}
      loadContract={() => getMobileApi().getAdminContract(id)}
      onBack={() => router.back()}
    />
  );
}
