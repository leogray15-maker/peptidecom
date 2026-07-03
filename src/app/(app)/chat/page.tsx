import { PageHeader } from "@/components/page-header";
import { getCurrentUser } from "@/lib/auth";
import { ChatClient } from "@/components/chat-client";

export const metadata = { title: "Live chat" };

export default async function ChatPage() {
  const user = await getCurrentUser();
  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <PageHeader
        title="Live chat"
        subtitle="Real-time member chat. Be respectful — this is a moderated space."
      />
      <div className="min-h-0 flex-1">
        <ChatClient
          me={{
            uid: user?.firebaseUid ?? "",
            name: user?.name ?? "Member",
            image: user?.image ?? null,
          }}
        />
      </div>
    </div>
  );
}
