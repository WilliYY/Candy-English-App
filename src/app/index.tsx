import { Redirect, useRouter } from "expo-router";

import { FullScreenLoader } from "@/components/full-screen-loader";
import { LaunchScreen } from "@/features/launch/launch-screen";
import { useAuth } from "@/providers/auth-provider";

export default function IndexRoute() {
  const router = useRouter();
  const { status } = useAuth();

  if (status === "loading") {
    return <FullScreenLoader />;
  }

  if (status === "authenticated") {
    return <Redirect href="/home" />;
  }

  return <LaunchScreen onSignIn={() => router.push("/sign-in")} />;
}
