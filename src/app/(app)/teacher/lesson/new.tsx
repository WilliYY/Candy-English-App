import { Redirect, useRouter } from "expo-router";

import { TeacherLessonEditorScreen } from "@/features/teacher-lessons/teacher-lesson-editor-screen";
import { useAuth } from "@/providers/auth-provider";

export default function NewTeacherLessonRoute() {
  const router = useRouter();
  const { user } = useAuth();

  if (user?.role !== "TEACHER") {
    return <Redirect href="/home" />;
  }

  return (
    <TeacherLessonEditorScreen
      mode="create"
      onBack={() => router.back()}
      onSaved={(lessonId) =>
        router.replace({
          params: { lessonId },
          pathname: "/lesson/[lessonId]",
        })
      }
    />
  );
}
