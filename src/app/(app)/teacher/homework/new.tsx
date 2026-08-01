import { Redirect, useLocalSearchParams, useRouter } from "expo-router";

import { TeacherHomeworkEditorScreen } from "@/features/teacher-homeworks/teacher-homework-editor-screen";
import { useAuth } from "@/providers/auth-provider";

export default function NewTeacherHomeworkRoute() {
  const router = useRouter();
  const { lessonId } = useLocalSearchParams<{ lessonId?: string }>();
  const { user } = useAuth();

  if (user?.role !== "TEACHER") return <Redirect href="/home" />;

  return (
    <TeacherHomeworkEditorScreen
      lessonId={lessonId ?? ""}
      mode="create"
      onBack={() => router.back()}
      onDeleted={() => router.replace("/module/homeworks")}
      onSaved={(homeworkId) =>
        router.replace({
          params: { homeworkId },
          pathname: "/teacher/homework/[homeworkId]/edit",
        })
      }
    />
  );
}
