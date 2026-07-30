import { Redirect, Stack } from "expo-router";

import { FullScreenLoader } from "@/components/full-screen-loader";
import { useAuth } from "@/providers/auth-provider";

export default function ProtectedLayout() {
  const { status } = useAuth();

  if (status === "loading") {
    return <FullScreenLoader />;
  }

  if (status === "anonymous") {
    return <Redirect href="/sign-in" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
