import { Redirect, useLocalSearchParams, useRouter } from "expo-router";

import { LessonScreen } from "@/features/lessons/lesson-screen";
import { TeacherLessonScreen } from "@/features/teacher-lessons/teacher-lesson-screen";
import { useAuth } from "@/providers/auth-provider";

export default function LessonRoute() {
  const router = useRouter();
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const { user } = useAuth();

  if (user?.role === "TEACHER") {
    return (
      <TeacherLessonScreen
        lessonId={lessonId ?? ""}
        onBack={() => router.back()}
        onEdit={() =>
          router.push({
            params: { lessonId: lessonId ?? "" },
            pathname: "/teacher/lesson/[lessonId]/edit",
          })
        }
      />
    );
  }

  if (user?.role !== "STUDENT") {
    return <Redirect href="/home" />;
  }

  return (
    <LessonScreen
      lessonId={lessonId ?? ""}
      onBack={() => router.back()}
      onOpenHomework={(homeworkId) =>
        router.push({
          params: { homeworkId },
          pathname: "/homework/[homeworkId]",
        })
      }
    />
  );
}
