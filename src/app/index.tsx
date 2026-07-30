import { useRouter } from "expo-router";

import { LaunchScreen } from "@/features/launch/launch-screen";

export default function IndexRoute() {
  const router = useRouter();

  return <LaunchScreen onSignIn={() => router.push("/sign-in")} />;
}
