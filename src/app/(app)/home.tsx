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
      onOpenModule={(slug) => {
        if (user.role === "ADMIN" && slug === "users") {
          router.push("/admin/users");
          return;
        }

        if (user.role === "ADMIN" && slug === "secretary") {
          router.push("/admin/pre-registrations");
          return;
        }

        if (user.role === "ADMIN" && slug === "finance") {
          router.push("/admin/finance");
          return;
        }

        if (user.role === "ADMIN" && slug === "agenda") {
          router.push("/admin/agenda");
          return;
        }

        if (user.role === "ADMIN" && slug === "contracts") {
          router.push("/admin/contracts");
          return;
        }

        if (user.role === "ADMIN" && slug === "operations") {
          router.push("/admin/operations");
          return;
        }

        if (slug === "live-class") {
          router.push("/live-class");
          return;
        }

        if (slug === "notifications") {
          router.push("/notifications");
          return;
        }

        if (slug === "catty") {
          router.push("/catty");
          return;
        }

        if (slug === "messages") {
          router.push("/chat");
          return;
        }

        if (slug === "profile") {
          router.push("/profile");
          return;
        }

        if (slug === "xp") {
          router.push("/candy-xp");
          return;
        }

        router.push({ pathname: "/module/[slug]", params: { slug } });
      }}
      onSignOut={signOut}
      role={user.role}
    />
  );
}
