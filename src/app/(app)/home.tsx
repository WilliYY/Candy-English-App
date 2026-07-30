import { useRouter } from "expo-router";

import { DashboardScreen } from "@/features/dashboard/dashboard-screen";
import { useAuth } from "@/providers/auth-provider";

export default function HomeRoute() {
  const router = useRouter();
  const { signOut, user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <DashboardScreen
      name={user.name}
      onOpenModule={(slug) =>
        router.push({ pathname: "/module/[slug]", params: { slug } })
      }
      onSignOut={signOut}
      role={user.role}
    />
  );
}
