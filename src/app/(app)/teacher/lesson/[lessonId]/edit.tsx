import { Redirect, useLocalSearchParams, useRouter } from "expo-router";

import { TeacherLessonEditorScreen } from "@/features/teacher-lessons/teacher-lesson-editor-screen";
import { useAuth } from "@/providers/auth-provider";

export default function EditTeacherLessonRoute() {
  const router = useRouter();
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const { user } = useAuth();

  if (user?.role !== "TEACHER") {
    return <Redirect href="/home" />;
  }

  return (
    <TeacherLessonEditorScreen
      lessonId={lessonId ?? ""}
      mode="edit"
      onBack={() => router.back()}
      onSaved={(savedLessonId) =>
        router.replace({
          params: { lessonId: savedLessonId },
          pathname: "/lesson/[lessonId]",
        })
      }
    />
  );
}
