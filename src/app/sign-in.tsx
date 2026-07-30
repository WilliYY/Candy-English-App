import { Redirect, useRouter } from "expo-router";

import { FullScreenLoader } from "@/components/full-screen-loader";
import { SignInScreen } from "@/features/auth/sign-in-screen";
import { useAuth } from "@/providers/auth-provider";

export default function SignInRoute() {
  const router = useRouter();
  const { signIn, status } = useAuth();

  if (status === "loading") {
    return <FullScreenLoader />;
  }

  if (status === "authenticated") {
    return <Redirect href="/home" />;
  }

  return (
    <SignInScreen
      onBack={() => router.back()}
      onSubmit={({ email, password }) => signIn(email, password)}
    />
  );
}
