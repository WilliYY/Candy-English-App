import { Redirect, useRouter } from "expo-router";

import { NotificationsScreen } from "@/features/notifications/notifications-screen";
import type { MobileNotificationTarget } from "@/lib/api/mobile-api-client";
import { useAuth } from "@/providers/auth-provider";

export default function NotificationsRoute() {
  const router = useRouter();
  const { user } = useAuth();

  if (user?.role !== "STUDENT") {
    return <Redirect href="/home" />;
  }

  function openTarget(target: MobileNotificationTarget) {
    if (target.kind === "LESSON" && target.id) {
      router.push({
        pathname: "/lesson/[lessonId]",
        params: { lessonId: target.id },
      });
      return;
    }

    if (target.kind === "HOMEWORK" && target.id) {
      router.push({
        pathname: "/homework/[homeworkId]",
        params: { homeworkId: target.id },
      });
      return;
    }

    router.push("/candy-xp");
  }

  return (
    <NotificationsScreen
      onBack={() => router.back()}
      onOpenTarget={openTarget}
    />
  );
}
