import { Redirect, useRouter } from "expo-router";

import { ProfileScreen } from "@/features/profile/profile-screen";
import { useAuth } from "@/providers/auth-provider";

export default function ProfileRoute() {
  const router = useRouter();
  const { refreshUser, user } = useAuth();

  if (user?.role !== "STUDENT") {
    return <Redirect href="/home" />;
  }

  return (
    <ProfileScreen
      onBack={() => router.back()}
      refreshUser={refreshUser}
    />
  );
}
