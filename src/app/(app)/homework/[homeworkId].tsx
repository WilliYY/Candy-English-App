import { useLocalSearchParams, useRouter } from "expo-router";

import { HomeworkScreen } from "@/features/homework/homework-screen";

export default function HomeworkRoute() {
  const router = useRouter();
  const { homeworkId } = useLocalSearchParams<{ homeworkId: string }>();

  return (
    <HomeworkScreen
      homeworkId={homeworkId ?? ""}
      onBack={() => router.back()}
    />
  );
}
