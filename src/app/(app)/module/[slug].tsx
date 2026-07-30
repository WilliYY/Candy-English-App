import { useLocalSearchParams, useRouter } from "expo-router";

import { ModuleScreen } from "@/features/modules/module-screen";
import { useAuth } from "@/providers/auth-provider";

export default function ModuleRoute() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { user } = useAuth();

  return (
    <ModuleScreen
      onBack={() => router.back()}
      onOpenItem={
        slug === "homeworks" && user?.role === "STUDENT"
          ? (item) =>
              router.push({
                params: { homeworkId: item.id },
                pathname: "/homework/[homeworkId]",
              })
          : undefined
      }
      slug={slug ?? ""}
    />
  );
}
