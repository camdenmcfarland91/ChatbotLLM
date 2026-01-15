import { Link, useLocation } from "wouter";
import { Plus, MessageSquare, Trash2, PanelLeftClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useConversations, useDeleteConversation } from "@/hooks/use-conversations";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const { data: conversations, isLoading } = useConversations();
  const deleteMutation = useDeleteConversation();

  // Extract ID from /chat/:id
  const currentId = location.startsWith("/chat/") 
    ? parseInt(location.split("/")[2]) 
    : null;

  return (
    <div className={cn("flex flex-col h-full bg-secondary/30 border-r border-border", className)}>
      <div className="p-4">
        <Link href="/" className="w-full">
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2 shadow-sm hover:shadow-md transition-all border-dashed border-border hover:border-primary/50"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </Button>
        </Link>
      </div>

      <div className="px-4 pb-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Recent</p>
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 p-2">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-9 rounded-lg bg-secondary/50 animate-pulse" />
            ))
          ) : conversations?.length === 0 ? (
            <div className="text-center py-8 px-4 text-muted-foreground text-sm">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p>No conversations yet.</p>
              <p className="text-xs mt-1 opacity-60">Start a new chat to begin.</p>
            </div>
          ) : (
            conversations?.map((conv) => (
              <div
                key={conv.id}
                className="group relative flex items-center"
              >
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
                  <span className="truncate pr-8">{conv.title}</span>
                </Link>

                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "absolute right-1 w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity",
                    currentId === conv.id && "opacity-100" // Always show delete on active item if desired, or keep hidden until hover
                  )}
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
