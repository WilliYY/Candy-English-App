import { Redirect, useRouter } from "expo-router";

import { TeacherCattyScreen } from "@/features/catty/teacher-catty-screen";
import { useAuth } from "@/providers/auth-provider";

export default function TeacherCattyRoute() {
  const router = useRouter();
  const { user } = useAuth();

  if (!user) return null;
  if (user.role !== "TEACHER") return <Redirect href="/home" />;

  return <TeacherCattyScreen onBack={() => router.back()} />;
}
