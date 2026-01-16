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
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "flex w-full mb-10",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div className={cn(
        "max-w-[85%] md:max-w-[80%] px-7 py-5 rounded-2xl shadow-2xl transition-all duration-500 premium-border",
        isUser 
          ? "bg-primary text-primary-foreground shadow-primary/30 font-bold" 
          : "glass-morphism text-foreground/95 shadow-black/40"
      )}>
        {!isUser && (
          <div className="flex items-center gap-2 mb-3 text-[10px] uppercase tracking-[0.2em] font-black text-primary animate-pulse">
            <Sparkles className="w-4 h-4" />
            <span>Premium Intelligence</span>
          </div>
        )}
        
        <div className="prose prose-neutral dark:prose-invert max-w-none text-base leading-relaxed">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || "");
                const codeString = String(children).replace(/\n$/, "");
                
                return !inline && match ? (
                  <div className="relative group rounded-xl overflow-hidden my-4 border border-border/50 shadow-md">
                    <div className="flex items-center justify-between px-4 py-2 bg-secondary/80 backdrop-blur-md border-b border-border/50 text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                      <span>{match[1]}</span>
                      <button 
                        onClick={() => handleCopy(codeString)}
                        className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                      >
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <div className="overflow-x-auto bg-background/30 p-4 font-mono text-sm leading-relaxed">
                      <code className={className} {...props}>
                        {children}
                      </code>
                    </div>
                  </div>
                ) : (
                  <code className={cn("bg-secondary/50 rounded-md px-1.5 py-0.5 text-sm font-mono text-primary font-medium", className)} {...props}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {content}
          </ReactMarkdown>
          
          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-1 bg-primary animate-pulse align-middle rounded-sm" />
          )}
        </div>
      </div>
    </motion.div>
  );
}
