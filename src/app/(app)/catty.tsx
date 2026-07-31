import { useRouter } from "expo-router";

import { CattyScreen } from "@/features/catty/catty-screen";
import { useAuth } from "@/providers/auth-provider";

export default function CattyRoute() {
  const router = useRouter();
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <CattyScreen
      onBack={() => router.back()}
      role={user.role}
    />
  );
}
