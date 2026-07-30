import { useLocalSearchParams, useRouter } from "expo-router";

import { ContractScreen } from "@/features/contracts/contract-screen";

export default function ContractRoute() {
  const router = useRouter();
  const { contractId } = useLocalSearchParams<{ contractId: string }>();

  return (
    <ContractScreen
      contractId={contractId ?? ""}
      onBack={() => router.back()}
    />
  );
}
