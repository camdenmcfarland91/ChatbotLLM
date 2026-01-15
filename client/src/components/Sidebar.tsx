import { Link, useLocation } from "wouter";
import { Plus, MessageSquare, Trash2, Edit2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useConversations, useDeleteConversation, useUpdateConversation } from "@/hooks/use-conversations";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location, setLocation] = useLocation();
  const { data: conversations, isLoading } = useConversations();
  const deleteMutation = useDeleteConversation();
  const updateMutation = useUpdateConversation();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");

  // Extract ID from /chat/:id
  const currentId = location.startsWith("/chat/") 
    ? parseInt(location.split("/")[2]) 
    : null;

  const handleStartRename = (e: React.MouseEvent, id: number, title: string) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(title);
  };

  const handleRename = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (editingId && editTitle.trim()) {
      await updateMutation.mutateAsync({ id: editingId, title: editTitle.trim() });
      setEditingId(null);
    }
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(null);
  };

  return (
    <div className={cn("flex flex-col h-full bg-secondary/30 border-r border-border", className)}>
      <div className="p-4">
        <Button 
          variant="outline" 
          className="w-full justify-start gap-2 shadow-sm hover:shadow-md transition-all border-dashed border-border hover:border-primary/50"
          onClick={() => setLocation("/")}
        >
          <Plus className="w-4 h-4" />
          New Chat
        </Button>
      </div>

      <div className="px-4 pb-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recent</p>
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 p-2">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-9 rounded-lg bg-secondary/50 animate-pulse" />
            ))
          ) : conversations?.length === 0 ? (
            <div className="text-center py-8 px-4 text-muted-foreground text-sm">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p>No conversations yet.</p>
            </div>
          ) : (
            conversations?.map((conv) => (
              <div
                key={conv.id}
                className="group relative flex items-center"
              >
                {editingId === conv.id ? (
                  <div className="flex-1 flex items-center gap-1 px-2 py-1 bg-secondary rounded-lg">
                    <input
                      autoFocus
                      className="flex-1 bg-transparent text-sm outline-none w-full"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(e as any);
                        if (e.key === "Escape") handleCancelRename(e as any);
                      }}
                    />
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleRename}>
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleCancelRename}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Link 
                      href={`/chat/${conv.id}`}
                      className={cn(
                        "flex-1 flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-200",
                        currentId === conv.id 
                          ? "bg-secondary font-medium text-primary shadow-sm" 
                          : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                      )}
                    >
                      <MessageSquare className="w-4 h-4 shrink-0 opacity-70" />
                      <span className="truncate pr-12">{conv.title}</span>
                    </Link>

                    <div className={cn(
                      "absolute right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity",
                      currentId === conv.id && "opacity-100"
                    )}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7"
                        onClick={(e) => handleStartRename(e, conv.id, conv.title)}
                      >
                        <Edit2 className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7"
                        onClick={(e) => {
                          e.preventDefault();
                          if (confirm("Delete this conversation?")) {
                            deleteMutation.mutate(conv.id);
                          }
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive transition-colors" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border mt-auto">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground text-xs font-bold shadow-lg shadow-primary/20">
            AI
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate">Guest User</p>
            <p className="text-xs text-muted-foreground truncate">Pro Plan</p>
          </div>
        </div>
      </div>
    </div>
  );
}
