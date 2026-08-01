import { useLocalSearchParams, useRouter } from "expo-router";

import { ModuleScreen } from "@/features/modules/module-screen";
import { useAuth } from "@/providers/auth-provider";

export default function ModuleRoute() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { user } = useAuth();
  const canOpenItem =
    (user?.role === "STUDENT" &&
      (slug === "contracts" || slug === "homeworks" || slug === "lessons")) ||
    (user?.role === "TEACHER" && slug === "lessons");

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

    router.push({
      params: { homeworkId: item.id },
      pathname: "/homework/[homeworkId]",
    });
  }

  return (
    <ModuleScreen
      onBack={() => router.back()}
      onOpenItem={canOpenItem ? openItem : undefined}
      slug={slug ?? ""}
    />
  );
}
