import { Redirect, useRouter } from "expo-router";

import { CandyXpScreen } from "@/features/candy-xp/candy-xp-screen";
import { TeacherCandyXpScreen } from "@/features/candy-xp/teacher-candy-xp-screen";
import { useAuth } from "@/providers/auth-provider";

export default function CandyXpRoute() {
  const router = useRouter();
  const { user } = useAuth();

  if (user?.role === "TEACHER") {
    return <TeacherCandyXpScreen onBack={() => router.back()} />;
  }

  if (user?.role !== "STUDENT") {
    return <Redirect href="/home" />;
  }

  return (
    <CandyXpScreen
      onBack={() => router.back()}
      onOpenActivity={(activityId) =>
        router.push({
          pathname: "/candy-xp/[activityId]",
          params: { activityId },
        })
      }
    />
  );
}
