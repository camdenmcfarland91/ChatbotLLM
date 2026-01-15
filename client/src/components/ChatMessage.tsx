import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { User, Sparkles, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { motion } from "framer-motion";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
  const isUser = role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "py-8 w-full border-b border-border/40 last:border-0",
        isUser ? "bg-background" : "bg-secondary/10"
      )}
    >
      <div className="max-w-3xl mx-auto px-4 flex gap-4 md:gap-6">
        <div className={cn(
          "shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center shadow-sm",
          isUser 
            ? "bg-secondary text-secondary-foreground" 
            : "bg-primary text-primary-foreground shadow-primary/20"
        )}>
          {isUser ? <User className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
        </div>

        <div className="flex-1 min-w-0 space-y-2 overflow-hidden">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-sm">
              {isUser ? "You" : "AI Assistant"}
            </span>
          </div>
          
          <div className="prose prose-neutral dark:prose-invert max-w-none text-base leading-relaxed">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || "");
                  const codeString = String(children).replace(/\n$/, "");
                  
                  return !inline && match ? (
                    <div className="relative group rounded-lg overflow-hidden my-4 border border-border shadow-sm">
                      <div className="flex items-center justify-between px-4 py-2 bg-secondary/80 border-b border-border text-xs text-muted-foreground font-mono">
                        <span>{match[1]}</span>
                        <button 
                          onClick={() => handleCopy(codeString)}
                          className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                        >
                          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          {copied ? "Copied!" : "Copy"}
                        </button>
                      </div>
                      <div className="overflow-x-auto bg-background/50 p-4">
                        <code className={className} {...props}>
                          {children}
                        </code>
                      </div>
                    </div>
                  ) : (
                    <code className={cn("bg-secondary/50 rounded px-1.5 py-0.5 text-sm font-mono text-primary", className)} {...props}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {content}
            </ReactMarkdown>
            
            {isStreaming && (
              <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse align-middle" />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
