import { Redirect, useLocalSearchParams, useRouter } from "expo-router";

import { TeacherInteractiveFieldEditorScreen } from "@/features/teacher-homeworks/teacher-interactive-field-editor-screen";
import { useAuth } from "@/providers/auth-provider";

export default function TeacherInteractiveFieldsRoute() {
  const router = useRouter();
  const { homeworkId } = useLocalSearchParams<{ homeworkId: string }>();
  const { user } = useAuth();

  if (user?.role !== "TEACHER") return <Redirect href="/home" />;

  return (
    <TeacherInteractiveFieldEditorScreen
      homeworkId={homeworkId ?? ""}
      onBack={() => router.back()}
    />
  );
}
