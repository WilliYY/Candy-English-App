import { useLocalSearchParams, useRouter } from "expo-router";

import { LessonScreen } from "@/features/lessons/lesson-screen";

export default function LessonRoute() {
  const router = useRouter();
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();

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
