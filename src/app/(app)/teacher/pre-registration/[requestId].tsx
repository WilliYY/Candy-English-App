import { Redirect, useLocalSearchParams, useRouter } from "expo-router";

import { TeacherPreRegistrationScreen } from "@/features/teacher-secretary/teacher-pre-registration-screen";
import { useAuth } from "@/providers/auth-provider";

export default function TeacherPreRegistrationRoute() {
  const router = useRouter();
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const { user } = useAuth();

  if (user?.role !== "TEACHER") return <Redirect href="/home" />;

  return (
    <TeacherPreRegistrationScreen
      onBack={() => router.back()}
      requestId={requestId ?? ""}
    />
  );
}
