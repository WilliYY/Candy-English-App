import { Redirect, useLocalSearchParams, useRouter } from "expo-router";

import { AdminAgendaLessonScreen } from "@/features/admin-agenda/admin-agenda-lesson-screen";
import { useAuth } from "@/providers/auth-provider";

export default function AdminAgendaLessonRoute() {
  const router = useRouter();
  const { lessonId } = useLocalSearchParams<{ lessonId?: string }>();
  const { user } = useAuth();

  if (!user) return null;
  if (user.role !== "ADMIN") return <Redirect href="/home" />;
  if (!lessonId) return <Redirect href="/admin/agenda" />;

  return (
    <AdminAgendaLessonScreen
      lessonId={lessonId}
      onBack={() => router.back()}
    />
  );
}
