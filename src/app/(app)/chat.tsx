import { useRouter } from "expo-router";

import { ChatScreen } from "@/features/chat/chat-screen";

export default function ChatRoute() {
  const router = useRouter();

  return <ChatScreen onBack={() => router.back()} />;
}
