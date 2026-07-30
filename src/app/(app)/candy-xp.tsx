import { Redirect, useRouter } from "expo-router";

import { CandyXpScreen } from "@/features/candy-xp/candy-xp-screen";
import { useAuth } from "@/providers/auth-provider";

export default function CandyXpRoute() {
  const router = useRouter();
  const { user } = useAuth();

  if (user?.role !== "STUDENT") {
    return <Redirect href="/home" />;
  }

  return <CandyXpScreen onBack={() => router.back()} />;
}
