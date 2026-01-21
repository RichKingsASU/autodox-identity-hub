import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, MessageCircle } from "lucide-react";
import { GradientButton } from "@/components/ui/GradientButton";
import { cn } from "@/lib/utils";

interface AIAssistantProps {
  context?: string;
}

const contextualHints: Record<string, string[]> = {
  overview: [
    "How can I improve my verification success rate?",
    "Show me trends for the past week",
    "What's causing verification failures?",
  ],
  sms: [
    "Why are some messages failing?",
    "How do I filter by status?",
    "Export logs to CSV",
  ],
  api: [
    "How do I rotate my API keys?",
    "What's the difference between test and live keys?",
    "Best practices for key management",
  ],
  settings: [
    "How do I enable webhooks?",
    "Update notification preferences",
    "Add team members",
  ],
};

export function AIAssistant({ context = "overview" }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([
    { role: "assistant", content: "Hi! I'm your Autodox assistant. I can help you navigate the platform, debug issues, or answer questions about identity verification. What can I help you with?" }
  ]);

  const hints = contextualHints[context] || contextualHints.overview;

  const handleSend = () => {
    if (!message.trim()) return;
    
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setMessage("");
    
    // Simulate AI response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I understand you need help with that. Let me look into it for you..." }
      ]);
    }, 1000);
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 h-14 w-14 rounded-full btn-gradient flex items-center justify-center shadow-lg z-50",
          "pulse-glow"
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Sparkles className="h-6 w-6 text-primary-foreground" />
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-96 max-h-[500px] bg-card border border-border rounded-3xl shadow-elevated overflow-hidden z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full btn-gradient flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Autodox Assistant</p>
                  <p className="text-xs text-muted-foreground">Always here to help</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[280px]">
              {messages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                    msg.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "bg-secondary text-foreground"
                  )}
                >
                  {msg.content}
                </motion.div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="px-4 pb-2">
              <p className="text-xs text-muted-foreground mb-2">Suggestions:</p>
              <div className="flex flex-wrap gap-2">
                {hints.slice(0, 2).map((hint) => (
                  <button
                    key={hint}
                    onClick={() => setMessage(hint)}
                    className="text-xs px-3 py-1.5 rounded-full bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask anything..."
                  className="flex-1 h-10 px-4 rounded-xl bg-[hsl(var(--surface-recessed))] border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
                <GradientButton
                  size="icon"
                  onClick={handleSend}
                  disabled={!message.trim()}
                  className="h-10 w-10"
                >
                  <Send className="h-4 w-4" />
                </GradientButton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
