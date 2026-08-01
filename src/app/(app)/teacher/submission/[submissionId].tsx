import { Redirect, useLocalSearchParams, useRouter } from "expo-router";

import { TeacherSubmissionDetailScreen } from "@/features/teacher-submissions/teacher-submission-detail-screen";
import { useAuth } from "@/providers/auth-provider";

export default function TeacherSubmissionRoute() {
  const router = useRouter();
  const { submissionId } = useLocalSearchParams<{ submissionId: string }>();
  const { user } = useAuth();

  if (user?.role !== "TEACHER") return <Redirect href="/home" />;

  return (
    <TeacherSubmissionDetailScreen
      onBack={() => router.back()}
      submissionId={submissionId ?? ""}
    />
  );
}
