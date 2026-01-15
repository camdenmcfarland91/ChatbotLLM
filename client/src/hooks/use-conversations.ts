import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { useLocation } from "wouter";
import { conversations, messages } from "@shared/schema";

// Type definitions inferred from schema
type Conversation = typeof conversations.$inferSelect;
type Message = typeof messages.$inferSelect;
type ConversationDetail = Conversation & { messages: Message[] };

// GET /api/conversations
export function useConversations() {
  return useQuery({
    queryKey: [api.conversations.list.path],
    queryFn: async () => {
      const res = await fetch(api.conversations.list.path);
      if (!res.ok) throw new Error("Failed to fetch conversations");
      return api.conversations.list.responses[200].parse(await res.json());
    },
  });
}

// GET /api/conversations/:id
export function useConversation(id: number | null) {
  return useQuery({
    queryKey: [api.conversations.get.path, id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) throw new Error("ID required");
      const url = buildUrl(api.conversations.get.path, { id });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch conversation");
      return api.conversations.get.responses[200].parse(await res.json());
    },
  });
}

// POST /api/conversations
export function useCreateConversation() {
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  return useMutation({
    mutationFn: async ({ title }: { title: string }) => {
      const res = await fetch(api.conversations.create.path, {
        method: api.conversations.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error("Failed to create conversation");
      return api.conversations.create.responses[201].parse(await res.json());
    },
    onSuccess: (newConv) => {
      queryClient.invalidateQueries({ queryKey: [api.conversations.list.path] });
      // Optional: navigate to the new conversation immediately
      setLocation(`/chat/${newConv.id}`);
    },
  });
}

// DELETE /api/conversations/:id
export function useDeleteConversation() {
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.conversations.delete.path, { id });
      const res = await fetch(url, { method: api.conversations.delete.method });
      if (!res.ok) throw new Error("Failed to delete conversation");
    },
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: [api.conversations.list.path] });
      
      // If we're currently viewing the deleted conversation, go home
      if (location === `/chat/${deletedId}`) {
        setLocation("/");
      }
    },
  });
}
