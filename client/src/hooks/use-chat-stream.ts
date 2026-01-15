import { useState, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

interface UseChatStreamOptions {
  onFinish?: () => void;
  onError?: (error: Error) => void;
}

export function useChatStream(conversationId: number, options: UseChatStreamOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();

  const sendMessage = useCallback(async (content: string) => {
    try {
      setIsLoading(true);
      setStreamingContent(""); // Clear previous stream buffer
      abortControllerRef.current = new AbortController();

      const url = buildUrl("/api/conversations/:id/messages", { id: conversationId });
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n\n");
          
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.content) {
                  setStreamingContent((prev) => prev + data.content);
                } else if (data.done) {
                  // Stream finished
                } else if (data.error) {
                  throw new Error(data.error);
                }
              } catch (e) {
                console.error("Error parsing stream chunk:", e);
              }
            }
          }
        }
      }

    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Stream error:", error);
        options.onError?.(error);
      }
    } finally {
      setIsLoading(false);
      setStreamingContent(""); // Clear local buffer
      
      // Invalidate query to fetch the full persisted message history including the new AI response
      await queryClient.invalidateQueries({ 
        queryKey: [api.conversations.get.path, conversationId] 
      });
      
      options.onFinish?.();
    }
  }, [conversationId, queryClient, options]);

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  }, []);

  return {
    sendMessage,
    stopStream,
    isLoading,
    streamingContent,
  };
}
