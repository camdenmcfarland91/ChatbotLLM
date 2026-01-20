import { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Send, StopCircle, RefreshCw, Zap, Mic, MicOff, Volume2, VolumeX, PanelLeftOpen, PanelLeftClose, Info } from "lucide-react";
import { useConversation, useCreateConversation } from "@/hooks/use-conversations";
import { useChatStream } from "@/hooks/use-chat-stream";
import { Sidebar } from "@/components/Sidebar";
import { ChatMessage } from "@/components/ChatMessage";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { Progress } from "@/components/ui/progress";
import { useVoiceRecorder, useVoiceStream } from "../../replit_integrations/audio";

export default function Chat() {
  const { id: idParam } = useParams();
  const id = idParam ? parseInt(idParam) : null;
  const [input, setInput] = useState("");
  const [, setLocation] = useLocation();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const createConversation = useCreateConversation();
  const { data: conversation, isLoading: isLoadingConv, isError, refetch: refetchConversation } = useConversation(id);
  
  // Custom stream hook for handling real-time responses
  const { 
    sendMessage, 
    stopStream, 
    isLoading: isStreaming, 
    streamingContent 
  } = useChatStream(id || 0);

  // Voice Chat hooks
  const recorder = useVoiceRecorder();
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const voiceStream = useVoiceStream({
    onUserTranscript: (text) => {
      // User transcript handled by server
    },
    onComplete: () => {
      refetchConversation();
    }
  });

  const handleVoiceToggle = async () => {
    if (recorder.state === "recording") {
      const blob = await recorder.stopRecording();
      if (id) {
        await voiceStream.streamVoiceResponse(`/api/conversations/${id}/voice-stream`, blob);
      } else {
        // Handle new conversation with voice
        try {
          const newConv = await createConversation.mutateAsync({ title: "Voice Chat" });
          await voiceStream.streamVoiceResponse(`/api/conversations/${newConv.id}/voice-stream`, blob);
        } catch (err) {
          console.error("Failed to start voice chat", err);
        }
      }
    } else {
      await recorder.startRecording();
    }
  };

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation?.messages, streamingContent, isStreaming, voiceStream.playbackState]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || (isLoadingConv && id)) return;

    const content = input.trim();
    setInput("");

    // Case 1: Start new conversation
    if (!id) {
      try {
        // Create conversation with the first message title (truncated)
        const title = content.length > 30 ? content.slice(0, 30) + "..." : content;
        const newConv = await createConversation.mutateAsync({ title });
        
        // We need to wait for navigation to happen before sending the message
        // But wouter doesn't give us a callback for navigation completion.
        // The mutation onSuccess handles navigation.
        // We'll trust the user to re-send or handle the message sending in a more complex way
        // But for simplicity in this flow, we might need a separate component or logic
        // to handle the "create then send" flow seamlessly.
        
        // BETTER APPROACH:
        // We'll just create it. The mutation onSuccess navigates to /chat/:id.
        // We should pass the initial message to the new page state, but wouter is simple.
        // Strategy: Create conversation -> Navigate -> Wait for ID -> Send message.
        // Since we can't easily pass state, let's actually chain it here manually if possible.
        // But `useChatStream` needs an ID. 
        
        // Workaround: We'll create conversation, get ID, then manually trigger the send logic
        // by making the API call directly or mounting a component that does it.
        // For this implementation, we will clear input and let the user know they are redirected.
        // Or better: Let's create the conversation AND send the message in one go if the API supported it.
        // Since API is split, we will just create the conversation for now.
        
        // Actually, let's implement the "Create then Send" pattern properly:
        // 1. Create conversation
        // 2. Navigate
        // 3. (Tricky part) Send message immediately.
        
        // Simplified for this task: We will just create conversation.
        // The user will see a new empty chat. This is not ideal UX.
        // Let's improve: We'll rely on a URL query param `?initMessage=...` 
        
        setLocation(`/chat/${newConv.id}?init=${encodeURIComponent(content)}`);
      } catch (err) {
        console.error("Failed to start chat", err);
      }
      return;
    }

    // Case 2: Existing conversation
    sendMessage(content);
  };

  // Handle initial message from URL (for new chat flow)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initMsg = params.get("init");
    if (initMsg && id && !isStreaming && conversation) {
      // Remove query param
      window.history.replaceState({}, "", `/chat/${id}`);
      sendMessage(initMsg);
    }
  }, [id, conversation, isStreaming, sendMessage]);


  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (id && isError) {
    return (
      <div className="flex items-center justify-center h-screen flex-col gap-4">
        <h2 className="text-xl font-semibold">Conversation not found</h2>
        <Button onClick={() => setLocation("/")}>Go Home</Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <div className={cn(
        "hidden md:flex flex-col transition-all duration-300 ease-in-out border-r border-border/40",
        sidebarOpen ? "w-[260px]" : "w-0 overflow-hidden border-none"
      )}>
        <Sidebar className="w-[260px]" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Desktop Sidebar Toggle */}
        <div className="hidden md:block absolute left-4 top-4 z-20">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="glass-morphism h-9 w-9 rounded-lg"
          >
            {sidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur z-10 sticky top-0">
          <div className="flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="-ml-2">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-[280px]">
                <Sidebar className="w-full border-none" />
              </SheetContent>
            </Sheet>
            <span className="font-semibold">Chat AI</span>
          </div>
          <ThemeToggle />
        </div>

        {/* Desktop Header (New) */}
        <div className="hidden md:flex items-center justify-between p-4 border-b border-border/40 bg-background/50 backdrop-blur-sm z-10 sticky top-0">
          <div className="flex-1 max-w-xl mx-auto px-12">
            {id && conversation && (
              <div className="flex flex-col gap-2 animate-in fade-in duration-500">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-3 h-3 text-primary" />
                    <span>Context Window</span>
                  </div>
                  <span>{Math.round((JSON.stringify(conversation.messages).length / 4) / 1000)}k / 128k Tokens</span>
                </div>
                <Progress 
                  value={(JSON.stringify(conversation.messages).length / 4) / 128000 * 100} 
                  className="h-1 bg-secondary shadow-inner"
                />
              </div>
            )}
          </div>
          <ThemeToggle />
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto scroll-smooth">
          <div className="max-w-4xl mx-auto w-full">
            {(!id && !isLoadingConv) ? (
            // Empty State / Welcome Screen
            <div className="h-full flex flex-col items-center justify-center p-8 text-center max-w-2xl mx-auto animate-in fade-in zoom-in duration-500">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-primary/20">
                <Zap className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">How can I help you today?</h1>
              <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
                I can help you write code, plan your trip, or answer your questions about the universe.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full text-left">
                {["Explain quantum computing", "Write a Python script for...", "Brainstorm marketing ideas", "Debug this React component"].map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInput(suggestion);
                      // focus textarea
                      const textarea = document.querySelector('textarea');
                      textarea?.focus();
                    }}
                    className="p-4 rounded-xl border border-border bg-card hover:bg-secondary/50 hover:border-primary/30 transition-all text-sm font-medium text-foreground shadow-sm hover:shadow-md"
                  >
                    {suggestion} &rarr;
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Chat History
            <div className="flex flex-col min-h-full pb-32 pt-4">
              {conversation?.messages.map((msg) => (
                <ChatMessage 
                  key={msg.id} 
                  role={msg.role as "user" | "assistant"} 
                  content={msg.content} 
                />
              ))}
              
              {/* Streaming Message Placeholder */}
              {isStreaming && streamingContent && (
                <ChatMessage 
                  role="assistant" 
                  content={streamingContent} 
                  isStreaming={true}
                />
              )}
              
              <div ref={bottomRef} />
            </div>
          )}
          </div>
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-background via-background/80 to-transparent pb-8 pt-12 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="relative flex items-end gap-3 glass-morphism rounded-xl p-3 shadow-2xl premium-border focus-within:ring-2 focus-within:ring-primary/20 transition-all duration-500 group">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask your premium assistant..."
                className="min-h-[60px] max-h-[250px] border-0 focus-visible:ring-0 resize-none py-4 px-4 bg-transparent text-lg placeholder:text-muted-foreground/30 font-medium tracking-tight"
                rows={1}
              />
              
              <div className="pb-1 pr-1 flex gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className={cn(
                    "h-10 w-10 rounded-xl transition-all duration-200",
                    recorder.state === "recording" 
                      ? "bg-red-500/10 text-red-500 animate-pulse" 
                      : "text-muted-foreground hover:bg-secondary"
                  )}
                  onClick={handleVoiceToggle}
                >
                  {recorder.state === "recording" ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </Button>

                {isStreaming ? (
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-10 w-10 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive"
                    onClick={stopStream}
                  >
                    <StopCircle className="w-5 h-5" />
                  </Button>
                ) : (
                  <Button 
                    size="icon" 
                    className={cn(
                      "h-10 w-10 rounded-xl transition-all duration-200",
                      input.trim() 
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:-translate-y-0.5" 
                        : "bg-muted text-muted-foreground hover:bg-secondary"
                    )}
                    disabled={!input.trim() || isLoadingConv}
                    onClick={() => handleSubmit()}
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </div>
            <p className="text-center text-xs text-muted-foreground mt-3">
              AI can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
