import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/stores/authStore";
import toast from "react-hot-toast";

interface MessagingPanelProps {
  recipients: { id: number; name: string; role: string }[];
}

export function MessagingPanel({ recipients }: MessagingPanelProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [content, setContent] = useState("");
  const [recipientId, setRecipientId] = useState<number | null>(recipients[0]?.id ?? null);

  const messagesQuery = useQuery({
    ...trpc.messaging.getMessages.queryOptions({ userId: user?.id ?? 0 }),
    enabled: Boolean(user?.id),
  });

  const sendMessageMutation = useMutation(
    trpc.messaging.sendMessage.mutationOptions({
      onSuccess: () => {
        setContent("");
        queryClient.invalidateQueries({ queryKey: trpc.messaging.getMessages.queryKey() });
        queryClient.invalidateQueries({ queryKey: trpc.messaging.getUnreadCount.queryKey() });
      },
      onError: (error) => toast.error(error.message || "Failed to send message"),
    })
  );

  const markReadMutation = useMutation(
    trpc.messaging.markMessageRead.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.messaging.getUnreadCount.queryKey() });
      },
    })
  );

  const filteredMessages = useMemo(() => {
    if (!messagesQuery.data || !recipientId || !user?.id) return messagesQuery.data ?? [];
    return messagesQuery.data.filter(
      (m: any) =>
        (m.senderId === user.id && m.recipientId === recipientId) ||
        (m.recipientId === user.id && m.senderId === recipientId)
    );
  }, [messagesQuery.data, recipientId, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const unreadForMe = filteredMessages.filter(
      (m: any) => m.recipientId === user.id && !m.isRead
    );
    unreadForMe.forEach((m) => {
      markReadMutation.mutate({ messageId: m.id });
    });
  }, [filteredMessages, markReadMutation, user?.id]);

  const handleSendMessage = () => {
    if (!user?.id || !recipientId) {
      toast.error("Select a recipient");
      return;
    }
    if (!content.trim()) return;
    sendMessageMutation.mutate({ senderId: user.id, recipientId, content: content.trim() });
  };

  if (messagesQuery.isLoading) {
    return (
      <div className="p-4 text-sm text-gray-600 flex items-center gap-2">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
        Loading messages...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-primary uppercase">Messaging</p>
          <h3 className="text-lg font-bold text-gray-900">Inbox</h3>
        </div>
        <select
          value={recipientId ?? ""}
          onChange={(e) => setRecipientId(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        >
          {recipients.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} ({r.role})
            </option>
          ))}
        </select>
      </div>

      <div className="p-4 space-y-3 max-h-64 overflow-y-auto bg-gray-50">
        {filteredMessages.length === 0 ? (
          <p className="text-sm text-gray-600">No messages yet.</p>
        ) : (
          filteredMessages.map((m: any) => (
            <div
              key={m.id}
              className={`text-sm p-2 rounded-lg ${
                m.senderId === user?.id ? "bg-primary/10 text-primary" : "bg-white border border-gray-200"
              }`}
            >
              <p>{m.content}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(m.createdAt).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-gray-200 flex items-center gap-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-primary focus:border-primary"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />
        <button
          onClick={handleSendMessage}
          disabled={sendMessageMutation.isPending}
          className="px-3 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark transition disabled:opacity-60"
        >
          Send
        </button>
      </div>
    </div>
  );
}
