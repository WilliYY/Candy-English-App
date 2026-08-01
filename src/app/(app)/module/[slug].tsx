import { useLocalSearchParams, useRouter } from "expo-router";

import { ModuleScreen } from "@/features/modules/module-screen";
import { TeacherSubmissionQueueScreen } from "@/features/teacher-submissions/teacher-submission-queue-screen";
import { useAuth } from "@/providers/auth-provider";

export default function ModuleRoute() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { user } = useAuth();
  const canOpenItem =
    (user?.role === "STUDENT" &&
      (slug === "contracts" || slug === "homeworks" || slug === "lessons")) ||
    (user?.role === "TEACHER" &&
      (slug === "contracts" ||
        slug === "homeworks" ||
        slug === "lessons" ||
        slug === "secretary"));

  function openItem(item: { id: string }) {
    if (slug === "contracts") {
      router.push({
        params: { contractId: item.id },
        pathname: "/contract/[contractId]",
      });
      return;
    }

    if (slug === "lessons") {
      router.push({
        params: { lessonId: item.id },
        pathname: "/lesson/[lessonId]",
      });
      return;
    }

    if (user?.role === "TEACHER" && slug === "secretary") {
      router.push({
        params: { requestId: item.id },
        pathname: "/teacher/pre-registration/[requestId]",
      });
      return;
    }

    if (user?.role === "TEACHER") {
      router.push({
        params: { homeworkId: item.id },
        pathname: "/teacher/homework/[homeworkId]/edit",
      });
      return;
    }

    router.push({
      params: { homeworkId: item.id },
      pathname: "/homework/[homeworkId]",
    });
  }

  if (user?.role === "TEACHER" && slug === "submissions") {
    return (
      <TeacherSubmissionQueueScreen
        onBack={() => router.back()}
        onOpenSubmission={(submissionId) =>
          router.push({
            params: { submissionId },
            pathname: "/teacher/submission/[submissionId]",
          })
        }
      />
    );
  }

  return (
    <ModuleScreen
      onBack={() => router.back()}
      onOpenItem={canOpenItem ? openItem : undefined}
      onPrimaryAction={
        user?.role === "TEACHER"
          ? slug === "lessons"
            ? () => router.push("/teacher/lesson/new")
            : slug === "homeworks"
              ? () => router.push("/teacher/homework/new")
              : undefined
          : undefined
      }
      primaryActionLabel={
        user?.role === "TEACHER"
          ? slug === "lessons"
            ? "Criar nova aula"
            : slug === "homeworks"
              ? "Criar nova tarefa"
              : undefined
          : undefined
      }
      slug={slug ?? ""}
    />
  );
}
