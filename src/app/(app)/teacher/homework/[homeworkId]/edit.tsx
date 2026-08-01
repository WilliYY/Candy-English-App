import { Redirect, useLocalSearchParams, useRouter } from "expo-router";

import { TeacherHomeworkEditorScreen } from "@/features/teacher-homeworks/teacher-homework-editor-screen";
import { useAuth } from "@/providers/auth-provider";

export default function EditTeacherHomeworkRoute() {
  const router = useRouter();
  const { homeworkId } = useLocalSearchParams<{ homeworkId: string }>();
  const { user } = useAuth();

  if (user?.role !== "TEACHER") return <Redirect href="/home" />;

  return (
    <TeacherHomeworkEditorScreen
      homeworkId={homeworkId ?? ""}
      mode="edit"
      onBack={() => router.back()}
      onDeleted={() => router.replace("/module/homeworks")}
      onEditInteractiveFields={(interactiveHomeworkId) =>
        router.push({
          params: { homeworkId: interactiveHomeworkId },
          pathname: "/teacher/homework/[homeworkId]/fields",
        })
      }
      onSaved={(savedHomeworkId) =>
        router.replace({
          params: { homeworkId: savedHomeworkId },
          pathname: "/teacher/homework/[homeworkId]/edit",
        })
      }
    />
  );
}
