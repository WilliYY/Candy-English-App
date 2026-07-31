import { useRouter } from "expo-router";

import { LiveClassScreen } from "@/features/live-class/live-class-screen";
import { useAuth } from "@/providers/auth-provider";

export default function LiveClassRoute() {
  const router = useRouter();
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <LiveClassScreen
      onBack={() => router.back()}
      role={user.role}
    />
  );
}
